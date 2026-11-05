# SonicCare Pro — build plan

Status: **Phase 0A/0B — proof.** Plan revision `0.1.0-dev.2`, after independent review.
No app code yet. Last updated: 2026-11-05.

Review disposition: `docs/REVIEW_RESPONSE.md`. Full review packet:
`docs/PLAN_FOR_REVIEW.md`.

## Product in one line

A guided, honest left/right microphone check for AirPods Pro 2 that ends in one safe next
step: clean and retest, or stop and seek service.

## Fixed decisions

- Native SwiftUI iOS app (iOS 17+), one app target + one test target.
- Build: **XcodeGen + native `xcodebuild`** on GitHub Actions macOS. No `xtool`, no local
  Xcode, no Apple credentials on the server.
- Unsigned IPA, signed and installed on-device by **SideStore** with a free Apple ID.
- No TestFlight, no paid account, no App Store in v1.
- English first; Swedish later. No pseudo-localization in v1.
- Dark-only v1; one electric-blue accent; Apple-calm structure with tactile instrument
  detail.
- Manual Left/Right microphone switch in iOS Settings; the app guides and verifies with a
  one-second **fingernail scratch** on the bottom stem ring.
- Relative measurement only, with **per-ear SVR** and a **bilateral** category. HFP is a
  speech link; no lab calibration, firmware, serial or battery claims.
- One linear flow with inline guidance and visible skips. No Guide me / Quick test mode
  toggle.
- Categorical report plus measured dB delta. No 0–100 headline score.
- No 165 Hz tone in the MVP. No Live Activity.
- Audio stays on the phone. No uploads, accounts or analytics.

## Phase 0A — PWA validation (recommended, fast)

A single-page `web/` app, plain HTML/CSS/JS, hosted on GitHub Pages. It uses `getUserMedia`
with `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`, Web
Audio FFT bands, the same SVR and bilateral logic, localStorage, and JSON export. No
recordings, no uploads, no SideStore.

Purpose:

- Give the owner a working tool immediately, with no expiry.
- Validate the SVR and bilateral method on the actual AirPods and voice.
- Collect real band data to set the native thresholds.
- Serve as a fallback if SideStore is painful or expires between uses.

Acceptance: works in Safari on the iPhone; measures both ears; shows categorical results;
exports JSON; no network calls; no persisted audio.

## Phase 0B — Native proof (`v0.1.0`)

- [ ] Create the public GitHub repo and connect the deploy key.
- [ ] Complete the one-time SideStore setup; confirm the iPhone iOS version.
- [x] Product, design, UX, copy, setup, review response and decision records.
- [ ] Scaffold `project.yml` (XcodeGen), one app target, one test target, theme and app
      shell.
- [ ] Spike: microphone permission, route display, tone, RMS, `PiPGuide.mp4` PiP,
      haptics, self-test.
- [ ] GitHub Actions: `xcodegen`, `xcodebuild test` on the Simulator, unsigned IPA build,
      artifact/release.
- [ ] Install through SideStore; run the self-test on the iPhone.
- [ ] Design proof: connection, measurement and report screens with real tokens.
- [ ] Capture Simulator screenshots (dark, large Dynamic Type, small and large iPhone).
- [ ] Go/no-go review.

**Acceptance:** installs and launches via SideStore; mic permission and route display work;
a tone plays; RMS moves; video PiP starts or the checklist fallback is clear; haptics fire;
self-test reports pass/fail; a refresh keeps local data; the owner’s iOS version is
supported.

## Phase 1 — Diagnostic MVP (`v0.2.0`)

- [ ] Audio engine: `.playAndRecord` + `.measurement`, `.allowBluetoothHFP` with compiler
      fallback, route monitor, input tap, FFT, band energies, per-ear SVR, adaptive
      fingernail-scratch detection.
- [ ] Five-step flow: connection, side setup, voice test, report, recovery.
- [ ] One flow with inline “Why” disclosures, visible skip, resume after backgrounding.
- [ ] Report: categorical verdict, confidence, dB delta, spectral diff, “what we measured /
      what we didn’t”.
