import SwiftUI

/// The patient on a turntable. Every finding turns them 90 degrees
/// (front, right, back, left, front again) and moves the camera closer
/// to the case's focus point. Reduce Motion swaps views with a crossfade.
struct PatientStage: View {
    static let views = ["front", "right", "back", "left"]
    static let height: CGFloat = 300
    static let zoomPerFinding: CGFloat = 0.16

    let patient: PatientCase
    let hits: Int
    let reveal: Double

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = 0
    @State private var spin: Double = 0
    @State private var breathing = false

    private var zoom: CGFloat { 1 + Self.zoomPerFinding * CGFloat(hits) }
    private var focus: UnitPoint { UnitPoint(x: patient.focus.first ?? 0.5, y: patient.focus.last ?? 0.5) }
    /// Slides the focus point toward the middle of the stage as the zoom grows.
    private var drift: CGFloat {
        let progress = min(1, (zoom - 1) / (Self.zoomPerFinding * 4))
        return (0.5 - focus.y) * Self.height * progress
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(Brand.lilac)
                .overlay {
                    Circle()
                        .fill(LinearGradient(colors: patient.palette.map(Color.init(hex:)),
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .opacity(reveal)
                }
                .frame(width: 230, height: 230)

            Image("\(patient.turnaround)-\(Self.views[shown])")
                .resizable()
                .scaledToFit()
                .frame(height: Self.height)
                .scaleEffect(breathing ? 1.008 : 1, anchor: .bottom)
                .rotation3DEffect(.degrees(spin), axis: (x: 0, y: 1, z: 0), perspective: 0.45)
                .scaleEffect(zoom, anchor: focus)
                .offset(y: drift)
                .animation(.spring(duration: 0.9, bounce: 0.15), value: zoom)
        }
        .frame(height: Self.height)
        .frame(maxWidth: .infinity)
        .clipShape(.rect(cornerRadius: 28))
        .animation(.easeInOut(duration: 1.2), value: reveal)
        .accessibilityElement()
        .accessibilityLabel("\(patient.name), \(patient.age). Facing \(Self.views[shown]).")
        .onChange(of: hits) { _, newValue in turn(to: newValue % Self.views.count) }
        .onChange(of: patient.id) { _, _ in
            var reset = Transaction()
            reset.disablesAnimations = true
            withTransaction(reset) { shown = 0; spin = 0 }
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) { breathing = true }
        }
    }

    private func turn(to target: Int) {
        guard target != shown else { return }
        if reduceMotion {
            withAnimation(.easeInOut(duration: 0.3)) { shown = target }
            return
        }
        // Rotate away to edge-on, swap the drawing, rotate back in from the other edge.
        withAnimation(.easeIn(duration: 0.22)) {
            spin = 90
        } completion: {
            var swap = Transaction()
            swap.disablesAnimations = true
            withTransaction(swap) {
                shown = target
                spin = -90
            }
            withAnimation(.easeOut(duration: 0.3)) { spin = 0 }
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

/// Five slots. Used slots are buttons that reopen their finding at no cost.
struct SlotsBar: View {
    let state: GameState
    let open: (Turn) -> Void

    var body: some View {
        GlassEffectContainer(spacing: 8) {
            HStack(spacing: 10) {
                ForEach(0..<state.limit, id: \.self) { index in
                    if index < state.turns.count {
                        usedSlot(state.turns[index])
                    } else {
                        Circle()
                            .strokeBorder(Brand.ink.opacity(0.35), style: StrokeStyle(lineWidth: 1.5, dash: [3, 3]))
                            .frame(width: 44, height: 44)
                            .accessibilityLabel("Empty assessment slot")
                    }
                }
            }
        }
    }

    private func usedSlot(_ turn: Turn) -> some View {
        Button { open(turn) } label: {
            ZStack(alignment: .topTrailing) {
                Text("\(turn.number)")
                    .font(Brand.text(16, relativeTo: .headline, bold: true))
                    .foregroundStyle(turn.isHit ? Brand.onAction : Brand.muted)
                    .frame(width: 44, height: 44)
                if turn.flag != nil {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(Brand.safety)
                        .offset(x: 4, y: -4)
                }
            }
        }
        .buttonStyle(.plain)
        .glassEffect(turn.isHit ? .regular.tint(Brand.violet).interactive() : .regular.interactive(), in: .circle)
        .accessibilityLabel("Assessment \(turn.number), \(turn.assessment.name). \(turn.isHit ? "Finding recorded" : "No response")\(turn.flag != nil ? ", safety flag" : "")")
        .accessibilityHint("Reopens this finding")
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
