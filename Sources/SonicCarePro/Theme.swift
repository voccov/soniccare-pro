import SwiftUI

/// One dark instrument theme. Colors live here, never inline in a view.
enum Theme {
    static let background = Color(red: 7 / 255, green: 7 / 255, blue: 9 / 255)
    static let surface = Color(red: 19 / 255, green: 20 / 255, blue: 25 / 255)
    static let raised = Color(red: 27 / 255, green: 28 / 255, blue: 34 / 255)
    static let line = Color.white.opacity(0.08)
    static let text = Color(red: 245 / 255, green: 245 / 255, blue: 247 / 255)
    static let muted = Color(red: 161 / 255, green: 161 / 255, blue: 170 / 255)
    static let tertiary = Color(red: 142 / 255, green: 142 / 255, blue: 147 / 255)
    static let accent = Color(red: 10 / 255, green: 132 / 255, blue: 255 / 255)
    static let good = Color(red: 48 / 255, green: 209 / 255, blue: 88 / 255)
    static let warn = Color(red: 255 / 255, green: 159 / 255, blue: 10 / 255)
    static let bad = Color(red: 255 / 255, green: 69 / 255, blue: 58 / 255)
}
