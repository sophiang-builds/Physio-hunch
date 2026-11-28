// Engine tests. Compiled together with ios/PhysioHunch/Engine/*.swift by CI:
//   swiftc ios/PhysioHunch/Engine/*.swift ios/EngineTests/main.swift -o engine-tests && ./engine-tests ios/PhysioHunch/Resources/Data
import Foundation

let dataDir = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "ios/PhysioHunch/Resources/Data")
let release = try Library(directory: dataDir)
let fixtureURL = URL(fileURLWithPath: "ios/EngineTests/Fixtures/cases.json")
let fixtures = try JSONDecoder().decode([PatientCase].self, from: Data(contentsOf: fixtureURL))
let library = Library(assessments: release.assessments, cases: fixtures)
var failures = 0
func expect(_ ok: Bool, _ message: String) { if !ok { failures += 1; print("FAIL:", message) } }
func patient(_ id: String) -> PatientCase { library.cases.first { $0.id == id }! }
expect(release.cases.isEmpty, "the release bank must stay empty during review")
let expansionData = try Data(contentsOf: dataDir.appendingPathComponent("expansion-cases.json"))
let expansion = try JSONDecoder().decode([PatientCase].self, from: expansionData)
expect(expansion.isEmpty, "the expansion release bank must stay empty during review")
let resolver = Resolver(assessments: library.assessments)

// Resolver
let ankle = patient("ankle")
for (input, want) in [("slr", "slr"), ("straight leg raise", "slr"), ("do a slump test please", "slump"),
                      ("lachmann", "lachman"), ("ascultation", "auscultation"), ("anterior drawer", "ankle_drawer"),
                      ("ottawa ankle rules", "ottawa_ankle"), ("check her blood pressure", "obs"), ("x-ray", "imaging"),
                      ("hawkins kennedy", "impingement"), ("single leg balance", "standing_balance")] {
    let got = resolver.resolve(input, relevantTo: ankle)?.id
    expect(got == want, "\"\(input)\" resolved to \(got ?? "nil"), wanted \(want)")
}
expect(resolver.resolve("banana", relevantTo: ankle) == nil, "banana should not resolve")
for a in library.assessments { for alias in a.aliases { expect(resolver.resolve(alias, relevantTo: ankle) != nil, "alias \(alias) unresolved") } }
for c in library.cases {
    for id in Array(c.findings.keys) + c.key + c.given { expect(library.assessment(id) != nil, "\(c.id) uses unknown assessment \(id)") }
    for id in c.given { expect(c.findings[id] != nil, "\(c.id) gives \(id) up front but has no finding for it") }
}

// Multiple-choice calls: the right option is correct, decoys are wrong
for c in library.cases {
    expect(TextMatch.matchesAny(c.answers, in: c.call.correct), "\(c.id) correct option doesn't match its answers")
    for d in c.call.decoys {
        expect(!TextMatch.matchesAny(c.answers, in: d) && !TextMatch.matchesAny(c.close, in: d), "\(c.id) decoy '\(d)' would score")
    }
}
// Suggestions are stable and always include something useful
do {
    let g = Game(caseIndex: 0, library: library)
    let a = g.suggestions.map(\.id), b = g.suggestions.map(\.id)
    expect(a == b && a.count == 6, "suggestions not stable")
    expect(g.suggestions.contains { g.state.patient.findings[$0.id] != nil }, "suggestions have nothing useful")
}

// Full games
func play(_ id: String, _ moves: [String]) -> GameState {
    let index = library.cases.firstIndex { $0.id == id }!
    let game = Game(caseIndex: index, library: library)
    for m in moves { print("  \(id) > \(m) -> \(game.submit(m))") }
    return game.state
}
var s = play("ankle", ["what happened", "banana", "ottawa", "ottawa", "palpation", "anterior drawer", "lachman", "single leg balance", "lateral ankle sprain"])
expect(s.verdict == .correct && s.turns.count == 5 && s.hits == 4, "ankle game")
expect(!s.has("hpc"), "the history is given up front and must not use a check")
expect(s.score == 50, "five checks and a right call scores 50, got \(s.score)")
s = play("stroke", ["sit to stand", "obs", "tone", "babinski", "neglect", "right MCA stroke"])
expect(s.flags.count == 1 && s.verdict == .correct, "stroke safety flag")
s = play("cardiac", ["what makes it worse", "associated symptoms", "I think it's rotator cuff"])
expect(s.verdict == .wrong && s.turns.count == 2 && s.score == 0, "early wrong call")
s = play("ankle", ["ottawa", "anterior drawer", "I think lateral ankle sprain"])
expect(s.verdict == .correct && s.score == 80, "two checks and a right call scores 80, got \(s.score)")
s = play("postop", ["obs", "auscultation", "cxr", "percussion", "cough", "sputum retention"])
expect(s.verdict == .close, "postop close call")

print(failures == 0 ? "All engine checks passed" : "\(failures) failures")
exit(failures == 0 ? 0 : 1)
