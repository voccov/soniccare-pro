# SonicCare Pro — build plan

Status: **Phase 0A/0B — proof.** Plan revision `0.1.0-dev.4`, after two independent reviews.
The PWA is live; the native Phase 0B self-test is built, tested in CI and waiting for an
install from the owner's Mac. Last updated: 2026-11-09.

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
- Manual Left/Right microphone switch in iOS Settings. HFP sends one mono stream, so the
  app verifies only the **target ear** with a one-second fingernail scratch: a transient
  ≥18 dB above the noise floor confirms it; silence means the other mic is still active.
  The app cannot compare both ears simultaneously.
- Relative measurement only, with **per-ear SVR** and a **bilateral** category. `LF` is
  the band-integrated power during Phase A (“Ahhh”, 150–800 Hz); `HF` is the integrated
  power during Phase B (“Ssss”, 3–6.5 kHz); `SVR = HF − LF`. HFP can be 8, 16 or 24 kHz;
  read the actual rate and set the band from Nyquist. No lab calibration, firmware,
  serial or battery claims.
- One linear flow per check with inline guidance and visible skips. A short start menu
  offers the microphone check, a sound check and an optional fit guide. No Guide me /
  Quick test mode toggle inside a check.
- Categorical report plus measured dB delta. No 0–100 headline score.
- PiP is Phase 2, not the MVP. The MVP shows the Settings path as an inline illustrated
  step; the bundled loop with `AVQueuePlayer` + `AVPlayerLooper` is the later guide. No
  Live Activity.
- No 165 Hz tone in the MVP.
- Phase 0A PWA is a hard gate for the native MVP; native remains the craft build.
- Audio stays on the phone. No uploads, accounts or analytics.

## Phase 0A — PWA validation (hard gate, fast)

A single-page `web/` app, plain HTML/CSS/JS, hosted on GitHub Pages. It uses `getUserMedia`
with `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`, Web
Audio FFT bands, the same cross-phase SVR and bilateral logic, localStorage, and JSON
export. No recordings, no uploads, no SideStore.

It must show `audioTrack.getSettings().sampleRate` and `audioTrack.label`, and include the
fingernail-scratch check. If scratching the AirPod stem does not spike the meter, Safari is
on the iPhone microphone; the result is `Unverified`.

Purpose:

- Give the owner a working tool immediately, with no expiry.
- Validate the SVR and bilateral method on the actual AirPods and voice.
- Collect real band data to set the native thresholds.
- Serve as a fallback if SideStore is painful or expires between uses.
- Act as a **hard gate** for the native MVP: if the PWA solves the problem, native becomes
  an optional craft build.
- Test the **interactive audio idea** before native work: a channel-panned left/right ping
  before capture, and a quiet tone or sweep through the AirPods while the HFP microphone
  is active. Decide from data whether the loopback becomes a feature; the voice SVR
  remains the validated method until then.

Acceptance: works in Safari on the iPhone; displays route label and sample rate; measures
both ears; shows categorical results; the scratch check distinguishes the AirPods mic from
the iPhone mic; exports JSON; no network calls; no persisted audio.

## Phase 0B — Native proof (`v0.1.0`)

- [x] Create the public GitHub repo and connect the deploy key.
- [ ] Complete the one-time SideStore setup from macOS; iOS 26.7.2 is confirmed.
- [x] Product, design, UX, copy, setup, review response and decision records.
- [x] Scaffold `project.yml` (XcodeGen), one app target, one test target, theme and app
      shell.
- [x] Spike: microphone permission, route display, tone, RMS, `PiPGuide.mp4` PiP,
      haptics, self-test.
- [x] GitHub Actions: `xcodegen`, `xcodebuild test` on the Simulator, unsigned IPA build
      with `-derivedDataPath build` and `-destination 'generic/platform=iOS'`; release
      `native-latest`. Unit tests run in CI with a timeout.
- [ ] Install through SideStore; run the self-test on the iPhone and record it at
      <https://voccov.github.io/soniccare-pro/selftest.html>.
- [x] Interactive UX/UI blueprint: `web/blueprint/` with Graphite/Porcelain, motion,
      route/low-signal states, a 36-second walkthrough and a recorded video.
- [ ] Design proof: connection, measurement and report screens with real tokens.
- [ ] Capture Simulator screenshots (dark, large Dynamic Type, small and large iPhone).
- [ ] Go/no-go review.

**Acceptance:** installs and launches via SideStore; mic permission and route display work;
a tone plays; RMS moves; video PiP starts or the checklist fallback is clear; haptics fire;
self-test reports pass/fail; a refresh keeps local data; the owner’s iOS version is
supported.

