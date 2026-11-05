# AGENTS.md — airpods-doctor

Project rules. They add to `/srv/dev/AGENTS.md`; nothing here relaxes it.

## What this is

A native SwiftUI iOS app for AirPods Pro (2nd generation): a guided left/right microphone
check, a plain-language report, and a safe cleaning guide. English first; Swedish is a
later locale. Owner-facing and mobile-first.

Status: Phase 0 — proof. The plan is approved; do not scaffold beyond the Phase 0 spike
until its go/no-go review passes.

## Settled decisions

- Native iOS, not a web app: AVAudioSession `.measurement`, AVAudioEngine, vDSP,
  CoreHaptics, background audio and PiP.
- Free distribution: unsigned IPA built on GitHub Actions macOS; SideStore signs and
  installs with a free Apple ID. No TestFlight and no paid developer account.
- The app cannot toggle the AirPods Left/Right microphone setting. The user changes it in
  Settings; the app guides and verifies with a stem tap.
- Firmware, serial and battery are not available through public APIs. Never claim them.
- Relative measurement only. HFP is a speech link; 3–6.5 kHz, with a sample-rate and
  confidence check. Never present a heuristic as a lab result.
- English first. All user-facing strings go through `Localizable.xcstrings`.
- Dark-only v1; one accent; Apple-calm structure with tactile instrument detail.

## Ways of working

- The owner is a non-developer, remote over Tailscale, often on a phone. Plain language,
  one clear recommendation, no jargon.
- Every link handed over is a public HTTPS link, a GitHub link, or a tailnet HTTPS URL.
  Never `127.0.0.1` or `localhost`.
- Ask before new ports, system packages, paid services/accounts, or anything outward-facing.
  The app has no server port; build artifacts live under `/srv/data/airpods-doctor/`.
- Privacy: microphone audio is sensitive. Process it in memory, never upload, persist or
  log it. No third-party analytics or CDN assets.
- Never print, log or commit secrets, the private deploy key, `.env`, or Apple credentials.
  The unsigned build never holds an Apple ID.
- Use `impeccable` v4.8.0 as the design authority, adapted to native iOS. Follow
  `DESIGN.md`, `docs/UX.md`, `docs/COPY.md` and `docs/DESIGN_REVIEW.md`.
- Automation first: tests, Simulator screenshots, accessibility audit, copy/token/contrast
  checks, IPA build and release source.

## Definition of done

- The project's tests, lint/format and build pass; say exactly what was run.
- Simulator screenshots at iPhone 16 Pro and a small iPhone, dark mode and large Dynamic
  Type; `performAccessibilityAudit` passes or exceptions are documented.
- Copy, token and contrast checks pass; no banned copy or raw colors in views.
- The IPA builds on GitHub Actions and installs through SideStore.
- `docs/STATUS.md`, `CHANGELOG.md` and `VERSION` are updated at every phase.
- README updated when run commands, ports or data paths change.
- No secret, key, audio recording or personal data committed.

## Never

- Claim a diagnostic result the app did not measure.
- Present the score as a lab result, a medical diagnosis, or a guaranteed repair.
- Use ethanol on the AirPods mesh, compressed air, vacuum tricks, Blu-Tack, or sharp tools.
- Play the 165 Hz tone while the AirPods are in the ears.
- Expose beyond the approved route (no `0.0.0.0`, tunnels or funnel).
- Store microphone recordings or personal device identifiers.
- Push to the App Store or use the paid account without the owner's explicit approval.
