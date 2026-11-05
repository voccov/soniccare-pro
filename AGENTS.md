# AGENTS.md — airpods-doctor

Project rules for this standalone workspace. They apply to every session in this folder.

## What this is

A native SwiftUI iOS app for AirPods Pro (2nd generation): a guided left/right microphone
check, a plain-language report, and a safe cleaning guide. A small PWA validation track
tests the acoustic method before the native build. English first; Swedish is a later
locale. Owner-facing and mobile-first.

Status: Phase 0A/0B — proof. Plan revision `0.1.0-dev.3`. Do not scaffold beyond the
Phase 0 spike until the go/no-go review passes.

## Settled decisions

- Native iOS, one app target + one test target, built with XcodeGen + native `xcodebuild`
  on GitHub Actions macOS. No `xtool`.
- Free distribution: unsigned IPA; SideStore signs and installs with a free Apple ID. No
  TestFlight and no paid developer account.
- The app cannot toggle the AirPods Left/Right microphone setting. The user changes it in
  Settings; the app verifies the **target ear** with a one-second fingernail scratch.
  HFP sends one mono stream: a transient at least 18 dB above the noise floor means
  `Verified`; silence means the other microphone is still active. Never claim a
  simultaneous opposite-ear comparison.
- Firmware, serial and battery are not available through public APIs. Never claim them.
- Relative measurement only: **cross-phase, band-integrated SVR**. `LF` comes from Phase A
  (“Ahhh”, 150–800 Hz); `HF` comes from Phase B (“Ssss”, 3–6.5 kHz); `SVR = HF − LF`.
  HFP can be 8, 16 or 24 kHz; read the actual sample rate and set the band from Nyquist.
  Provisional thresholds are hypotheses until Phase 0A data exists. Never present a
  heuristic as a lab result.
- Categorical report plus measured dB. No 0–100 headline score.
- One linear flow with inline guidance and visible skips. No Guide me / Quick test toggle.
- English first. All user-facing strings go through `Localizable.xcstrings`.
- Dark-only v1; one accent; tertiary text `#8E8E93`.
- PiP uses a bundled looping MP4 with `AVQueuePlayer` + `AVPlayerLooper`; no Live Activity,
  no 165 Hz tone in the MVP.
- No private `App-Prefs:` promise. Show the manual Settings path and the PiP video.
- Phase 0A PWA is a hard gate for the native MVP; native remains the craft build. The PWA
  must show `sampleRate`/`label` and include the scratch check, or it is `Unverified`.

## Ways of working

- The owner is a non-developer, remote, often on a phone. Plain language, one clear
  recommendation, no jargon.
- Every link handed over is a public HTTPS link, a GitHub link, or a tailnet HTTPS URL.
  Never `127.0.0.1` or `localhost`.
- Ask before new ports, system packages, paid services/accounts, or anything outward-facing.
  The app has no server port; build artifacts live under `/srv/data/airpods-doctor/`.
- Privacy: microphone audio is sensitive. Process it in memory, never upload, persist or
  log it. No third-party analytics or CDN assets.
- Never print, log or commit secrets, the private deploy key, `.env`, or Apple credentials.
  The unsigned build never holds an Apple ID.
- Public-repo safety: no personal emails, UDIDs, tailnet hosts or Apple ID emails in docs,
  workflow logs or commit metadata. The deploy key is scoped to this one repo.
- Use `impeccable` v4.8.0 as the design authority, adapted to native iOS. Follow
  `DESIGN.md`, `docs/UX.md`, `docs/COPY.md` and `docs/DESIGN_REVIEW.md`.
- Automate the high-value path first: build, tests, Simulator screenshots, accessibility
  audit, IPA release. Do not spend early cycles on regex lint scripts before the audio
  engine works.

## Definition of done

- XcodeGen generates the project; `xcodebuild test` and the unsigned device build pass;
  say exactly what was run.
- Simulator screenshots at iPhone 16 Pro and a small iPhone, dark mode and large Dynamic
  Type; `performAccessibilityAudit` passes or exceptions are documented.
- No 0–100 headline score; no fabricated or “Not tested” data.
- Copy, token and contrast checks pass once those scripts exist; no banned copy or raw
  colors in views.
- The IPA builds on GitHub Actions and installs through SideStore.
- `docs/STATUS.md`, `CHANGELOG.md` and `VERSION` are updated at every phase.
- README updated when run commands, ports or data paths change.
- No secret, key, audio recording or personal identifier committed.

## Never

- Claim a diagnostic result the app did not measure.
- Present a category as a medical diagnosis, a lab result, or a guaranteed repair.
- Use a 0–100 score as the headline.
- Promise one-tap Bluetooth settings via `App-Prefs:`.
- Add Live Activities or a widget extension in v1.
- Play a 165 Hz tone while the AirPods are in the ears.
- Use ethanol on the AirPods mesh, compressed air, vacuum tricks, Blu-Tack, or sharp tools.
- Expose beyond the approved route (no `0.0.0.0`, tunnels or funnel).
- Store microphone recordings or personal device identifiers.
- Push to the App Store or use the paid account without the owner’s explicit approval.
