import Foundation

/// Help for players who don't know physiotherapy. Deterministic: the same patient
/// and turn always give the same suggestions, so nothing here is AI.
enum Hints {
    /// Tappable assessment ideas: a few that will reveal something for this patient,
    /// mixed with plausible ones that won't, so choosing still takes thought.
    static func suggestions(for state: GameState, from library: Library, count: Int = 6, useful: Int = 2) -> [Assessment] {
        var rng = SeededGenerator(seed: Self.seed(state.patient.id, state.turns.count))
        let open = library.assessments.filter { !state.has($0.id) }
        let relevant = open.filter { state.patient.findings[$0.id] != nil }.shuffled(using: &rng).prefix(useful)
        let others = open.filter { state.patient.findings[$0.id] == nil }.shuffled(using: &rng).prefix(count - relevant.count)
        return Array(relevant + others).shuffled(using: &rng)
    }

    /// The diagnosis choices: the right answer plus the case's decoys, in a stable order.
    static func callOptions(for patient: PatientCase) -> [String] {
        var rng = SeededGenerator(seed: Self.seed(patient.id, 99))
        return ([patient.call.correct] + patient.call.decoys).shuffled(using: &rng)
    }

    /// Stable across launches (String.hashValue is not).
    static func seed(_ text: String, _ salt: Int) -> UInt64 {
        text.utf8.reduce(UInt64(5381) &+ UInt64(salt)) { ($0 << 5) &+ $0 &+ UInt64($1) }
    }
}

/// SplitMix64.
struct SeededGenerator: RandomNumberGenerator {
    private var state: UInt64
    init(seed: UInt64) { state = seed }
    mutating func next() -> UInt64 {
        state &+= 0x9E3779B97F4A7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        return z ^ (z >> 31)
    }
}
