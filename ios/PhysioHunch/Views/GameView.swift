import SwiftUI

/// The one and only screen: a patient in the middle, the input at the bottom.
struct GameView: View {
    @State private var game = Game(caseIndex: UserDefaults.standard.integer(forKey: "caseIndex"))
    @State private var input = ""
    @State private var toast: String?
    @State private var reading: Turn?
    @FocusState private var fieldFocused: Bool

    private var state: GameState { game.state }

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                // The patient, situation and slots stay pinned in the middle.
                PatientStage(patient: state.patient, hits: state.hits, reveal: game.reveal)

                Text(state.patient.situation)
                    .font(Brand.text(17, bold: true))
                    .foregroundStyle(Brand.ink)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                SlotsBar(state: state) { reading = $0 }

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
                    Image("Mark")
                        .resizable()
                        .frame(width: 30, height: 30)
                        .accessibilityLabel("Physio Hunch")
                }
                ToolbarItem(placement: .principal) {
                    Text(title)
                        .font(Brand.text(16, relativeTo: .headline, bold: true))
                        .foregroundStyle(Brand.ink)
                        .contentTransition(.numericText())
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Make your call") {
                        game.beginCall()
                        fieldFocused = true
                    }
                    .font(Brand.text(15, relativeTo: .subheadline, bold: true))
                    .disabled(state.phase != .assessing)
                }
            }
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

    private var title: String {
        switch state.phase {
        case .assessing: return state.remaining == 1 ? "1 assessment left" : "\(state.remaining) assessments left"
        case .calling: return "Make your call"
        case .done: return "Debrief"
        }
    }

    private var placeholder: String {
        state.phase == .assessing
            ? "Assessment \(state.turns.count + 1) of \(state.limit), e.g. slump test"
            : "What's wrong with \(state.patient.name)?"
    }

    // Typing field with the send button right below it.
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

                TextField(placeholder, text: $input)
                    .font(Brand.text())
                    .foregroundStyle(Brand.ink)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.send)
                    .focused($fieldFocused)
                    .onSubmit(send)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 14)
                    .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 24))

                Button(action: send) {
                    Text(state.phase == .assessing ? "Assess" : "Make your call")
                        .font(Brand.text(17, relativeTo: .headline, bold: true))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                }
                .buttonStyle(.glassProminent)
                .tint(Brand.violet)
                .controlSize(.large)
                .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || state.phase == .done)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .frame(maxWidth: 600)
    }

    /// Screen-recording demo, used by CI on the iPhone 15 simulator.
    /// Launch with: -demoMoves "what happened|ottawa|anterior drawer|lateral ankle sprain"
    private func playDemoIfRequested() async {
        guard let script = UserDefaults.standard.string(forKey: "demoMoves") else { return }
        try? await Task.sleep(for: .seconds(2.5))
        for move in script.split(separator: "|").map(String.init) {
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

    private func send() {
        let outcome = withAnimation(.spring(duration: 0.45)) { game.submit(input) }
        switch outcome {
        case .rejected(let message):
            withAnimation { toast = message }
        case .unknown:
            withAnimation { toast = "Not an assessment I know. Try \u{201C}straight leg raise\u{201D}." }
        case .revealed, .silent, .called:
            input = ""
            if state.phase == .calling { fieldFocused = true }
        }
    }
}

#Preview {
    GameView()
        .tint(Brand.violet)
}
