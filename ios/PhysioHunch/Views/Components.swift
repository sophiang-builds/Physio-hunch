import SwiftUI

/// The patient from the turnaround sheet, filmed like a short scene.
///
/// Right test: the patient turns one view (front, right, back, left) while the camera
/// glides to a new shot. Shots go wide (waist up), medium (chest and face), close (face),
/// then pick randomly between pushing in and pulling out.
/// Wrong test: the head gives a small "no" shake while the shoulders stay still.
/// Reduce Motion: frames and shots change without movement.
/// The same motion is rendered to GIFs by tools/make_turn_gifs.py.
struct PatientStage: View {
    static let views = ["front", "right", "back", "left"]
    /// zoom, and the vertical point the camera centres on (0 top, 1 bottom)
    static let shots: [(zoom: CGFloat, anchorY: CGFloat)] = [(1.0, 0.55), (1.32, 0.40), (1.72, 0.30)]
    static let neck: CGFloat = 0.50
    static let turnDuration = 0.85

    let patient: PatientCase
    let hits: Int
    let misses: Int
    let reveal: Double
    var compact = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var from = 0
    @State private var to = 0
    @State private var progress: CGFloat = 1
    @State private var shot = 0
    @State private var breathing = false

    private var height: CGFloat { compact ? 190 : 300 }

    var body: some View {
        let camera = Self.shots[shot]
        ZStack(alignment: .bottom) {
            Circle()
                .fill(Brand.lilac)
                .overlay {
                    Circle()
                        .fill(LinearGradient(colors: patient.palette.map(Color.init(hex:)),
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .opacity(reveal)
                }
                .frame(width: height * 0.84, height: height * 0.84)
                .frame(maxHeight: .infinity, alignment: .center)

            TurningSprite(
                from: Image("\(patient.turnaround)-\(Self.views[from])"),
                to: Image("\(patient.turnaround)-\(Self.views[to])"),
                progress: progress,
                neck: Self.neck,
                shakeTrigger: reduceMotion ? 0 : misses
            )
            .frame(height: height * 0.87)
            .scaleEffect(breathing ? 1.006 : 1, anchor: .bottom)
        }
        .scaleEffect(camera.zoom, anchor: UnitPoint(x: 0.5, y: camera.anchorY))
        .frame(height: height)
        .frame(maxWidth: .infinity)
        .clipShape(.rect(cornerRadius: 28))
        .animation(.easeInOut(duration: 1.2), value: reveal)
        .animation(.smooth(duration: 0.35), value: compact)
        .accessibilityElement()
        .accessibilityLabel("\(patient.name), \(patient.age). Facing \(Self.views[to]).")
        .onChange(of: hits) { _, newValue in advance(to: newValue) }
        .onChange(of: patient.id) { _, _ in
            var reset = Transaction()
            reset.disablesAnimations = true
            withTransaction(reset) { from = 0; to = 0; progress = 1; shot = 0 }
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) { breathing = true }
        }
    }

    private func nextShot(after hits: Int) -> Int {
        switch hits {
        case 1: return 1
        case 2: return 2
        default: return [0, 1, 2].filter { $0 != shot }.randomElement() ?? 0
        }
    }

    private func advance(to hits: Int) {
        guard hits > 0 else { return }
        let target = hits % Self.views.count
        let newShot = nextShot(after: hits)
        if reduceMotion {
            from = target; to = target; progress = 1; shot = newShot
            return
        }
        var start = Transaction()
        start.disablesAnimations = true
        withTransaction(start) { from = to; to = target; progress = 0 }
        withAnimation(.easeInOut(duration: Self.turnDuration)) {
            progress = 1
            shot = newShot
        }
    }
}

/// One turn between two views. The body keeps depth side-on (narrowest at 55% width),
/// lifts slightly, and the two views cross-fade through the middle of the turn.
struct TurningSprite: View, Animatable {
    let from: Image
    let to: Image
    var progress: CGFloat
    let neck: CGFloat
    let shakeTrigger: Int

    var animatableData: CGFloat {
        get { progress }
        set { progress = newValue }
    }

