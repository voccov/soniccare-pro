# Review response — two independent critiques

**Plan first reviewed:** `v0.1.0-dev`  
**Plan after round 1:** `v0.1.0-dev.2`  
**Current plan:** `v0.1.0-dev.3`  
**Date:** 2026-11-05

This records what we accepted, what we rejected, and why. The current plan is in
`docs/PLAN.md`; the review packet is `docs/PLAN_FOR_REVIEW.md`.

---

## Round 1 — disposition

| # | Point | Verdict | Action |
|---|---|---|---|
| 1 | `.allowBluetoothHFP` will not compile | **Rejected — outdated** | Use `.allowBluetoothHFP` with a compiler fallback; `.allowBluetooth` is deprecated in Xcode 26. |
| 2 | Both ears can be equally clogged | **Accepted** | Per-ear SVR and a `Both high-frequency loss` category. |
| 3 | 165 Hz is defeated by ear detection | **Accepted** | Cut from MVP; future experiment only. |
| 4 | Live Activity breaks free-account limits | **Accepted** | Cut completely. |
| 5 | `xtool` on macOS is unnecessary risk | **Accepted** | XcodeGen + native `xcodebuild`. |
| 6 | Sample-buffer PiP is fragile | **Accepted** | Bundled MP4 + `AVPlayerLayer` (now with a looper). |
| 7 | A PWA may be the better first product | **Partially accepted** | PWA validation/fallback; native remains the craft product. |
| 8 | SideStore is bad for occasional use | **Accepted risk** | Baseline export/import, expiry warning, PWA fallback. |
| 9 | Three-target split is over-engineering | **Accepted** | One app target + one test target. |
| 10 | Five bash lint scripts are premature | **Accepted** | Keep `status.sh` and `check-docs.sh`; defer the rest. |
| 11 | Pseudo-localization is unnecessary | **Accepted** | English only in v1. |
| 12 | Cut Guide me / Quick test | **Accepted** | One linear flow with skips. |
| 13 | Stem tap triggers the force sensor | **Accepted** | Fingernail scratch on the bottom ring. |
| 14 | `App-Prefs:` is unreliable | **Accepted** | Manual Settings path and PiP video. |
| 15 | Public repo security | **Accepted** | Repo-scoped key; docs scan for identifiers. |
| 16 | Tertiary contrast too low | **Accepted** | `#8E8E93`; measured 5.64:1. |
| 17 | 0–100 score is false precision | **Accepted** | Categorical verdict + measured dB. |
| 18 | HFP may be 16 or 24 kHz | **Accepted with correction** | Also 8 kHz CVSD; read the actual sample rate. |

### The one rejected point

`.allowBluetoothHFP` **is** a valid `AVAudioSession.CategoryOptions` member in Xcode 26 /
iOS 26; `.allowBluetooth` is deprecated. The confusion is between the **Port**
`AVAudioSession.Port.bluetoothHFP` and the **CategoryOptions** member
`AVAudioSession.CategoryOptions.allowBluetoothHFP`. The plan uses:

```swift
#if compiler(>=6.2)
let options: AVAudioSession.CategoryOptions = [.allowBluetoothHFP, .allowBluetoothA2DP]
#else
let options: AVAudioSession.CategoryOptions = [.allowBluetooth, .allowBluetoothA2DP]
#endif
```

Evidence: Apple’s `CategoryOptions` documentation and the Swift Forums thread
“XCode 26: AVAudioSession.CategoryOptions.allowBluetooth deprecated.”

---

## Round 2 — disposition

| # | Point | Verdict | Action |
|---|---|---|---|
| 1 | Opposite-ear scratch check is impossible in one pass | **Accepted** | Single-channel target-ear scratch; silence means the wrong mic is active. |
| 2 | SVR must be cross-phase and band-integrated | **Accepted** | `HF` from Phase B (“Ssss”), `LF` from Phase A (“Ahhh”), integrated power, not mean per bin. |
| 3 | `xcodebuild` output path is wrong | **Accepted** | `-derivedDataPath build` and `-destination 'generic/platform=iOS'`; copy from `build/Build/Products/...`. |
| 4 | PiP needs `AVPlayerLooper` | **Accepted** | `AVQueuePlayer` + `AVPlayerLooper`; `requiresLinearPlayback = false`. |
| 5 | Safari may pick the iPhone mic | **Accepted** | PWA shows `sampleRate` and `label`; includes the scratch test; hard gate for native MVP. |
| 6 | Provisional SVR thresholds | **Accepted as hypotheses** | Starting values recorded; Phase 0A data sets the final thresholds. |
| 7 | XcodeGen may overwrite `Info.plist` | **Accepted** | `GENERATE_INFOPLIST_FILE: NO`; explicit `INFOPLIST_FILE`. |
| 8 | Scan Tailscale CGNAT/IPv6 ranges | **Accepted** | `check-docs.sh` extended. |
| 9 | Static vector assets for the four zones | **Accepted** | Use SVG/PDF assets; do not hand-code the diagram in Phase 1. |
| 10 | PWA as a hard gate; native as craft | **Accepted** | Phase 0A is a hard gate for the native MVP; native remains a craft build. |

### 2.1 Single-channel scratch verification

HFP sends one mono stream: the currently active microphone. The app cannot listen to both
ears at once. The revised spec:

- Prompt: “Lightly scratch the **left** bottom silver ring with a fingernail for one
  second.”
- If a broadband transient is at least **18 dB above the room noise floor**, the target
  ear is live: `Verified`.
- If there is no spike, iOS is still listening to the other microphone: `Wrong mic
  active — go back to Settings`.
