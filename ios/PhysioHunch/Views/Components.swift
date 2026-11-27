import SwiftUI

/// The patient, drawn from a 16-pose atlas (assets/characters/pose-atlases, docs/characters.md).
/// Poses 0, 4, 8 and 12 face front, screen-right, back and screen-left; the three cells
/// between each are in-between drawings about 22.5 degrees apart.
///
/// Each new finding plays a quarter turn through those poses while the camera eases to the
/// destination's framing: sides push in to 1.31x, the back opens to 0.84x, the front resets.
/// Timing and camera match assets/characters/turn-clips/manifest.json. The first direction is
/// random and kept, so the player sees every angle. Reduce Motion jumps straight to the end pose.
struct PatientStage: View {
    static let views = ["front", "right", "back", "left"]
    static let posesPerQuarter = 4
    static let poseCount = 16
    /// Zoom per view (manifest.json). Push-ins centre on the face so heads stay in frame;
    /// the pull-out keeps the figure standing on its baseline.
    static let camera: [String: (zoom: CGFloat, anchorY: CGFloat)] = [
        "front": (1.00, 0.97), "right": (1.31, 0.20), "back": (0.84, 0.97), "left": (1.31, 0.20)
    ]
    static let turnDuration = 0.64                     // plus the hold before the next turn
    static let poseStep = Duration.milliseconds(160)

    let patient: PatientCase
    let hits: Int
    let reveal: Double
    var compact = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pose = 0
    @State private var cameraView = 0
    @State private var direction = Bool.random() ? 1 : -1
    @State private var turning: Task<Void, Never>?

    private var height: CGFloat { compact ? 190 : 300 }

    var body: some View {
        let camera = Self.camera[Self.views[cameraView]] ?? (1, 0.97)
        ZStack {
            Circle()
                .fill(Brand.lilac)
                .overlay {
                    Circle()
                        .fill(LinearGradient(colors: patient.palette.map(Color.init(hex:)),
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .opacity(reveal)
                }
                .frame(width: height * 0.78, height: height * 0.78)

            Image("\(patient.turnaround)-\(String(format: "%02d", pose))")
                .resizable()
                .interpolation(.none)                // keep the pixel art crisp
                .scaledToFit()
                .frame(width: height, height: height)
        }
        .scaleEffect(camera.zoom, anchor: UnitPoint(x: 0.5, y: camera.anchorY))
        .frame(height: height)
        .frame(maxWidth: .infinity)
        .clipShape(.rect(cornerRadius: 28))
        .animation(.easeInOut(duration: 1.2), value: reveal)
        .animation(.smooth(duration: 0.35), value: compact)
        .accessibilityElement()
        .accessibilityLabel("\(patient.name), \(patient.age).")
        .onChange(of: hits) { _, newValue in if newValue > 0 { quarterTurn() } }
        .onChange(of: patient.id) { _, _ in
            turning?.cancel()
            var reset = Transaction()
            reset.disablesAnimations = true
            withTransaction(reset) { pose = 0; cameraView = 0; direction = Bool.random() ? 1 : -1 }
        }
    }

    private func quarterTurn() {
        let start = cameraView
        let end = (start + direction + Self.views.count) % Self.views.count
        let startPose = start * Self.posesPerQuarter
        if reduceMotion {
            pose = end * Self.posesPerQuarter
            cameraView = end
            return
        }
        withAnimation(.easeInOut(duration: Self.turnDuration)) { cameraView = end }
        turning?.cancel()
        turning = Task { @MainActor in
            for step in 1...Self.posesPerQuarter {
                try? await Task.sleep(for: step == 1 ? .milliseconds(80) : Self.poseStep)
                if Task.isCancelled { return }
                pose = (startPose + direction * step + Self.poseCount) % Self.poseCount
            }
        }
    }
}

/// Soft wash of the case colours behind everything, growing with each finding.
struct Backdrop: View {
    let palette: [String]
    let reveal: Double

    var body: some View {
        ZStack {
            Brand.room
            LinearGradient(colors: palette.map(Color.init(hex:)) + [Brand.room],
                           startPoint: .top, endPoint: .bottom)
                .opacity(0.32 * reveal)
        }
        .ignoresSafeArea()
        .animation(.easeInOut(duration: 1.2), value: reveal)
    }
}

/// Five chances, shown inside the text field: filled violet for a finding,
/// grey for no response, outlined for unused.
struct ChancesDots: View {
    let state: GameState

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<state.limit, id: \.self) { index in
                if index < state.turns.count {
                    Circle()
                        .fill(state.turns[index].isHit ? Brand.violet : Brand.ink.opacity(0.28))
                        .frame(width: 9, height: 9)
                } else {
                    Circle()
                        .strokeBorder(Brand.ink.opacity(0.4), lineWidth: 1.2)
                        .frame(width: 9, height: 9)
                }
            }
        }
        .accessibilityElement()
        .accessibilityLabel("\(state.remaining) of \(state.limit) assessments left")
    }
}

