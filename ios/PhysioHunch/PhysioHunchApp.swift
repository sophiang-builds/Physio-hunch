import SwiftUI

@main
struct PhysioHunchApp: App {
    init() {
        Brand.registerFonts()
    }

    var body: some Scene {
        WindowGroup {
            ReviewNotice()
                .tint(Brand.violet)
                .preferredColorScheme(.light)
        }
    }
}

struct ReviewNotice: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Physio Hunch").font(Brand.text(17, bold: true))
            Text("Paused for clinical review").font(Brand.display(32, relativeTo: .title))
                .accessibilityAddTraits(.isHeader)
            Text("We’ve taken the game offline while we review the cases and how answers are scored.")
                .font(Brand.text())
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .foregroundStyle(Brand.ink)
        .background(Brand.room)
    }
}
