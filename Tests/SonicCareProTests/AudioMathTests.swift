import Foundation
import XCTest
@testable import SonicCarePro

final class AudioMathTests: XCTestCase {
    func testSilenceFloorsAtMinus90() {
        XCTAssertEqual(AudioMath.rmsDb(sumOfSquares: 0, count: 1024), -90, accuracy: 0.001)
        XCTAssertEqual(AudioMath.rmsDb(sumOfSquares: 0, count: 0), -90, accuracy: 0.001)
        XCTAssertEqual(AudioMath.rmsDb(sumOfSquares: .nan, count: 1024), -90, accuracy: 0.001)
    }

    func testFullScaleSineRms() {
        let count = 4_800
        var sum: Float = 0
        for index in 0..<count {
            let value = sin(2.0 * .pi * 1_000.0 * Float(index) / 48_000.0)
            sum += value * value
        }
        XCTAssertEqual(AudioMath.rmsDb(sumOfSquares: sum, count: count), -3.01, accuracy: 0.05)
    }

    func testHalfScaleSineRms() {
        let count = 4_800
        var sum: Float = 0
        for index in 0..<count {
            let value = 0.5 * sin(2.0 * .pi * 1_000.0 * Float(index) / 48_000.0)
            sum += value * value
        }
        XCTAssertEqual(AudioMath.rmsDb(sumOfSquares: sum, count: count), -9.03, accuracy: 0.05)
    }

    func testLevelFractionClamps() {
        XCTAssertEqual(AudioMath.levelFraction(-120), 0, accuracy: 0.001)
        XCTAssertEqual(AudioMath.levelFraction(-90), 0, accuracy: 0.001)
        XCTAssertEqual(AudioMath.levelFraction(-50), 0.5, accuracy: 0.001)
        XCTAssertEqual(AudioMath.levelFraction(-10), 1, accuracy: 0.001)
        XCTAssertEqual(AudioMath.levelFraction(0), 1, accuracy: 0.001)
    }

    func testBluetoothPortDetection() {
        XCTAssertTrue(AudioMath.isBluetoothPort("BluetoothHFP"))
        XCTAssertTrue(AudioMath.isBluetoothPort("BluetoothA2DP"))
        XCTAssertFalse(AudioMath.isBluetoothPort("BuiltInMic"))
        XCTAssertFalse(AudioMath.isBluetoothPort("No input"))
    }

    func testSampleRateLabel() {
        XCTAssertEqual(AudioMath.sampleRateLabel(48_000), "48000 Hz")
        XCTAssertEqual(AudioMath.sampleRateLabel(8_000), "8000 Hz")
        XCTAssertEqual(AudioMath.sampleRateLabel(0), "—")
    }
}
