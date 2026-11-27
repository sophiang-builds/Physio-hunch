import SwiftUI

@main
struct PhysioHunchApp: App {
    init() {
        Brand.registerFonts()
    }

    var body: some Scene {
        WindowGroup {
            GameView()
                .tint(Brand.violet)
                .preferredColorScheme(.light)
        }
    }
}
