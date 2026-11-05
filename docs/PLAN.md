# SonicCare Pro — build plan

Status: **Phase 0 — proof.** Planning and design records are complete. No app code yet.
Version: `0.1.0-dev`. Last updated: 2026-11-05.

## Product in one line

A guided, honest left/right microphone check for AirPods Pro 2 that ends in one safe next
step: clean and retest, or stop and seek service.

## Fixed decisions

- Native SwiftUI iOS app (iOS 17+), not a web app.
- Free distribution: unsigned IPA built on GitHub Actions macOS, signed and installed
  on-device with SideStore and a free Apple ID. No TestFlight, no paid account.
- English first; Swedish is a later localization.
- Dark-only v1; one electric-blue accent; Apple-calm structure with tactile instrument
  detail.
- Manual Left/Right microphone switch in iOS Settings; the app guides and verifies with
  a stem tap. No public API can toggle it.
- Relative measurement only. The app never claims absolute calibration, firmware,
  serial, battery or a hardware diagnosis it did not measure.
- Audio stays on the phone. No uploads, accounts or analytics.

## Phase 0 — Proof (`v0.1.0`)

Goal: prove the build, install, signing and native capability chain before building the
full app.

- [ ] Create the public GitHub repo and connect it with a deploy key.
- [ ] Complete the one-time SideStore setup; confirm the iPhone iOS version.
- [x] Product, design, UX, copy and setup records.
- [ ] Scaffold the SwiftPM + `xtool` project with the shared theme and app shell.
- [ ] Spike app: microphone permission, route display, test tone, RMS meter, PiP card,
      haptics, and a self-test screen.
- [ ] GitHub Actions workflow: test, build unsigned IPA, upload artifact/release.
- [ ] Install the spike through SideStore; run the self-test on the iPhone.
- [ ] Design proof: connection, measurement and report screens with real tokens.
- [ ] Capture Simulator screenshots (dark, large Dynamic Type, small and large iPhone).
- [ ] Go/no-go review against the acceptance criteria below.

**Acceptance:** the app installs and launches via SideStore; microphone permission and
route display work; a tone plays; RMS moves; PiP starts (auto or button); haptics fire;
the self-test reports pass/fail; a refresh keeps local data; the owner's iOS version is
supported.

## Phase 1 — Diagnostic MVP (`v0.2.0`)

- [ ] Audio engine: `AVAudioSession` `.playAndRecord` + `.measurement`, route monitor,
      input tap, FFT, band energies, SVR, adaptive stem-tap detection.
- [ ] Five-step flow: connection, side setup, voice test, report, recovery.
- [ ] Guide me / Quick test modes; skip rules; resume after backgrounding.
- [ ] Report: score, confidence, spectral diff, "what we measured / what we didn't".
- [ ] Recovery: four zones, Apple's official cleaning method, 165 Hz comfort tone,
      before/after baseline.
- [ ] English copy through `Localizable.xcstrings`; all error, empty and loading states.
- [ ] Accessibility: VoiceOver, Dynamic Type, 44 pt, increased contrast, Reduce Motion.
- [ ] Unit tests for band energies, SVR, scoring and storage.
- [ ] On-device test with the owner; one batch of fixes.

**Acceptance:** a complete left/right check in under five minutes; skipped steps show
"Not tested"; no fabricated results; no crash; copy and contrast checks pass.

## Phase 2 — Copilot and polish (`v0.3.0`)

- [ ] PiP guide with `AVSampleBufferDisplayLayer`; test auto-start and button fallback.
- [ ] Settings deep link with public fallback; never a dead end.
- [ ] Motion pass: step transitions, score reveal, level ring, success check.
- [ ] 3D-styled vector hero; four-zone anatomical diagram.
- [ ] Live Activity fallback if PiP auto-start is blocked.
- [ ] Haptics tuning; Reduce Motion variants.
- [ ] Simulator screenshot review; final visual fixes.

**Acceptance:** guidance stays visible while the user is in Settings, or the fallback is
clear; motion is calm and purposeful; the app looks like one instrument, not a set of
screens.

## Phase 3 — Release loop (`v1.0.0`)

- [ ] AltSource JSON and one-tap `sidestore://install` link.
- [ ] Signing-expiry banner and refresh instructions.
- [ ] `scripts/release.sh`: version, build, screenshots, GitHub release, source update.
- [ ] README, `docs/server.md` if a server host is added, dashboard registration if a
      service is added.
- [ ] Tag `v1.0.0`; hand over the install link and the 7-day refresh instructions.

**Acceptance:** the owner can install and update from the phone; the plan/status/changelog
reflect the release; no secrets or data committed.

## Automation

- **GitHub Actions macOS:** `swift test`, SwiftFormat/SwiftLint, `xtool dev build --ipa`,
  Simulator screenshots (dark, large Dynamic Type, small and large iPhone),
  `performAccessibilityAudit`, artifacts, tag → release + SideStore source.
- **Scripts:** `check-copy.sh` (banned phrases, exclamation marks, placeholders),
  `check-tokens.sh` (no raw colors/fonts outside `Theme.swift`), `check-contrast.sh`
  (WCAG 4.5:1 body / 3:1 large), `screenshots.sh` (launch arguments per state),
  `release.sh` (version, build, screenshots, release, source).
- **Docs:** `PRODUCT.md`, `DESIGN.md`, `docs/UX.md`, `docs/COPY.md`,
  `docs/DESIGN_REVIEW.md`, `docs/STATUS.md`, `docs/DECISIONS.md`.
- **Bounded review:** one batch of screenshots and fixes per phase; at most one
  confirmation round. No endless polishing.

## Versioning

- Semver in `VERSION`; app `CFBundleShortVersionString` mirrors it.
- `CHANGELOG.md` gets an entry per phase; `docs/STATUS.md` is updated at every handoff.
- Conventional Commits; one phase per tag. Tags: `v0.1.0`, `v0.2.0`, `v0.3.0`, `v1.0.0`.
- The GitHub repo is the public mirror; the local project repo is the source of truth.

## Open decisions

- GitHub repo visibility: public (recommended for the free route) or private (needs a
  token and a server host for the IPA).
- iPhone iOS version and SideStore compatibility.
- One-time PC + USB availability for SideStore.
- Whether the app is for the owner only or shareable later. Assumed owner-first.

## Links

- GitHub new repo: <https://github.com/new?name=soniccare-pro&description=AirPods+Pro+microphone+diagnostic+and+recovery+app&visibility=public>
- SideStore prerequisites: <https://docs.sidestore.io/docs/installation/prerequisites>
- SideStore install: <https://docs.sidestore.io/docs/installation/install>
- iloader: <https://iloader.app>
- LocalDevVPN: <https://apps.apple.com/app/localdevvpn/id6755608044>
- Apple cleaning guidance: <https://support.apple.com/en-us/120409>