    var body: some View {
        let width = 1 - 0.45 * sin(.pi * progress)
        let blend = min(1, max(0, (progress - 0.4) / 0.2))
        ZStack(alignment: .bottom) {
            ShakingHead(image: from, neck: neck, trigger: shakeTrigger).opacity(1 - blend)
            ShakingHead(image: to, neck: neck, trigger: shakeTrigger).opacity(blend)
        }
        .scaleEffect(x: width, y: 1, anchor: .bottom)
        .offset(y: -6 * sin(.pi * progress))
    }
}

/// The sprite split at the neck: the head sways for a "no" while the shoulders stay put.
struct ShakingHead: View {
    let image: Image
    let neck: CGFloat
    let trigger: Int

    private var sprite: some View {
        image.resizable().interpolation(.none).scaledToFit()
    }

    var body: some View {
        ZStack {
            sprite.mask {
                LinearGradient(stops: [.init(color: .clear, location: neck - 0.06),
                                       .init(color: .black, location: neck - 0.04)],
                               startPoint: .top, endPoint: .bottom)
            }
            sprite.mask {
                LinearGradient(stops: [.init(color: .black, location: neck - 0.02),
                                       .init(color: .clear, location: neck)],
                               startPoint: .top, endPoint: .bottom)
            }
            .keyframeAnimator(initialValue: CGFloat(0), trigger: trigger) { head, dx in
                head.offset(x: dx)
            } keyframes: { _ in
                KeyframeTrack {
                    CubicKeyframe(5, duration: 0.09)
                    CubicKeyframe(-5, duration: 0.14)
                    CubicKeyframe(4, duration: 0.14)
                    CubicKeyframe(-3, duration: 0.13)
                    CubicKeyframe(1.5, duration: 0.12)
                    CubicKeyframe(0, duration: 0.12)
                }
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
            step("2", "Pick a test from the suggestions, or type one. You get five. A useful test reveals a finding and the patient turns. A useless one gets a shake of the head.")
            step("3", "Tap the arrow next to Assess and choose \u{201C}Make your call now\u{201D} whenever you're ready, or after your fifth test. Pick the diagnosis you think fits.")
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

/// The debrief after the call.
struct ResultSheet: View {
    let state: GameState
    let next: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Label(verdictTitle, systemImage: verdictIcon)
                    .font(Brand.display(34, relativeTo: .largeTitle))
                    .foregroundStyle(verdictColour)

                HStack {
                    Text("Your call: \u{201C}\(state.call ?? "")\u{201D}")
                        .font(Brand.text())
                        .foregroundStyle(Brand.muted)
                    Spacer()
                    Text("\(state.score) pts")
                        .font(Brand.text(17, relativeTo: .headline, bold: true))
                        .foregroundStyle(Brand.ink)
                }

                section("It was") {
                    Text(state.patient.diagnosis).font(Brand.text(19, relativeTo: .title3, bold: true))
                }

                if !state.flags.isEmpty {
                    section("Safety") {
                        ForEach(state.flags, id: \.self) { flag in
                            Label(flag, systemImage: "exclamationmark.triangle.fill")
                                .foregroundStyle(Brand.safety)
                        }
                    }
                }

                section("What was going on") {
                    Text(state.patient.story)
                }

                section("Most telling assessments") {
                    ForEach(state.patient.key, id: \.self) { id in
                        let done = state.has(id)
                        Label(Library.shared.assessment(id)?.name ?? id,
                              systemImage: done ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(done ? Brand.violet : Brand.muted)
                    }
                }
            }
            .font(Brand.text())
            .foregroundStyle(Brand.ink)
            .padding(24)
        }
        .safeAreaInset(edge: .bottom) {
            Button(action: next) {
                Text("Next patient")
                    .font(Brand.text(17, relativeTo: .headline, bold: true))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
            }
            .buttonStyle(.glassProminent)
            .tint(Brand.violet)
            .controlSize(.large)
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
        }
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
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(Brand.text(14, relativeTo: .subheadline, bold: true))
                .foregroundStyle(Brand.muted)
            content()
        }
    }
}