- [ ] Recovery: four zones, Apple’s official cleaning method, before/after baseline.
- [ ] Baseline export/import JSON via the share sheet.
- [ ] English copy through `Localizable.xcstrings`; all error, empty and loading states.
- [ ] Accessibility: VoiceOver, Dynamic Type, 44 pt, increased contrast, Reduce Motion.
- [ ] Tests for SVR, bilateral classification, band selection and storage.
- [ ] On-device test with the owner; one batch of fixes.

**Acceptance:** a complete left/right check in under five minutes; both ears can be flagged
as muffled; skipped steps show “Not tested”; no fabricated results; no crash; copy and
contrast checks pass.

## Phase 2 — Copilot and polish (`v0.3.0`)

- [ ] PiP video guide with `AVPlayerLayer`; test auto-start and button fallback.
- [ ] Settings checklist with manual path; no private URL promise.
- [ ] Motion pass: step transitions, result reveal, level ring, success check.
- [ ] Vector hero; four-zone anatomical diagram.
- [ ] Haptics tuning; Reduce Motion variants.
- [ ] Simulator screenshot review; final visual fixes.

**Acceptance:** guidance stays visible while the user is in Settings, or the fallback is
clear; motion is calm and purposeful; the app looks like one instrument, not a set of
screens.

## Phase 3 — Release loop (`v1.0.0`)

- [ ] AltSource JSON and one-tap `sidestore://install` link.
- [ ] Signing-expiry banner and baseline export prompt.
- [ ] `scripts/release.sh`: version, build, screenshots, GitHub release, source update.
- [ ] README and docs; no server port unless a host is explicitly added.
- [ ] Tag `v1.0.0`; hand over the install link and the 7-day refresh instructions.

**Acceptance:** the owner can install and update from the phone; the plan/status/changelog
reflect the release; no secrets, personal identifiers or audio committed.

## Automation

High-value automation first:

- **GitHub Actions macOS:** `xcodegen`, `xcodebuild test` on the Simulator,
  `xcodebuild` unsigned device build, IPA packaging, Simulator screenshots (dark, large
  Dynamic Type, small and large iPhone), `performAccessibilityAudit`, artifact/release.
- **PWA:** GitHub Pages deploy; no server.
- **Keep:** `scripts/status.sh` and `scripts/check-docs.sh` (version, phase, next actions,
  local-URL and personal-identifier checks).
- **Defer until the audio engine works:** copy/token/contrast lint scripts, screenshot
  automation beyond the basic captures, pseudo-localization.
- **Bounded review:** one batch of screenshots and fixes per phase; at most one
  confirmation round.

## Versioning

- Semver in `VERSION`; currently `0.1.0-dev.2`. The app version mirrors it when built.
- `CHANGELOG.md` and `docs/STATUS.md` update at every phase.
- Conventional Commits; tags `v0.1.0`, `v0.2.0`, `v0.3.0`, `v1.0.0`.
- The local project is its own git repo; the GitHub repo is the public mirror.
- The OpenChamber knowledge plan shows the checklist and current blockers.

## Open decisions

- Build the Phase 0A PWA validation track? Recommended.
- Public GitHub repo (recommended) or private + server-hosted IPA.
- iPhone iOS version and SideStore compatibility.
- One-time PC + USB availability for SideStore.
- Owner-only or shareable later. Assumed owner-first.

## Links

- Review response: `docs/REVIEW_RESPONSE.md`
- Full review packet: `docs/PLAN_FOR_REVIEW.md`
- GitHub new repo:
  <https://github.com/new?name=soniccare-pro&description=AirPods+Pro+microphone+diagnostic+and+recovery+app&visibility=public>
- SideStore install: <https://docs.sidestore.io/docs/installation/install>
- iloader: <https://iloader.app>
- LocalDevVPN: <https://apps.apple.com/app/localdevvpn/id6755608044>
- Apple cleaning guidance: <https://support.apple.com/en-us/120409>
- XcodeGen: <https://github.com/yonaskolb/XcodeGen>
