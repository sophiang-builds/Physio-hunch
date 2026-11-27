import SwiftUI
import CoreText

/// Physio Hunch brand tokens (see docs/brand.md).
enum Brand {
    static let room = Color(hex: "#F7F3EA")
    static let paper = Color.white
    static let ink = Color(hex: "#24203C")
    static let muted = Color(hex: "#5D586C")
    static let violet = Color(hex: "#543C86")
    static let lilac = Color(hex: "#D7C8F1")
    static let safety = Color(hex: "#9A3D38")
    static let onAction = Color.white

    /// Bricolage Grotesque 650, renamed static instance (SIL OFL 1.1).
    static func display(_ size: CGFloat, relativeTo style: Font.TextStyle = .title2) -> Font {
        .custom("PhysioHunchDisplay-SemiBold", size: size, relativeTo: style)
    }

    /// Atkinson Hyperlegible Next 400 / 700, renamed static instances (SIL OFL 1.1).
    static func text(_ size: CGFloat = 17, relativeTo style: Font.TextStyle = .body, bold: Bool = false) -> Font {
        .custom(bold ? "PhysioHunchText-Bold" : "PhysioHunchText-Regular", size: size, relativeTo: style)
    }

    static func registerFonts() {
        for name in ["PhysioHunchDisplay-SemiBold", "PhysioHunchText-Regular", "PhysioHunchText-Bold"] {
            guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}

extension Color {
    init(hex: String) {
        let clean = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let value = UInt32(clean, radix: 16) ?? 0
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}
