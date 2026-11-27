import Foundation

/// A mechanic is a small rule that plugs into the turn pipeline.
///
/// Pipeline for an assessment:
///   resolve text -> every mechanic's `veto` (any message blocks the turn, no slot used)
///                -> build the turn -> every mechanic's `shape` (can flag or alter it)
///                -> commit -> every mechanic's `after` (can change phase, limits...)
/// Pipeline for the final call:
///   every mechanic's `judge`, in list order.
/// When a patient loads, every mechanic's `prepare` runs first.
///
/// To add a mechanic: write a struct that conforms to `Mechanic`,
/// implement only the hooks you need, and add it to `Mechanics.standard`.
protocol Mechanic {
    func prepare(_ state: inout GameState)
    func veto(_ assessment: Assessment, state: GameState) -> String?
    func shape(_ turn: inout Turn, state: GameState)
    func after(_ state: inout GameState)
    func judge(_ call: String, state: inout GameState)
}

extension Mechanic {
    func prepare(_ state: inout GameState) {}
    func veto(_ assessment: Assessment, state: GameState) -> String? { nil }
    func shape(_ turn: inout Turn, state: GameState) {}
    func after(_ state: inout GameState) {}
    func judge(_ call: String, state: inout GameState) {}
}

enum Mechanics {
    /// Order matters: Diagnosis must run before Scoring.
    static let standard: [Mechanic] = [
        AssessingOnly(),
        NoRepeats(),
        SafetyChecks(),
        AssessmentLimit(max: 5),
        Diagnosis(),
        Scoring()
    ]
}

/// Assessments are only accepted while assessing.
struct AssessingOnly: Mechanic {
    func veto(_ assessment: Assessment, state: GameState) -> String? {
        state.phase == .assessing ? nil : "Time to make your call."
    }
}

/// Doing the same assessment twice doesn't cost a slot.
struct NoRepeats: Mechanic {
    func veto(_ assessment: Assessment, state: GameState) -> String? {
        state.has(assessment.id) ? "Already done. Tap slot to reread \(assessment.name.lowercased())." : nil
    }
}

/// Flags unsafe choices using the case's safety rules. The finding is still shown.
struct SafetyChecks: Mechanic {
    func shape(_ turn: inout Turn, state: GameState) {
        for rule in state.patient.safety where rule.assessments.contains(turn.assessment.id) {
            if !rule.requires.allSatisfy({ state.has($0) }) { turn.flag = rule.message }
        }
    }
    func after(_ state: inout GameState) {
        if let flag = state.turns.last?.flag, !state.flags.contains(flag) { state.flags.append(flag) }
    }
}

/// Five assessments, right or wrong, then the player must make a call.
struct AssessmentLimit: Mechanic {
    let max: Int
    func prepare(_ state: inout GameState) { state.limit = max }
    func after(_ state: inout GameState) {
        if state.turns.count >= state.limit { state.phase = .calling }
    }
}

/// Marks the call against the case's accepted and close answers.
struct Diagnosis: Mechanic {
    func judge(_ call: String, state: inout GameState) {
        state.call = call
        if TextMatch.matchesAny(state.patient.answers, in: call) { state.verdict = .correct }
        else if TextMatch.matchesAny(state.patient.close, in: call) { state.verdict = .close }
        else { state.verdict = .wrong }
        state.phase = .done
    }
}

/// 60 for a correct call (30 if close), 8 per key assessment used, minus 20 per safety flag.
struct Scoring: Mechanic {
    func judge(_ call: String, state: inout GameState) {
        var points: Int
        switch state.verdict {
        case .correct: points = 60
        case .close: points = 30
        default: points = 0
        }
        points += 8 * state.patient.key.filter { state.has($0) }.count
        points -= 20 * state.flags.count
        state.score = min(100, Swift.max(0, points))
    }
}