- The threshold is adaptive; the fixed 18 dB is a starting point, not a lab constant.
- Do not claim an opposite-ear comparison in the same pass. A second pass, after switching
  the mic, can verify the other ear.

### 2.2 SVR cross-phase formula and band integration

The two phases are separate captures. `LF` comes from Phase A (“Ahhh”); `HF` comes from
Phase B (“Ssss”). Computing both bands inside a single phase is wrong: “Ahhh” has little
3–6.5 kHz energy, and “Ssss” has little 150–800 Hz energy.

Use **band-integrated RMS power**, not mean power per FFT bin, with the same window, FFT
size and normalization for both phases:

```
LF_dB = 10 * log10( Σ_{f=150}^{800}   |X_A(f)|² )
HF_dB = 10 * log10( Σ_{f=3000}^{6500} |X_B(f)|² )
SVR_dB = HF_dB - LF_dB
```

For 8 kHz CVSD input, use 2–3.5 kHz for `HF`. Same FFT size and window; no per-bin mean.
The earlier “mean power” wording was ambiguous and is removed.

Provisional starting thresholds (16/24 kHz HFP, band-integrated power; **not validated**):

| Category | Starting hypothesis |
|---|---|
| Healthy / balanced | SVR within −6 to +4 dB, or L/R SVR delta < 4 dB |
| Unilateral high-frequency loss | One ear’s SVR at least 6 dB lower than the other |
| Both high-frequency loss | L/R SVR within 5 dB **and** both SVR < −10 dB |
| Severely blocked | SVR < −18 dB, or “Ahhh” total RMS never exceeds −40 dBFS despite a passing quiet-room/scratch check |

Phase 0A records clean and muffled takes and sets the final thresholds. The app shows
confidence and never calls a low-SVR pair healthy.

### 2.3 Unsigned IPA build path

```sh
xcodebuild -project SonicCarePro.xcodeproj -scheme SonicCarePro \
  -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  build

mkdir -p Payload
cp -R build/Build/Products/Release-iphoneos/SonicCarePro.app Payload/
zip -qry SonicCarePro.ipa Payload
```

`xcodebuild` otherwise writes to `~/Library/Developer/Xcode/DerivedData/...`; the old copy
path would fail. `project.yml` sets `GENERATE_INFOPLIST_FILE: NO` and an explicit
`INFOPLIST_FILE` so the `UIBackgroundModes` (`audio`) and microphone usage strings are not
overwritten.

### 2.4 PiP looping

A 6-second video that reaches its end can collapse the PiP window. Use
`AVQueuePlayer` + `AVPlayerLooper` for `PiPGuide.mp4`, with a silent audio track in the
active session, and set `pipController.requiresLinearPlayback = false`. No manual
`AVPlayerItemDidPlayToEndTime` loop.

### 2.5 PWA Safari routing and hard gate

iOS Safari may choose the iPhone bottom microphone instead of the AirPods HFP microphone
when `getUserMedia` is called with processing disabled. The PWA therefore:

- Shows `audioTrack.getSettings().sampleRate` and `audioTrack.label`.
- Includes the same fingernail-scratch check; no spike means Safari is on the wrong mic.
- Labels the result `Unverified` rather than pretending it is the AirPods.

Phase 0A is a **hard gate for the native MVP**: if the PWA solves the owner’s problem, the
native app becomes an optional craft build, not a blocker. The PWA stays available as a
no-expiry fallback.

### 2.6 XcodeGen and security details

- `GENERATE_INFOPLIST_FILE: NO`; `INFOPLIST_FILE: Sources/SonicCarePro/Resources/Info.plist`.
- `-destination 'generic/platform=iOS'` so CI does not demand a connected device.
- `check-docs.sh` scans for emails, tailnet suffixes, Tailscale CGNAT/IPv6 prefixes and
  40-character device identifiers.
- The deploy key stays scoped to this one repository.

---

## What changed in revision 3

- Version `0.1.0-dev.3`.
- Single-channel scratch spec; no simultaneous opposite-ear claim.
- Cross-phase, band-integrated SVR formula and provisional thresholds.
- `xcodebuild` `-derivedDataPath` + generic iOS destination.
- `AVQueuePlayer` + `AVPlayerLooper` for PiP.
- PWA displays sample rate/label and uses the scratch check; Phase 0A is a hard gate.
- XcodeGen `Info.plist` settings.
- Tailscale IPv6/CGNAT scan.
- Static SVG/PDF vector assets for the four-zone diagram.

## What did not change

- Native remains the craft product.
- The free SideStore route remains the owner’s choice, with trade-offs stated.
- The SVR method remains the core measurement.
- Apple’s official cleaning method remains the safety reference.
- The five-step flow and the honest “measured vs not measured” report remain.
- Privacy: no uploads, accounts or analytics.

## Evidence

- Apple `AVAudioSession.CategoryOptions`:
  <https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct>
- Swift Forums, Xcode 26 `.allowBluetooth` deprecation:
  <https://forums.swift.org/t/xcode-26-avaudiosession-categoryoptions-allowbluetooth-deprecated/80956>
- Apple WWDC25 high-quality Bluetooth recording:
  <https://developer.apple.com/videos/play/wwdc2025/251>
- Apple ActivityKit:
  <https://developer.apple.com/documentation/activitykit>
- Apple AVKit Picture in Picture:
  <https://developer.apple.com/documentation/avkit/avpictureinpicturecontroller>
- XcodeGen: <https://github.com/yonaskolb/XcodeGen>
- SideStore install: <https://docs.sidestore.io/docs/installation/install>
- Apple cleaning guidance: <https://support.apple.com/en-us/120409>
