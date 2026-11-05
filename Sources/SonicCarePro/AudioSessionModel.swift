import AVFoundation
import Combine
import UIKit

@MainActor
final class AudioSessionModel: ObservableObject {
    @Published var permission: String = "Not requested"
    @Published var routePort: String = "—"
    @Published var routeName: String = "—"
    @Published var sampleRate: String = "—"
    @Published var rmsDb: Double = -90
    @Published var isRunning: Bool = false
    @Published var status: String = "Idle"
    @Published var errorText: String?

    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var tapInstalled = false
    private var toneConfigured = false
    private var routeObserver: NSObjectProtocol?

    init() {
        routeObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.refreshRoute()
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
        let session = AVAudioSession.sharedInstance()
        session.requestRecordPermission { [weak self] granted in
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
    }

    func start() {
        guard !isRunning else { return }

        do {
            let session = AVAudioSession.sharedInstance()
            #if compiler(>=6.2)
            let options: AVAudioSession.CategoryOptions = [.allowBluetoothHFP, .allowBluetoothA2DP]
            #else
            let options: AVAudioSession.CategoryOptions = [.allowBluetooth, .allowBluetoothA2DP]
            #endif

            do {
                try session.setCategory(.playAndRecord, mode: .measurement, options: options)
            } catch {
                try session.setCategory(.playAndRecord, mode: .default, options: options)
            }
            try session.setActive(true)

            let input = engine.inputNode
            let format = input.inputFormat(forBus: 0)
            if format.sampleRate > 0, !tapInstalled {
                input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
                    let value = Self.rms(buffer)
                    Task { @MainActor in
                        self?.rmsDb = value
                    }
                }
                tapInstalled = true
            }

            if !toneConfigured {
                engine.attach(player)
                let toneFormat = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 1)!
                engine.connect(player, to: engine.mainMixerNode, format: toneFormat)
                toneConfigured = true
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
        rmsDb = -90
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

    private func refreshRoute() {
        let session = AVAudioSession.sharedInstance()
        if let input = session.currentRoute.inputs.first {
            routePort = input.portType.rawValue
            routeName = input.portName
        } else {
            routePort = "No input"
            routeName = "—"
        }

        let rate = engine.inputNode.inputFormat(forBus: 0).sampleRate
        sampleRate = rate > 0 ? String(format: "%.0f Hz", rate) : "—"
    }

    private static func rms(_ buffer: AVAudioPCMBuffer) -> Double {
        guard let data = buffer.floatChannelData?[0] else { return -90 }
        let count = Int(buffer.frameLength)
        guard count > 0 else { return -90 }

        var sum: Float = 0
        for index in 0..<count {
            let value = data[index]
            sum += value * value
        }
        let rms = sqrt(sum / Float(count))
        return 20.0 * log10(max(Double(rms), 1e-7))
    }
}
