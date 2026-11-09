# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Stack

SwiftUI (iOS 17+), one app target + one test target, built with XcodeGen and native
`xcodebuild` on GitHub Actions macOS. Distribution is an unsigned IPA, signed and
installed on-device with SideStore using a free Apple ID. No `xtool`, no TestFlight, no
paid developer account in v1. A small PWA validation build may be used before the native
app to test the acoustic method; it is not the product.

## Users

The owner first: a non-developer iPhone user with AirPods Pro (2nd generation), often in
a quiet room and holding the phone one-handed. They want to know whether a muffled earbud
is dirty, wet, or failing, and what to do next. Design for a first-time user who is not
an audio engineer, while making the app shareable later without assuming a support team.

## Product Purpose

A guided acoustic check that compares the left and right AirPods Pro microphones, shows
the high-frequency roll-off a blocked mesh creates, and gives one safe next step: clean
and retest, or stop and seek service. Success is a clear, honest result the owner can act
on in under five minutes.

## Positioning

The app separates what it actually measured from what it did not. It uses a relative
left/right sibilance-to-vowel comparison, verifies the selected microphone with a stem
tap, and never presents a guess as a measurement. It is a personal instrument, not a
medical device.

## Operating Context

- iPhone, usually one hand and a quiet room; AirPods Pro 2 in the ears or on a table.
- The user may leave the app for iOS Settings to switch the microphone. The flow must
  survive that trip, keep its state, and resume.
- The free Apple ID profile expires every 7 days; SideStore refreshes it. The app must
  tolerate re-signing and keep local data.
- English first; Swedish is a later locale.
- No network, no account, no analytics. Audio is processed in memory and never uploaded.

## Capabilities and Constraints

- Native iOS: `AVAudioSession` `.playAndRecord` + `.measurement`, `AVAudioEngine`,
  Accelerate/vDSP, CoreHaptics, Picture in Picture, background audio.
- iOS cannot let a third-party app toggle the AirPods Left/Right microphone setting.
  The user must change it in Settings; the app can guide and verify with a one-second
  fingernail scratch on the target ear. HFP sends one mono stream, so the app verifies only
  the target ear; silence means the other microphone is still active.
- Bluetooth HFP is a speech link: narrowband or wideband, band-limited and processed.
  Absolute calibration is not possible. Comparisons are relative. The app reads the actual
  input sample rate (8, 16 or 24 kHz) and lowers confidence when the high band is
  unavailable.
- HFP sends one mono microphone stream. The app can play a left/right ping over A2DP
  before capture, but it cannot prove left/right channel isolation while the HFP
  microphone is active. It never shows two live microphone meters or claims a simultaneous
  per-ear measurement.
- SVR is cross-phase and band-integrated: `LF` from Phase A (“Ahhh”, 150–800 Hz), `HF` from
  Phase B (“Ssss”, 3–6.5 kHz). Per-ear thresholds are provisional until Phase 0A data.
- Firmware, serial and battery are not available through public APIs. The app must not
  claim them.
- Free sideload limits: 3 apps per device including SideStore, 10 App IDs per week,
  7-day provisioning. The app is an occasional-use utility, so baseline export/import and
  a PWA fallback matter.
- No App Store distribution in v1. Private APIs are avoided; PiP is a Phase 2
  enhancement for a bundled guide video behind a `PERSONAL_BUILD` flag. The MVP uses an
  inline illustrated Settings path.
- One linear flow with inline guidance and visible skips. No Guide me / Quick test mode
  toggle.
- Per-ear SVR plus a bilateral `Both high-frequency loss` category; left/right similarity
  alone cannot rule out two equally muffled ears.
- Both earbuds stay in. The app measures one microphone at a time; the second ear card
  says **Next** until the microphone is switched in Settings.
- PiP uses a bundled looping MP4 with `AVQueuePlayer` + `AVPlayerLooper` in Phase 2.
- Phase 0A PWA is a hard gate for the native MVP; native remains the craft build.
- Categorical report plus measured dB delta. No 0–100 headline score.
- No 165 Hz tone and no Live Activity in the MVP.
- Dark-only v1 by design, with increased-contrast and Dynamic Type support.

## Brand Commitments

- Name: SonicCare Pro.
- Voice: calm, plain, specific, reassuring. Apple Support, not a coach.
- Visual world: dark tactile precision instrument. Apple-calm structure, Braun restraint,
  Teenage Engineering tactile detail.
- No AI-slop copy or decoration.

## Evidence on Hand

- The owner's PRD (in the project conversation) and this product record.
- The independent review (2026-11-05) and its disposition in `docs/REVIEW_RESPONSE.md`.
- No real acoustic captures, user testimonials, lab measurements, or clinical evidence.
  Do not fabricate any.
- Apple Support guidance for cleaning AirPods Pro 2 meshes is the safety reference:
  <https://support.apple.com/en-us/120409>.

## Product Principles

1. Never claim a measurement the app did not make.
2. One clear next action per screen.
3. Guide without blocking. Every optional step can be skipped, and skipped data is shown
   as not tested.
4. Keep audio on the device.
5. Native craft over decoration: a precision instrument, not a dashboard.
6. Prefer a categorical, measured result over a false-precision score.
7. Check each ear on its own; two equally muffled ears must not pass as healthy.

## Accessibility & Inclusion

- Dynamic Type, VoiceOver labels and hints, 44×44 pt targets, increased contrast,
  Reduce Motion, and no color-only status.
- English first and localization-ready; Swedish later.
