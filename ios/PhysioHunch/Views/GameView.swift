import SwiftUI

/// The one and only screen: a patient in the middle, the input at the bottom.
struct GameView: View {
    @State private var game = Game(caseIndex: UserDefaults.standard.integer(forKey: "caseIndex"))
    @State private var input = ""
    @State private var toast: String?
    @State private var reading: Turn?
    @State private var showingHowTo = false
    @FocusState private var fieldFocused: Bool

    private var state: GameState { game.state }

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                // The patient and situation stay pinned in the middle.
                PatientStage(patient: state.patient, hits: state.hits,
                             reveal: game.reveal, compact: fieldFocused)

                // The background sits under the patient: why they came in, and what happened.
                VStack(spacing: 6) {
                    Text(state.patient.situation)
                        .font(Brand.text(17, bold: true))
                    ForEach(state.patient.given, id: \.self) { id in
                        if let finding = state.patient.findings[id] {
                            Text("\(Text((Library.shared.assessment(id)?.name ?? "Background") + ":").bold()) \(finding)")
                                .font(Brand.text(15, relativeTo: .subheadline))
                                .foregroundStyle(Brand.muted)
                        }
                    }
                }
                .foregroundStyle(Brand.ink)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

                // Only the findings scroll.
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 10) {
                            ForEach(state.turns) { turn in
                                Button { reading = turn } label: { FindingCard(turn: turn) }
                                    .buttonStyle(.plain)
                                    .id(turn.id)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .scrollIndicators(.hidden)
                    .scrollDismissesKeyboard(.interactively)
                    .onChange(of: state.turns.count) { _, _ in
                        guard let last = state.turns.last else { return }
                        withAnimation(.smooth) { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }
            .padding(.horizontal, 20)
            .frame(maxWidth: 560)
            .frame(maxWidth: .infinity)
            .background { Backdrop(palette: state.patient.palette, reveal: game.reveal) }
            .safeAreaInset(edge: .bottom) { composer }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: 8) {
                        Image("Mark")
                            .resizable()
                            .frame(width: 28, height: 28)
                        Text("Physio Hunch")
                            .font(Brand.display(20, relativeTo: .headline))
                            .foregroundStyle(Brand.ink)
                    }
                    .fixedSize()
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Physio Hunch")
                }
                .sharedBackgroundVisibility(.hidden)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("How to play", systemImage: "questionmark") { showingHowTo = true }
                }
            }
            .sheet(isPresented: $showingHowTo) { HowToSheet() }
            .sheet(item: $reading) { turn in
                FindingSheet(turn: turn)
            }
            .sheet(isPresented: Binding(get: { state.phase == .done }, set: { _ in })) {
                ResultSheet(state: state) {
                    game.nextPatient()
                    UserDefaults.standard.set(game.caseIndex, forKey: "caseIndex")
                    input = ""
                }
            }
            .task { await playDemoIfRequested() }
            .sensoryFeedback(.success, trigger: state.hits)
            .sensoryFeedback(.selection, trigger: state.turns.count)
            .sensoryFeedback(.warning, trigger: state.flags.count)
        }
    }

    private var placeholder: String {
        state.phase == .assessing
            ? "What test would you give \(state.patient.name)?"
            : "What\u{2019}s wrong with \(state.patient.name)?"
    }

    // Suggestions (or diagnosis choices), the field with its five chances,
    // and the Assess button with a dropdown for making the call early.
    private var composer: some View {
        GlassEffectContainer(spacing: 10) {
            VStack(spacing: 10) {
                if let toast {
                    Text(toast)
                        .font(Brand.text(15, relativeTo: .subheadline))
                        .foregroundStyle(Brand.ink)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .glassEffect(.regular, in: .capsule)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .task(id: toast) {
                            try? await Task.sleep(for: .seconds(2.6))
                            withAnimation { self.toast = nil }
                        }
                }


                HStack(spacing: 10) {
                    TextField(placeholder, text: $input)
                        .font(Brand.text())
                        .foregroundStyle(Brand.ink)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.send)
                        .focused($fieldFocused)
                        .onSubmit { send() }
                    ChancesDots(state: state)
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 14)
                .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 24))

                HStack(spacing: 8) {
                    Button { send() } label: {
                        Text(state.phase == .assessing ? "Assess" : "Make your call")
                            .font(Brand.text(17, relativeTo: .headline, bold: true))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                    }
                    .buttonStyle(.glassProminent)
                    .tint(Brand.violet)
                    .controlSize(.large)
                    .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || state.phase == .done)

                    Menu {
                        Button("Make your call now", systemImage: "stethoscope") {
                            withAnimation(.smooth) { game.beginCall() }
                            fieldFocused = true
                        }
                        .disabled(state.phase != .assessing)
                        Button("How to play", systemImage: "questionmark.circle") { showingHowTo = true }
                    } label: {
                        Image(systemName: "chevron.down")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(Brand.onAction)
                            .frame(width: 52, height: 52)
                    }
                    .glassEffect(.regular.tint(Brand.violet).interactive(), in: .circle)
                    .accessibilityLabel("More options")
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .frame(maxWidth: 600)
    }

    /// Screen-recording demo, used by CI on the iPhone 15 simulator.
    /// Launch with -demoMoves "type:what happened|tap:Ottawa ankle and foot rules|call|type:lateral ankle sprain"
    ///   type:<text>  types into the field and taps Assess
    ///   tap:<name>   runs that assessment as if typed
    ///   call         opens "Make your call now"
    private func playDemoIfRequested() async {
        guard let script = UserDefaults.standard.string(forKey: "demoMoves") else { return }
        try? await Task.sleep(for: .seconds(2.5))
        for step in script.split(separator: "|").map(String.init) {
            if step.hasPrefix("tap:") {
                send(String(step.dropFirst(4)))
                try? await Task.sleep(for: .seconds(2.8))
                continue
            }
            if step == "call" {
                withAnimation(.smooth) { game.beginCall() }
                try? await Task.sleep(for: .seconds(2.2))
                continue
            }
            let move = step.hasPrefix("type:") ? String(step.dropFirst(5)) : step
            input = ""
            for character in move {
                input.append(character)
                try? await Task.sleep(for: .milliseconds(45))
            }
            try? await Task.sleep(for: .seconds(0.6))
            send()
            try? await Task.sleep(for: .seconds(2.4))
        }
    }

    private func send(_ text: String? = nil) {
        let outcome = withAnimation(.spring(duration: 0.45)) { game.submit(text ?? input) }
        switch outcome {
        case .rejected(let message):
            withAnimation { toast = message }
        case .unknown:
            withAnimation { toast = "Not an assessment I know. Try \u{201C}straight leg raise\u{201D}." }
        case .revealed, .silent, .called:
            input = ""
            fieldFocused = state.phase == .calling
        }
    }
}

#Preview {
    GameView()
        .tint(Brand.violet)
}