## Phase 1 — Diagnostic MVP (`v0.2.0`)

- [ ] Audio engine: `.playAndRecord` + `.measurement`, `.allowBluetoothHFP` with compiler
      fallback, route monitor, input tap, FFT, band-integrated power, **cross-phase SVR**
      (`HF` from “Ssss” minus `LF` from “Ahhh”), and single-channel target-ear scratch
      detection.
- [ ] Provisional categories: balanced, unilateral loss, bilateral loss, severely blocked;
      thresholds are starting hypotheses and are calibrated from Phase 0A data.
- [ ] Guided flow: test chooser, readiness, connection, ear identity, side setup, voice
      test, report, recovery.
- [ ] Sound check: a real, quiet 1 kHz tone panned left/right; the user reports where each
      tone is heard. It checks drivers and stereo routing, not the microphone.
- [ ] Optional fit guide: Apple's Ear Tip Fit Test path and tip sizes; it never blocks the
      microphone check and the report says **Fit check: not checked** if skipped.
- [ ] Readiness: case → ears, optional Ear Tip Fit Test prompt, quiet-room check and a
      volume-safety gate. Both earbuds stay in; the app never asks the user to remove one
      for the measurement.
- [ ] Stereo ear-identity ping before capture: a left-only or right-only tone over A2DP,
      then “Which ear did you hear it in?”. Catches swapped earbuds and a dead driver;
      makes no microphone claim.
- [ ] One microphone at a time. Two ear cards, but only the active microphone has a live
      meter; the other card says **Next**. No fake simultaneous left/right data.
- [ ] Target-level ring and automatic phase detection; reject low or clipped frames and
      ask for a short retry instead of accepting a bad capture.
- [ ] Inline illustrated Settings path (Bluetooth → (i) → Microphone → Always Left/Right)
      with the fingernail-scratch verification. PiP stays in Phase 2.
- [ ] Purposeful vector animation for the case, earbud, mesh zone and level ring; Reduce
      Motion variants. Only the level ring and spectrum animate continuously.
- [ ] Acoustic loopback or sweep only if the Phase 0A experiment shows a repeatable
      per-ear response. The voice SVR remains the default method.
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
as muffled; both earbuds stay in and only one microphone is measured at a time; skipped
steps show “Not tested”; no fabricated results; a non-technical user can finish without
audio jargon; no crash; copy and contrast checks pass.

## Phase 2 — Copilot and polish (`v0.3.0`)

- [ ] PiP video guide with `AVQueuePlayer` + `AVPlayerLooper`; test auto-start and button
      fallback. The MVP ships the inline illustrated Settings path; PiP is the enhancement.
- [ ] Settings checklist with manual path; no private URL promise.
- [ ] Motion pass: step transitions, result reveal, level ring, success check.
- [ ] Vector hero; four-zone anatomical diagram from static SVG/PDF assets.
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
  `xcodebuild` unsigned device build with `-derivedDataPath build` and
  `-destination 'generic/platform=iOS'`, IPA packaging, Simulator screenshots (dark, large
  Dynamic Type, small and large iPhone), `performAccessibilityAudit`, artifact/release.
  `project.yml` sets `GENERATE_INFOPLIST_FILE: NO` and an explicit `INFOPLIST_FILE`.
- **PWA:** GitHub Pages deploy; no server.
- **Keep:** `scripts/status.sh` and `scripts/check-docs.sh` (version, phase, next actions,
  local-URL and personal-identifier checks, including Tailscale CGNAT/IPv6 prefixes).
- **Defer until the audio engine works:** copy/token/contrast lint scripts, screenshot
  automation beyond the basic captures, pseudo-localization.
- **Bounded review:** one batch of screenshots and fixes per phase; at most one
  confirmation round.

## Versioning

- Semver in `VERSION`; currently `0.1.0-dev.4`. The app displays `0.1.0` because
  `CFBundleShortVersionString` cannot carry a SemVer pre-release suffix; the build number
  tracks the iteration.
- `CHANGELOG.md` and `docs/STATUS.md` update at every phase.
- Conventional Commits; tags `v0.1.0`, `v0.2.0`, `v0.3.0`, `v1.0.0`.
- The local project is its own git repo; the GitHub repo is the public mirror.
- The OpenChamber knowledge plan shows the checklist and current blockers.

## Decisions and remaining unknowns

- Phase 0A PWA validation track: done; it is the hard gate for the native MVP.
- Public GitHub repo: done; no secrets or personal data.
- iPhone: iOS 26.7.2 confirmed.
- SideStore: one-time macOS + USB install pending; the Mac, iPhone and cable are
  available. iOS 26.7.2 confirmed.
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
