import Foundation

/// Turns whatever the player typed into one assessment from the database.
/// No AI: three deterministic tiers, highest wins.
///
///   1. Exact:   the whole input equals an alias          ("slr")
///   2. Phrase:  an alias appears inside the input        ("do a slump test please")
///   3. Fuzzy:   every word of an alias is within a small typo distance
///               of a word in the input                  ("lachmann", "ascultation")
///
/// Within a tier, longer aliases beat shorter ones. If two assessments still
/// tie (for example "anterior drawer" for knee and ankle), the one that is
/// relevant to the current patient wins.
struct Resolver {
    let assessments: [Assessment]

    func resolve(_ input: String, relevantTo patient: PatientCase) -> Assessment? {
        let text = TextMatch.normalise(input)
        guard !text.isEmpty else { return nil }

        var best: (score: Int, items: [Assessment]) = (0, [])
        for assessment in assessments {
            let score = assessment.aliases.map { Self.score(alias: $0, text: text) }.max() ?? 0
            if score > best.score { best = (score, [assessment]) }
            else if score == best.score, score > 0 { best.items.append(assessment) }
        }
        guard best.score > 0 else { return nil }
        return best.items.first { patient.findings[$0.id] != nil } ?? best.items.first
    }

    static func score(alias: String, text: String) -> Int {
        let a = TextMatch.normalise(alias)
        guard !a.isEmpty else { return 0 }
        if a == text { return 3000 + a.count }
        if TextMatch.contains(a, in: text) { return 2000 + a.count }
        if TextMatch.fuzzyContains(a, in: text) { return 1000 + a.count }
        return 0
    }
}

enum TextMatch {
    /// Lowercase, keep letters, digits and apostrophes, collapse everything else to single spaces.
    static func normalise(_ s: String) -> String {
        var out = ""
        for ch in s.lowercased() {
            if ch == "\u{2019}" || ch == "'" { out.append("'") }
            else if ch.isLetter || ch.isNumber { out.append(ch) }
            else { out.append(" ") }
        }
        return out.split(separator: " ").joined(separator: " ")
    }

    /// Phrase match starting on a word boundary. Short aliases must end on one too.
    static func contains(_ alias: String, in text: String) -> Bool {
        let padded = " " + text + " "
        return padded.contains(alias.count <= 3 ? " \(alias) " : " \(alias)")
    }

    /// Each alias word (5+ letters) must be close to the start of some input word.
    static func fuzzyContains(_ alias: String, in text: String) -> Bool {
        let aliasWords = alias.split(separator: " ").map(String.init)
        let words = text.split(separator: " ").map(String.init)
        guard !aliasWords.isEmpty, aliasWords.allSatisfy({ $0.count >= 5 }) else { return false }
        return aliasWords.allSatisfy { a in
            let tolerance = a.count >= 8 ? 2 : 1
            return words.contains { w in
                let lengths = Set([a.count - 1, a.count, a.count + 1].filter { $0 > 0 && $0 <= w.count })
                if w.count < a.count - tolerance { return false }
                if lengths.isEmpty { return distance(a, w) <= tolerance }
                return lengths.contains { distance(a, String(w.prefix($0))) <= tolerance }
            }
        }
    }

    /// Levenshtein edit distance.
    static func distance(_ a: String, _ b: String) -> Int {
        let x = Array(a), y = Array(b)
        if x.isEmpty { return y.count }
        if y.isEmpty { return x.count }
        var prev = Array(0...y.count)
        for i in 1...x.count {
            var cur = [i] + Array(repeating: 0, count: y.count)
            for j in 1...y.count {
                cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] == y[j - 1] ? 0 : 1))
            }
            prev = cur
        }
        return prev[y.count]
    }

    static func matchesAny(_ phrases: [String], in input: String) -> Bool {
        let text = normalise(input)
        return phrases.contains { contains(normalise($0), in: text) }
    }
}
