import AVFoundation
import Combine
import UIKit

@MainActor
final class AudioSessionModel: ObservableObject {
    @Published var permission: String = "Not requested"
    @Published var routePort: String = "—"
    @Published var routeName: String = "—"
    @Published var sampleRate: String = "—"
    @Published var rmsDb: Double = AudioMath.silenceFloorDb
    @Published var isRunning: Bool = false
    @Published var status: String = "Idle"
    @Published var errorText: String?

    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var tapInstalled = false
    private var toneConfigured = false
    private var routeObserver: NSObjectProtocol?

    init() {
        switch AVAudioApplication.shared.recordPermission {
        case .granted:
            permission = "Granted"
        case .denied:
            permission = "Denied"
        case .undetermined:
            permission = "Not requested"
        @unknown default:
            permission = "Unknown"
        }

        routeObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.routeChanged()
            }
        }
        refreshRoute()
    }

    deinit {
        if let routeObserver {
            NotificationCenter.default.removeObserver(routeObserver)
        }
    }

    func requestPermission() {
        switch AVAudioApplication.shared.recordPermission {
        case .granted:
            permission = "Granted"
            start()
        case .denied:
            permission = "Denied"
            status = "Microphone denied"
        case .undetermined:
            AVAudioApplication.requestRecordPermission { [weak self] granted in
                Task { @MainActor in
                    guard let self else { return }
                    self.permission = granted ? "Granted" : "Denied"
                    if granted {
                        self.start()
                    } else {
                        self.status = "Microphone denied"
                    }
                }
            }
        @unknown default:
            permission = "Unknown"
            status = "Microphone permission unknown"
        }
    }

    func start() {
        guard !isRunning else { return }

        do {
            let session = AVAudioSession.sharedInstance()
            var options: AVAudioSession.CategoryOptions = [.allowBluetoothA2DP]
            #if compiler(>=6.2)
            if #available(iOS 26.0, *) {
                options.insert(.allowBluetoothHFP)
            } else {
                options.insert(.allowBluetooth)
            }
            #else
            options.insert(.allowBluetooth)
            #endif

            do {
                try session.setCategory(.playAndRecord, mode: .measurement, options: options)
            } catch {
                try session.setCategory(.playAndRecord, mode: .default, options: options)
            }
            try session.setActive(true)

            if !toneConfigured {
                engine.attach(player)
                let toneFormat = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 1)!
                engine.connect(player, to: engine.mainMixerNode, format: toneFormat)
                toneConfigured = true
            }

            if !tapInstalled, let format = installTap() {
                sampleRate = AudioMath.sampleRateLabel(format.sampleRate)
            }

            engine.prepare()
            try engine.start()
            isRunning = true
            status = "Microphone running"
            errorText = nil
            refreshRoute()
        } catch {
            errorText = error.localizedDescription
            status = "Could not start"
            isRunning = false
        }
    }

    func stop() {
        if tapInstalled {
            engine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        player.stop()
        engine.stop()
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        isRunning = false
        status = "Stopped"
        rmsDb = AudioMath.silenceFloorDb
        sampleRate = "—"
    }

    /// PiP needs a playback session; stop the microphone first so the two sessions do not
    /// fight. The next measurement starts with Enable microphone.
    func pauseForPictureInPicture() {
        stop()
        status = "Paused for PiP"
    }

    func playTone() {
        if !isRunning {
            start()
        }
        guard isRunning else { return }

        let format = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 1)!
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 48_000) else { return }
        buffer.frameLength = 48_000
        if let data = buffer.floatChannelData?[0] {
            for index in 0..<48_000 {
                data[index] = 0.08 * sin(2.0 * .pi * 1_000.0 * Float(index) / 48_000.0)
            }
        }
        player.scheduleBuffer(buffer, at: nil, options: [], completionHandler: nil)
        if !player.isPlaying {
            player.play()
        }
        status = "1 kHz tone"
    }

    func tapHaptic() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.prepare()
        generator.impactOccurred()
        status = "Haptic tap"
    }

    @discardableResult
    private func installTap() -> AVAudioFormat? {
        guard !tapInstalled else { return nil }
        let input = engine.inputNode
        let format = input.inputFormat(forBus: 0)
        guard format.sampleRate > 0 else { return nil }

        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            var sum: Float = 0
            if let data = buffer.floatChannelData?[0] {
                for index in 0..<Int(buffer.frameLength) {
                    let value = data[index]
                    sum += value * value
                }
            }
            let value = AudioMath.rmsDb(
                sumOfSquares: sum,
                count: Int(buffer.frameLength)
            )
            Task { @MainActor in
                self?.rmsDb = value
            }
        }
        tapInstalled = true
        return format
    }

    private func routeChanged() {
        refreshRoute()
        guard isRunning else { return }

        let session = AVAudioSession.sharedInstance()
        guard session.currentRoute.inputs.first != nil else {
            stop()
            status = "No input"
            return
        }

        if tapInstalled {
            engine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        player.stop()
        engine.stop()

        do {
            try session.setActive(true)
            if let format = installTap() {
                sampleRate = AudioMath.sampleRateLabel(format.sampleRate)
            }
            engine.prepare()
            try engine.start()
            status = "Route changed; input restarted"
            refreshRoute()
        } catch {
            errorText = error.localizedDescription
            status = "Route change failed"
            isRunning = false
        }
    }

    private func refreshRoute() {
        let session = AVAudioSession.sharedInstance()
        if let input = session.currentRoute.inputs.first {
            routePort = input.portType.rawValue
            routeName = input.portName
        } else {
            routePort = "No input"
            routeName = "—"
        }

        if !isRunning {
            sampleRate = "—"
        }
    }
}
