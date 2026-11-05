# Decisions — SonicCare Pro

Short architecture and product decisions. Add a new entry when a durable choice changes;
do not rewrite history.

## ADR-001 — Native SwiftUI, with a PWA validation track

**Status:** accepted, revised 2026-11-05.

Native iOS is the craft product: programmatic `bluetoothHFP` route verification,
CoreHaptics, a reliable native audio session and PiP, and the first-party feel the owner
asked for. It is not magic: it cannot toggle the Left/Right microphone, read
firmware/serial/battery, or widen Bluetooth HFP.

A modern PWA can do more than the first plan admitted: raw-ish `getUserMedia`, Web Audio
FFT, and HTML5 video PiP. A PWA validation build is therefore part of the project, not a
replacement. Phase 0A is a hard gate for the native MVP; native remains the craft build.

## ADR-002 — Free distribution: unsigned IPA + SideStore

**Status:** accepted, revised 2026-11-05.

TestFlight requires the $99/year Apple Developer Program. The free route is an unsigned
IPA built on GitHub Actions macOS, signed and installed on-device by SideStore with a free
Apple ID. The 7-day expiry is accepted.

Because this is an occasional-use utility, the app adds baseline export/import, a signing
expiry warning, and a PWA fallback. The server never holds Apple credentials.

## ADR-003 — GitHub public repo + Actions + Pages

**Status:** accepted and live, 2026-11-05.

A public repo makes the free build and hosting path simple: GitHub Actions macOS builds
the IPA, a release hosts it, and Pages hosts the SideStore source and the PWA. No server
port, no token, no Tailscale service.

**Consequence:** app source and IPA are public; no personal data or secrets. A private
repo requires a token and a server-hosted IPA instead.

## ADR-004 — English first, Swedish later

**Status:** accepted, 2026-11-05.

The owner changed the original Swedish-first PRD to English first. All strings go through
`Localizable.xcstrings`, so Swedish is a later locale, not a rewrite. Pseudo-localization
is deferred until a second locale exists.

## ADR-005 — Dark-only v1, one accent

**Status:** accepted, revised 2026-11-05.

The brief pins a dark tactile instrument. v1 uses one dark theme, with increased-contrast
and Dynamic Type support. A light theme is a later option.

Tertiary text is `#8E8E93` (5.64:1 on `#131419`). The earlier `#6E6E76` was 3.64:1 and
failed WCAG AA for small text.

## ADR-006 — One linear flow with skip

**Status:** accepted, revised 2026-11-05.

One flow with concise instructions, inline “Why” disclosures and a visible skip on every
optional step. No Guide me / Quick test mode toggle: it adds state without helping. The
report shows `Not tested` for skipped work and never fabricates data.

## ADR-007 — Relative, per-ear SVR; categorical verdict

**Status:** accepted, revised 2026-11-05.

Bluetooth HFP is a speech link; absolute calibration is not possible. The app computes
**cross-phase, band-integrated SVR** per ear:

```
LF_dB = 10 log10( Σ_{150}^{800}   |X_A(f)|² )   # Phase A, “Ahhh”
HF_dB = 10 log10( Σ_{3000}^{6500} |X_B(f)|² )   # Phase B, “Ssss”
SVR_dB = HF_dB - LF_dB
```

It compares left vs right and checks each ear against a conservative range or baseline.
It flags `Both high-frequency loss` when both ears have low SVR, even if they match each
other. Same FFT size, window and normalization for both phases; no mean-per-bin values.

The input sample rate is read at runtime: 8 kHz uses 2–3.5 kHz with low confidence, 16/24
kHz use 3–6.5 kHz, and the app never assumes a fixed ceiling.

The starting thresholds (healthy −6 to +4 dB, unilateral delta ≥6 dB, bilateral both
< −10 dB, severe < −18 dB) are provisional. Phase 0A data sets the final values. The
report uses categories plus measured dB. No 0–100 headline score.

## ADR-008 — Apple cleaning method; no 165 Hz or Live Activity in v1

**Status:** accepted, revised 2026-11-05.

The mesh guide follows Apple Support's official method: micellar water, a soft children's
toothbrush, blotting, distilled-water rinse, and two hours of drying. No ethanol on the
mesh, no compressed air, no vacuum tricks, no Blu-Tack, no sharp tools.

The 165 Hz tone is cut from the MVP: AirPods pause or reroute playback when removed, and a
low-volume tone is not a proven repair. Live Activities are cut: they need a widget
extension and an extra App ID, which conflicts with free-account limits.

## ADR-009 — XcodeGen + native `xcodebuild`, one target

**Status:** accepted, revised 2026-11-05.

On a macOS runner, Xcode is already available. XcodeGen generates a small project from
`project.yml`; native `xcodebuild` builds it; the unsigned `.app` is packaged into an IPA.
`xtool` is not used: it adds an unnecessary bridge for a machine that already has Xcode.

The CI command uses `-derivedDataPath build -destination 'generic/platform=iOS'` and copies
from `build/Build/Products/Release-iphoneos/`. `project.yml` sets
`GENERATE_INFOPLIST_FILE: NO` and an explicit `INFOPLIST_FILE` so background modes and
usage strings survive generation.

The project is one app target + one test target. No three-module SwiftPM split; tests run
on the Simulator with `@testable import`.

## ADR-010 — No App Store in v1; no private Settings URL

**Status:** accepted, revised 2026-11-05.

The personal build does not promise `App-Prefs:` navigation. It is private and unreliable
on modern iOS. The UI shows the manual Settings path and a bundled PiP video; a Control
Center long-press tip may be shown but is not guaranteed.

PiP uses a standard bundled MP4 with `AVQueuePlayer` + `AVPlayerLooper` and
`requiresLinearPlayback = false`, not a live `ImageRenderer`/sample-buffer generator. The
looper avoids the end-of-video PiP collapse. The App Store path remains a later,
cleaned-up option behind a `PERSONAL_BUILD` flag.

## ADR-011 — Impeccable as the design authority

**Status:** accepted, revised 2026-11-05.

`impeccable` v4.8.0 governs design and UX review, adapted to native iOS. The web-only
detector is not used; the native audit, Simulator screenshots and accessibility audit are
the evidence. `minimalist-ui` conflicts with the dark tactile brief; `web-ux` is web-only.

## ADR-012 — Defer premature automation and localization

**Status:** accepted, revised 2026-11-05.

Keep `status.sh` and `check-docs.sh`. Defer the copy/token/contrast lint scripts,
screenshot automation beyond the basic captures, and pseudo-localization until the audio
engine works. The high-value automation is the build, tests, Simulator screenshots,
accessibility audit and release.
