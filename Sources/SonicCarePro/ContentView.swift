import SwiftUI

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
                    .font(.system(.largeTitle, design: .rounded).weight(.semibold))
                    .foregroundStyle(Theme.text)
                Text("Phase 0B · native self-test")
                    .font(.system(.caption, design: .monospaced).weight(.semibold))
                    .foregroundStyle(Theme.tertiary)
            }
            Spacer()
            Text("v0.1.0")
                .font(.system(.caption2, design: .monospaced).weight(.medium))
                .foregroundStyle(Theme.tertiary)
        }
    }

    private var statusPill: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(audio.isRunning ? Theme.good : Theme.warn)
                .frame(width: 8, height: 8)
            Text(audio.status)
                .font(.footnote.weight(.medium))
                .foregroundStyle(Theme.muted)
            Spacer(minLength: 8)
            Text(audio.routeName)
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Theme.tertiary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
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
                        .font(.footnote)
                        .foregroundStyle(Theme.muted)
                    Spacer()
                    Text(String(format: "%.1f dB", audio.rmsDb))
                        .font(.system(.subheadline, design: .monospaced).weight(.semibold))
                        .foregroundStyle(Theme.text)
                }

                LevelMeter(value: AudioMath.levelFraction(audio.rmsDb))

                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 10) {
                        enableButton
                        stopButton
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        enableButton
                        stopButton
                    }
                }

                Button("Play 1 kHz tone") {
                    audio.playTone()
                }
                .buttonStyle(.bordered)
                .tint(Theme.accent)
                .disabled(audio.permission != "Granted")

                if let error = audio.errorText {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(Theme.bad)
                }
            }
        }
    }

    private var enableButton: some View {
        Button("Enable microphone") {
            audio.requestPermission()
        }
        .buttonStyle(.borderedProminent)
        .tint(Theme.accent)
        .disabled(audio.isRunning)
    }

    private var stopButton: some View {
        Button("Stop") {
            audio.stop()
        }
        .buttonStyle(.bordered)
        .disabled(!audio.isRunning)
    }

    private var selfTestCard: some View {
        card {
            VStack(alignment: .leading, spacing: 12) {
                sectionHeader("Self-test", badge: audio.isRunning ? "Running" : "Idle")

                selfTestRow("Permission", audio.permission, ok: audio.permission == "Granted")
                selfTestRow(
                    "Bluetooth HFP",
                    audio.routePort,
                    ok: AudioMath.isBluetoothPort(audio.routePort)
                )
                selfTestRow("Sample rate", audio.sampleRate, ok: audio.sampleRate != "—")
                selfTestRow(
                    "Live signal",
                    String(format: "%.1f dB", audio.rmsDb),
                    ok: audio.rmsDb > -60
                )

                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 10) {
                        hapticButton
                        pipButton
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        hapticButton
                        pipButton
                    }
                }

                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .top, spacing: 14) {
                        pipPreview
                        pipText
                    }
                    VStack(alignment: .leading, spacing: 14) {
                        pipPreview
                        pipText
                    }
                }
            }
        }
    }

    private var hapticButton: some View {
        Button("Haptic tap") {
            audio.tapHaptic()
        }
        .buttonStyle(.bordered)
    }

    private var pipButton: some View {
        Button("Start PiP guide") {
            audio.pauseForPictureInPicture()
            pip.start()
        }
        .buttonStyle(.borderedProminent)
        .tint(Theme.accent)
    }

    private var pipPreview: some View {
        PiPPlayerView(model: pip)
            .frame(width: 146, height: 260)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line, lineWidth: 1))
            .accessibilityLabel("Looping guide video: Settings, Bluetooth, AirPods, Microphone")
    }

    private var pipText: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Floating guide")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.text)
            Text("The video loops the three Settings taps. The microphone pauses while the guide is open; tap Enable microphone when you return.")
                .font(.caption)
                .foregroundStyle(Theme.tertiary)
                .fixedSize(horizontal: false, vertical: true)
            Text("If PiP does not start: Settings → Bluetooth → (i) → Microphone → Always Left or Always Right.")
                .font(.caption2)
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            Text(pip.status)
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Theme.tertiary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var notesCard: some View {
        card {
            VStack(alignment: .leading, spacing: 8) {
                sectionHeader("Phase 0B", badge: "Self-test")
                Text("This build proves the native chain: microphone permission, AirPods HFP route, input sample rate, live RMS, haptics, a looping video, and Picture in Picture. It is not the final diagnostic UI.")
                    .font(.footnote)
                    .foregroundStyle(Theme.muted)
                Text("Audio is processed on this iPhone. No uploads, no account, no recordings.")
                    .font(.caption)
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
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.system(.title3, design: .rounded).weight(.semibold))
                .foregroundStyle(Theme.text)
            Spacer(minLength: 8)
            Text(badge)
                .font(.system(.caption2, design: .monospaced).weight(.semibold))
                .foregroundStyle(Theme.tertiary)
                .multilineTextAlignment(.trailing)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .padding(.horizontal, 9)
                .padding(.vertical, 3)
                .background(Theme.raised)
                .clipShape(Capsule())
        }
    }

    private func infoRow(_ title: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.footnote)
                .foregroundStyle(Theme.muted)
            Spacer(minLength: 12)
            Text(value)
                .font(.system(.footnote, design: .monospaced).weight(.medium))
                .foregroundStyle(Theme.text)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
    }

    private func selfTestRow(_ title: String, _ value: String, ok: Bool) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Image(systemName: ok ? "checkmark.circle.fill" : "circle.dashed")
                .foregroundStyle(ok ? Theme.good : Theme.warn)
                .accessibilityHidden(true)
            Text(title)
                .font(.footnote)
                .foregroundStyle(Theme.muted)
            Spacer(minLength: 12)
            Text(value)
                .font(.system(.caption, design: .monospaced).weight(.medium))
                .foregroundStyle(Theme.text)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .accessibilityElement(children: .combine)
        .accessibilityValue(Text(ok ? "Pass" : "Check"))
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
        .accessibilityHidden(true)
    }
}
