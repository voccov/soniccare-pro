import Foundation

/// Pure math used by the self-test. Kept separate from `AVAudioSession` so it can be
/// tested on the Simulator without touching microphone permission or hardware.
enum AudioMath {
    static let silenceFloorDb: Double = -90
    static let meterCeilingDb: Double = -10

    /// dBFS from a buffer sum of squares. Silence is clamped to the display floor.
    static func rmsDb(sumOfSquares: Float, count: Int) -> Double {
        guard count > 0, sumOfSquares.isFinite, sumOfSquares > 0 else {
            return silenceFloorDb
        }
        let rms = sqrt(Double(sumOfSquares) / Double(count))
        guard rms > 0, rms.isFinite else { return silenceFloorDb }
        return max(silenceFloorDb, 20 * log10(rms))
    }

    /// Maps dBFS to the 0...1 level meter, with a -90 dB floor and a -10 dB ceiling.
    static func levelFraction(_ db: Double) -> Double {
        let span = meterCeilingDb - silenceFloorDb
        guard span > 0 else { return 0 }
        return min(1, max(0, (db - silenceFloorDb) / span))
    }

    /// HFP and A2DP port raw values both contain "Bluetooth". Built-in ports do not.
    static func isBluetoothPort(_ port: String) -> Bool {
        port.lowercased().contains("bluetooth")
    }

    static func sampleRateLabel(_ rate: Double) -> String {
        guard rate > 0, rate.isFinite else { return "—" }
        return String(format: "%.0f Hz", rate)
    }
}
