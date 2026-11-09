# Changelog

All notable changes to SonicCare Pro. The format follows Keep a Changelog; versions use
semver.

## [Unreleased]

### Added

- Phase 1 interactive UX/UI blueprint at `web/blueprint/`: Graphite and Porcelain
  variants, System/Full/Reduced motion, happy/route/low-signal states, inline Settings
  and scratch, one-microphone-at-a-time measurement, a 36-second walkthrough and an MP4
  recording.

- `web/selftest.html`: a phone checklist mirroring the native self-test. It copies a
  structured pass/fail result and is linked from the install page.
- macOS install path documented for iloader (DMG v2.4.1 or `brew install --cask
  iloader`), including iPhone trust, Developer Mode, LocalDevVPN and troubleshooting.
- Phase 0A experiment: channel-panned ear-identity ping and a quiet tone/sweep loopback
  through the AirPods while the HFP microphone is active. The data decides whether it
  becomes a feature; the voice SVR remains the method.
- Phase 1 interaction direction: readiness and fit-test prompt, ear-identity ping,
  one-microphone-at-a-time measurement with two ear cards, target-level ring, vector
  animation, and no PiP in the MVP.
- `web/mockup.html`: a clickable Phase 1 flow mockup with example data, covering
  readiness, ear ping, inline Settings and scratch, both measurement phases, the
  right-ear switch, result and cleaning. Published at
  <https://voccov.github.io/soniccare-pro/mockup.html>.

### Changed

- The PWA, Phase 1 mockup and blueprint link to each other for quick switching.

- `docs/SETUP.md` rewritten for the owner's macOS machine; `STATUS.md`, `PLAN.md` and
  `README.md` now point at the macOS install step and the self-test checklist.
- `docs/SETUP.md` notes that Tailscale cannot replace LocalDevVPN, that iOS keeps one VPN
  active at a time, and the iOS 26.4+ remote-pairing workaround.
- `docs/SETUP.md` documents the SideStore `-80045` sign-in workaround and the iloader
  direct-IPA fallback for the self-test build.
- The published IPA was re-verified: arm64, iOS 17+, iPhone only, `PiPGuide.mp4`
  bundled, 115,110 bytes.
- PiP is deferred to Phase 2 (`ADR-013`); the MVP uses an inline illustrated Settings
  path.
- Recorded the first native self-test run: haptic tap does not fire, sample rate displays
  48000 Hz (engine rate, not proof of the HFP link), and the header scrolls under the
  status bar.
- `docs/PLAN.md`, `docs/UX.md`, `PRODUCT.md`, `docs/DECISIONS.md` and `docs/STATUS.md`
  reflect the interactive direction.

## [0.1.0-dev.4] — 2026-11-05

### Changed

- Native self-test uses Dynamic Type text styles, a shared `Theme`, and adaptive button /
  PiP rows so large text does not clip.
- Native unit tests now cover `AudioMath` RMS, level mapping, Bluetooth port detection and
  sample-rate labels; CI runs them with a timeout.
- The PWA report requires a confirmed AirPods input and a verified scratch check before it
  shows a diagnostic category; otherwise it shows `Unverified`.
- The PWA records the input label and sample rate for each phase and flags a changed input.
- Pre-dev.4 saved captures are migrated to the per-phase input schema, so an existing
  result survives a reload.
- Demo mode uses a 220 Hz + 4.5 kHz two-tone signal and reports `Demo only`.

### Fixed

- PWA: changing ears during a capture no longer files the result under the wrong ear.
- PWA: an iPhone-microphone capture can no longer produce `Left/Right high-frequency loss`.
- PWA: a tie in the severe category no longer arbitrarily says `Right`.
- Native: starting PiP no longer leaves the microphone engine running under a playback
  session; the mic pauses and the UI says so.
- Native: a route change reactivates the audio session and reports the real input sample
  rate from the tap.
- Native: the iOS 26 `.allowBluetoothHFP` path is availability-guarded; iOS 17 uses
  `AVAudioApplication` for permission.
- CI: the test step has timeouts, and the failure-log release step only runs when the build
  step actually produced a log.

