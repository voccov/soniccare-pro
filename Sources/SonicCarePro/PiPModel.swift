import AVFoundation
import AVKit
import Combine
import SwiftUI
import UIKit

@MainActor
final class PiPModel: ObservableObject {
    @Published var status: String = "PiP ready"

    private let player = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private var controller: AVPictureInPictureController?
    private var configured = false

    init() {
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
        if controller == nil {
            controller = AVPictureInPictureController(playerLayer: layer)
            controller?.canStartPictureInPictureAutomaticallyFromInline = true
            controller?.requiresLinearPlayback = false
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
        controller.startPictureInPicture()
        status = "PiP requested"
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
