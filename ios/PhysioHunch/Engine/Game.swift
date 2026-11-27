import Foundation
import Observation

/// Loads the bundled JSON content.
struct Library {
    static let shared = Library()

    let assessments: [Assessment]
    let cases: [PatientCase]

    init(bundle: Bundle = .main) {
        assessments = Library.load("assessments", from: bundle)
        cases = Library.load("cases", from: bundle)
    }

    init(assessments: [Assessment], cases: [PatientCase]) {
        self.assessments = assessments
        self.cases = cases
    }

    /// Loads assessments.json and cases.json from a folder (used by the engine tests).
    init(directory: URL) throws {
        let decoder = JSONDecoder()
        assessments = try decoder.decode([Assessment].self, from: Data(contentsOf: directory.appendingPathComponent("assessments.json")))
        cases = try decoder.decode([PatientCase].self, from: Data(contentsOf: directory.appendingPathComponent("cases.json")))
    }

    func assessment(_ id: String) -> Assessment? { assessments.first { $0.id == id } }

    private static func load<T: Decodable>(_ name: String, from bundle: Bundle) -> T {
        guard let url = bundle.url(forResource: name, withExtension: "json"),
              let data = try? Data(contentsOf: url) else {
            fatalError("\(name).json is missing from the app bundle")
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { fatalError("\(name).json could not be read: \(error)") }
    }
}

/// Runs one consultation by passing player input through the mechanics.
@Observable
final class Game {
    enum Outcome {
        case revealed(Turn)
        case silent(Turn)
        case rejected(String)
        case unknown
        case called(Verdict)
    }

    private(set) var state: GameState
    private(set) var caseIndex: Int
    private let library: Library
    private let resolver: Resolver
    private let mechanics: [Mechanic]

    init(caseIndex: Int = 0, library: Library = .shared, mechanics: [Mechanic] = Mechanics.standard) {
        self.library = library
        self.mechanics = mechanics
        self.resolver = Resolver(assessments: library.assessments)
        self.caseIndex = library.cases.isEmpty ? 0 : abs(caseIndex) % library.cases.count
        self.state = GameState(patient: library.cases[self.caseIndex])
        prepare()
    }

    private func prepare() {
        for mechanic in mechanics { mechanic.prepare(&state) }
    }

    /// How much colour the backdrop has: one fifth per finding, full at the debrief.
    var reveal: Double {
        state.phase == .done ? 1 : Double(state.hits) / Double(max(1, state.limit))
    }

    @discardableResult
    func submit(_ raw: String) -> Outcome {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, state.phase != .done else { return .unknown }
        if state.phase == .calling || Self.looksLikeCall(text) { return makeCall(text) }

        guard let assessment = resolver.resolve(text, relevantTo: state.patient) else { return .unknown }
        for mechanic in mechanics {
            if let message = mechanic.veto(assessment, state: state) { return .rejected(message) }
        }
        var turn = Turn(number: state.turns.count + 1, assessment: assessment, finding: state.patient.findings[assessment.id])
        for mechanic in mechanics { mechanic.shape(&turn, state: state) }
        state.turns.append(turn)
        for mechanic in mechanics { mechanic.after(&state) }
        return turn.isHit ? .revealed(turn) : .silent(turn)
    }

    /// Lets the player stop early and make the call.
    func beginCall() {
        if state.phase == .assessing { state.phase = .calling }
    }

    func nextPatient() {
        caseIndex = (caseIndex + 1) % library.cases.count
        state = GameState(patient: library.cases[caseIndex])
        prepare()
    }

    private func makeCall(_ text: String) -> Outcome {
        for mechanic in mechanics { mechanic.judge(text, state: &state) }
        return .called(state.verdict ?? .wrong)
    }

    /// Typing "I think it's..." or "diagnosis:" makes the call straight away.
    static func looksLikeCall(_ text: String) -> Bool {
        let n = TextMatch.normalise(text)
        return ["i think", "i reckon", "my diagnosis", "diagnosis", "my call"].contains { n.hasPrefix($0) }
    }
}
