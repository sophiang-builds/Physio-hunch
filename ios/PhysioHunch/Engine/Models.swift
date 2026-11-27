import Foundation

/// One assessment a player can run on any patient. Loaded from assessments.json.
struct Assessment: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let category: String
    /// Words and phrases a player might type for this assessment.
    /// Aliases of 3 characters or fewer must match a whole word.
    /// Longer aliases can be word stems ("auscultat" matches "auscultation").
    let aliases: [String]
}

/// A safety rule attached to a case. If the player runs one of `assessments`
/// before every id in `requires` has been done, the turn is flagged.
/// An empty `requires` means the assessment is always unsafe for this patient.
struct SafetyRule: Codable, Hashable {
    let assessments: [String]
    let requires: [String]
    let message: String
}

/// A patient. Loaded from cases.json.
struct PatientCase: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let age: Int
    /// Image set prefix. The app expects "<turnaround>-front", "-right", "-back" and "-left",
    /// cut from assets/characters/patient-turnarounds.png by tools/cut_turnarounds.py.
    let turnaround: String
    let situation: String
    let palette: [String]
    let diagnosis: String
    let answers: [String]
    let close: [String]
    let story: String
    let key: [String]
    /// assessment id -> what the player learns. Anything not listed gets silence.
    let findings: [String: String]
    let safety: [SafetyRule]
}

/// One committed assessment.
struct Turn: Identifiable, Hashable {
    let id = UUID()
    let number: Int
    let assessment: Assessment
    let finding: String?
    var flag: String? = nil
    var isHit: Bool { finding != nil }
}

enum Phase: Equatable {
    case assessing
    case calling
    case done
}

enum Verdict: Equatable {
    case correct
    case close
    case wrong
}

/// Everything about the current consultation. Mechanics read and change this.
struct GameState {
    let patient: PatientCase
    var limit: Int = 5
    var turns: [Turn] = []
    var phase: Phase = .assessing
    var flags: [String] = []
    var call: String? = nil
    var verdict: Verdict? = nil
    var score: Int = 0

    var remaining: Int { max(0, limit - turns.count) }
    var hits: Int { turns.filter(\.isHit).count }
    func has(_ assessmentId: String) -> Bool { turns.contains { $0.assessment.id == assessmentId } }
}
