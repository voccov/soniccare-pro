import SwiftUI

private enum Theme {
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

struct ContentView: View {
    @StateObject private var audio = AudioSessionModel()
    @StateObject private var pip = PiPModel()

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header
                    statusPill
                    microphoneCard
                    selfTestCard
                    notesCard
                }
                .padding(20)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text("SonicCare")
                    .font(.system(size: 30, weight: .semibold, design: .rounded))
                    .foregroundStyle(Theme.text)
                Text("Phase 0B · native self-test")
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.tertiary)
            }
            Spacer()
            Text("v0.1.0")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.tertiary)
        }
    }

    private var statusPill: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(audio.isRunning ? Theme.good : Theme.warn)
                .frame(width: 8, height: 8)
            Text(audio.status)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Theme.muted)
            Spacer()
            Text(audio.routeName)
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.tertiary)
                .lineLimit(1)
        }
        .padding(.horizontal, 14)
        .frame(height: 42)
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.line, lineWidth: 1))
    }

    private var microphoneCard: some View {
        card {
            VStack(alignment: .leading, spacing: 12) {
                sectionHeader("Microphone", badge: audio.permission)

                infoRow("Route", audio.routePort)
                infoRow("Device", audio.routeName)
                infoRow("Sample rate", audio.sampleRate)

                HStack {
                    Text("Live level")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.muted)
                    Spacer()
                    Text(String(format: "%.1f dB", audio.rmsDb))
                        .font(.system(size: 15, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Theme.text)
                }

                LevelMeter(value: levelFraction(audio.rmsDb))

                HStack(spacing: 10) {
                    Button("Enable microphone") {
                        audio.requestPermission()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.accent)

                    Button("Stop") {
                        audio.stop()
                    }
                    .buttonStyle(.bordered)
                }

                Button("Play 1 kHz tone") {
                    audio.playTone()
                }
                .buttonStyle(.bordered)
                .tint(Theme.accent)

                if let error = audio.errorText {
                    Text(error)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.bad)
                }
            }
        }
    }

    private var selfTestCard: some View {
        card {
            VStack(alignment: .leading, spacing: 12) {
                sectionHeader("Self-test", badge: audio.isRunning ? "Running" : "Idle")

                selfTestRow("Permission", audio.permission, ok: audio.permission == "Granted")
                selfTestRow("Bluetooth HFP", audio.routePort, ok: audio.routePort.lowercased().contains("bluetooth"))
                selfTestRow("Sample rate", audio.sampleRate, ok: audio.sampleRate != "—")
                selfTestRow("Live signal", String(format: "%.1f dB", audio.rmsDb), ok: audio.rmsDb > -60)

                HStack(spacing: 10) {
                    Button("Haptic tap") {
                        audio.tapHaptic()
                    }
                    .buttonStyle(.bordered)

                    Button("Start PiP guide") {
                        pip.start()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.accent)
                }

                HStack(alignment: .top, spacing: 14) {
                    PiPPlayerView(model: pip)
                        .frame(width: 146, height: 260)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line, lineWidth: 1))

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Floating guide")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.text)
                        Text("The video loops the three Settings taps. Start PiP before you leave the app.")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.tertiary)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(pip.status)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(Theme.muted)
                    }
                }
            }
        }
    }

    private var notesCard: some View {
        card {
            VStack(alignment: .leading, spacing: 8) {
                sectionHeader("Phase 0B", badge: "Self-test")
                Text("This build proves the native chain: microphone permission, AirPods HFP route, input sample rate, live RMS, haptics, a looping video, and Picture in Picture. It is not the final diagnostic UI.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.muted)
                Text("Audio is processed on this iPhone. No uploads, no account, no recordings.")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.tertiary)
            }
        }
    }

    private func card<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        content()
            .padding(18)
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
    }

    private func sectionHeader(_ title: String, badge: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 18, weight: .semibold, design: .rounded))
                .foregroundStyle(Theme.text)
            Spacer()
            Text(badge)
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .foregroundStyle(Theme.tertiary)
                .padding(.horizontal, 9)
                .frame(height: 24)
                .background(Theme.raised)
                .clipShape(Capsule())
        }
    }

    private func infoRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 13))
                .foregroundStyle(Theme.muted)
            Spacer()
            Text(value)
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.text)
                .lineLimit(1)
        }
    }

    private func selfTestRow(_ title: String, _ value: String, ok: Bool) -> some View {
        HStack(spacing: 10) {
            Image(systemName: ok ? "checkmark.circle.fill" : "circle.dashed")
                .foregroundStyle(ok ? Theme.good : Theme.warn)
            Text(title)
                .font(.system(size: 13))
                .foregroundStyle(Theme.muted)
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.text)
                .lineLimit(1)
        }
    }

    private func levelFraction(_ db: Double) -> Double {
        min(1, max(0, (db + 90) / 80))
    }
}

private struct LevelMeter: View {
    let value: Double

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.background)
                Capsule()
                    .fill(Theme.accent)
                    .frame(width: max(4, geometry.size.width * value))
            }
        }
        .frame(height: 8)
        .overlay(Capsule().stroke(Theme.line, lineWidth: 1))
    }
}
