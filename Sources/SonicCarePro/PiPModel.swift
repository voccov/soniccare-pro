import AVFoundation
import AVKit
import Combine
import SwiftUI
import UIKit

@MainActor
final class PiPModel: NSObject, ObservableObject, AVPictureInPictureControllerDelegate {
    @Published var status: String = "PiP ready"

    private let player = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private var controller: AVPictureInPictureController?
    private weak var attachedLayer: AVPlayerLayer?
    private var configured = false

    override init() {
        super.init()
        guard let url = Bundle.main.url(forResource: "PiPGuide", withExtension: "mp4") else {
            status = "PiP video missing"
            return
        }
        let item = AVPlayerItem(url: url)
        looper = AVPlayerLooper(player: player, templateItem: item)
        player.isMuted = false
        configured = true
    }

    func attach(layer: AVPlayerLayer) {
        guard configured else { return }
        layer.player = player
        if controller == nil || attachedLayer !== layer {
            attachedLayer = layer
            let source = AVPictureInPictureController.ContentSource(playerLayer: layer)
            let pip = AVPictureInPictureController(contentSource: source)
            pip.delegate = self
            pip.canStartPictureInPictureAutomaticallyFromInline = true
            pip.requiresLinearPlayback = false
            controller = pip
        }
        player.play()
    }

    func start() {
        guard AVPictureInPictureController.isPictureInPictureSupported(), let controller else {
            status = "PiP not supported"
            return
        }

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .moviePlayback, options: [])
            try session.setActive(true)
        } catch {
            status = "Audio session: \(error.localizedDescription)"
            return
        }

        if player.timeControlStatus != .playing {
            player.play()
        }
        status = "Starting PiP…"
        controller.startPictureInPicture()
    }

    func pictureInPictureController(
        _ controller: AVPictureInPictureController,
        failedToStartPictureInPictureWithError error: Error
    ) {
        status = "PiP failed: \(error.localizedDescription)"
    }

    func pictureInPictureControllerDidStopPictureInPicture(
        _ controller: AVPictureInPictureController
    ) {
        status = "PiP closed. Tap Enable microphone to resume the test."
    }
}

final class PlayerLayerView: UIView {
    override class var layerClass: AnyClass { AVPlayerLayer.self }
    var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
}

struct PiPPlayerView: UIViewRepresentable {
    @ObservedObject var model: PiPModel

    func makeUIView(context: Context) -> PlayerLayerView {
        let view = PlayerLayerView()
        view.backgroundColor = .black
        view.playerLayer.videoGravity = .resizeAspect
        model.attach(layer: view.playerLayer)
        return view
    }

    func updateUIView(_ uiView: PlayerLayerView, context: Context) {}
}
