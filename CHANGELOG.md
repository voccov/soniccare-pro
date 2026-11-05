# Changelog

All notable changes to SonicCare Pro. The format follows Keep a Changelog; versions use
semver.

## [Unreleased]

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