## [0.1.0-dev.3] — 2026-11-05

### Added

- Phase 0A PWA validation app in `web/`: on-device microphone capture, cross-phase SVR,
  scratch check, demo mode, localStorage, JSON export, installable manifest.
- Vocal-gated capture, friction-ratio scratch detection, adaptive 8 kHz bandwidth
  detection, automatic stream re-lock on return from Settings, a 4-zone cleaning guide,
  a 2-hour drying timer, and Copy JSON.
- GitHub Pages deployment workflow.
- Phase 0B native self-test: XcodeGen project, SwiftUI self-test shell, microphone
  permission, HFP route, sample rate, live RMS, 1 kHz tone, haptics, looping PiP video,
  unsigned IPA, GitHub Actions build, and install page.

### Fixed

- Scratch verification is explicitly **single-channel**: HFP streams only the active
  microphone, so the app verifies the target ear and treats silence as “wrong mic active”.
- SVR is **cross-phase and band-integrated**: `HF` from Phase B (“Ssss”) minus `LF` from
  Phase A (“Ahhh”), not a within-phase mean-per-bin value.
- `xcodebuild` now uses `-derivedDataPath build -destination 'generic/platform=iOS'`; the
  IPA copy path is correct.
- PiP uses `AVQueuePlayer` + `AVPlayerLooper` and `requiresLinearPlayback = false`, so the
  looping guide does not collapse at the end of the video.
- XcodeGen keeps an explicit `Info.plist` (`GENERATE_INFOPLIST_FILE: NO`).
- PWA displays `sampleRate`/`label` and includes the scratch check; Phase 0A is a hard gate
  for the native MVP.
- Provisional SVR thresholds are recorded as hypotheses for Phase 0A calibration.
- `check-docs.sh` scans Tailscale CGNAT/IPv6 prefixes as well as emails and device IDs.

## [0.1.0-dev.2] — 2026-11-05

### Changed

- Build switched from `xtool` to **XcodeGen + native `xcodebuild`** on GitHub Actions
  macOS; one app target + one test target.
- Added a **PWA validation/fallback** track for the acoustic method.
- Added **per-ear SVR** and a `Both high-frequency loss` category.
- Report leads with a **categorical verdict + measured dB**; removed the 0–100 headline.
- PiP uses a bundled looping MP4 + `AVPlayerLayer`; removed the sample-buffer renderer.
- One linear flow with inline guidance and skip; removed the Guide me / Quick test toggle.
- Side verification uses a **fingernail scratch**; no stem tap.
- Removed the `App-Prefs:` one-tap promise; manual Settings path and PiP video.
- Tertiary text changed from `#6E6E76` (3.64:1) to `#8E8E93` (5.64:1).
- Added baseline export/import; signing-expiry warning.
- Deferred copy/token/contrast lint scripts, screenshot automation and
  pseudo-localization.

### Removed

- 165 Hz water-eject tone from the MVP.
- Live Activity fallback.
- Three-module SwiftPM split.
- `xtool` build path.
- `App-Prefs:` primary UX.
- 0–100 score headline.

### Added

- `docs/REVIEW_RESPONSE.md`: disposition of the independent critique.
- `docs/PLAN_FOR_REVIEW.md` revision 2.

## [0.1.0-dev] — 2026-11-05

### Added

- `PRODUCT.md`, `DESIGN.md`, `docs/UX.md`, `docs/COPY.md` and `docs/DESIGN_REVIEW.md`.
- `docs/PLAN.md` with Phase 0–3, acceptance criteria, automation and versioning.
- `docs/STATUS.md`, `docs/DECISIONS.md` and `docs/SETUP.md`.
- `docs/PLAN_FOR_REVIEW.md`: a self-contained review packet with the full plan, the
  rationale for each decision, the risks, and questions for an independent reviewer.
- Free native distribution decision: unsigned IPA + SideStore, no TestFlight.
- English-first and dark-only v1 decisions.
- Impeccable v4.8.0 design workflow.

### Changed

- The project moves from a web-first assumption to a native SwiftUI iOS app.
- The owner's Swedish-first PRD becomes an English-first product, with Swedish as a later
  localization.