/// How to play, for people who have never studied physiotherapy.
struct HowToSheet: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("How to play")
                .font(Brand.display(30, relativeTo: .title))
            step("1", "Read why the patient is here.")
            step("2", "Pick a test from the suggestions, or type one. You get five. A useful test reveals a finding and the patient turns. A useless one gets no response.")
            step("3", "Tap the arrow next to Assess and choose \u{201C}Make your call now\u{201D} whenever you're ready, or after your fifth test. Type what you think is wrong.")
            step("4", "The debrief shows what was really going on and which tests mattered most.")
            Spacer(minLength: 0)
        }
        .foregroundStyle(Brand.ink)
        .padding(24)
        .presentationDetents([.medium, .large])
        .presentationBackground(Brand.room)
    }

    private func step(_ number: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(number)
                .font(Brand.text(15, relativeTo: .headline, bold: true))
                .foregroundStyle(Brand.onAction)
                .frame(width: 28, height: 28)
                .background(Brand.violet, in: .circle)
            Text(text).font(Brand.text())
        }
    }
}

/// A finding on a paper card.
struct FindingCard: View {
    let turn: Turn

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("\(turn.number). \(turn.assessment.name)")
                .font(Brand.text(14, relativeTo: .subheadline, bold: true))
                .foregroundStyle(Brand.muted)
            Text(turn.finding ?? "No response.")
                .font(Brand.text())
                .italic(!turn.isHit)
                .foregroundStyle(turn.isHit ? Brand.ink : Brand.muted)
                .fixedSize(horizontal: false, vertical: true)
            if let flag = turn.flag {
                Label(flag, systemImage: "exclamationmark.triangle.fill")
                    .font(Brand.text(14, relativeTo: .footnote, bold: true))
                    .foregroundStyle(Brand.safety)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Brand.paper, in: .rect(cornerRadius: 22))
        .overlay {
            RoundedRectangle(cornerRadius: 22)
                .strokeBorder(turn.isHit ? Brand.violet.opacity(0.5) : Brand.ink.opacity(0.08), lineWidth: 1.5)
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}

/// Reopened finding. Reading it again never costs a slot.
struct FindingSheet: View {
    let turn: Turn

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Assessment \(turn.number)")
                .font(Brand.text(14, relativeTo: .subheadline, bold: true))
                .foregroundStyle(Brand.muted)
            Text(turn.assessment.name)
                .font(Brand.display(28, relativeTo: .title))
                .foregroundStyle(Brand.ink)
            FindingCard(turn: turn)
            Spacer(minLength: 0)
        }
        .padding(24)
        .presentationDetents([.medium])
        .presentationBackground(Brand.room)
    }
}

/// The debrief after the call. Fits one screen; Next patient is always visible.
struct ResultSheet: View {
    let state: GameState
    let next: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Label(verdictTitle, systemImage: verdictIcon)
                    .font(Brand.display(28, relativeTo: .title))
                    .foregroundStyle(verdictColour)
                Spacer()
                Text("\(state.score) pts")
                    .font(Brand.text(17, relativeTo: .headline, bold: true))
            }
            Text("Your call: \u{201C}\(state.call ?? "")\u{201D}")
                .font(Brand.text(15, relativeTo: .subheadline))
                .foregroundStyle(Brand.muted)
                .lineLimit(1)

            section("It was") {
                Text(state.patient.diagnosis).font(Brand.text(17, relativeTo: .headline, bold: true))
            }
            if !state.flags.isEmpty {
                section("Safety") {
                    ForEach(state.flags, id: \.self) { flag in
                        Label(flag, systemImage: "exclamationmark.triangle.fill")
                            .font(Brand.text(14, relativeTo: .footnote, bold: true))
                            .foregroundStyle(Brand.safety)
                    }
                }
            }
            section("What was going on") {
                Text(state.patient.story)
                    .font(Brand.text(15, relativeTo: .subheadline))
                    .minimumScaleFactor(0.8)
            }
            section("Most telling tests") {
                LazyVGrid(columns: [GridItem(.flexible(), alignment: .leading), GridItem(.flexible(), alignment: .leading)], spacing: 6) {
                    ForEach(state.patient.key, id: \.self) { id in
                        let done = state.has(id)
                        Label(Library.shared.assessment(id)?.name ?? id,
                              systemImage: done ? "checkmark.circle.fill" : "circle")
                            .font(Brand.text(14, relativeTo: .footnote))
                            .lineLimit(2)
                            .foregroundStyle(done ? Brand.violet : Brand.muted)
                    }
                }
            }
            Spacer(minLength: 0)
            Button(action: next) {
                Text("Next patient")
                    .font(Brand.text(17, relativeTo: .headline, bold: true))
                    .foregroundStyle(Brand.onAction)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
            }
            .buttonStyle(.glassProminent)
            .tint(Brand.violet)
            .controlSize(.large)
        }
        .foregroundStyle(Brand.ink)
        .padding(.horizontal, 22)
        .padding(.top, 22)
        .padding(.bottom, 8)
        .presentationDetents([.large])
        .presentationBackground(Brand.room)
        .interactiveDismissDisabled()
    }

    private var verdictTitle: String {
        switch state.verdict {
        case .correct: return "Spot on"
        case .close: return "Close"
        default: return "Not quite"
        }
    }

    private var verdictIcon: String {
        switch state.verdict {
        case .correct: return "checkmark.seal.fill"
        case .close: return "circle.lefthalf.filled"
        default: return "xmark.circle.fill"
        }
    }

    private var verdictColour: Color {
        switch state.verdict {
        case .correct: return Brand.violet
        case .close: return Brand.ink
        default: return Brand.safety
        }
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(Brand.text(13, relativeTo: .footnote, bold: true))
                .foregroundStyle(Brand.muted)
            content()
        }
    }
}
