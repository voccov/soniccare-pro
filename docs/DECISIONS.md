# Decisions — SonicCare Pro

Short architecture and product decisions. Add a new entry when a durable choice changes;
do not rewrite history.

## ADR-001 — Native SwiftUI, not a web app

**Status:** accepted, 2026-11-05.

Native iOS is required for `AVAudioSession` `.measurement`, `AVAudioEngine`, vDSP,
CoreHaptics, background audio and PiP. A web page cannot switch the AirPods microphone,
read firmware or serial, or float a guide over Settings. Native also gives the tactile,
first-party feel the owner asked for.

**Consequence:** no browser fallback in v1. The build chain is Xcode-free (`xtool`) and
the app is distributed personally.

## ADR-002 — Free distribution: unsigned IPA + SideStore

**Status:** accepted, 2026-11-05.

TestFlight requires the $99/year Apple Developer Program. The free route is an unsigned
IPA built on GitHub Actions macOS, signed and installed on-device by SideStore with a
free Apple ID. The 7-day expiry is accepted.

**Consequence:** one-time PC + USB setup; 3 apps per device; 10 App IDs per week. The
server never holds Apple credentials.

## ADR-003 — GitHub public repo + Actions + Pages

**Status:** pending owner confirmation, 2026-11-05.

A public repo makes the free build and hosting path simple: GitHub Actions macOS builds
the IPA, a release hosts it, and Pages hosts the SideStore source. No server port, no
token, no Tailscale service.

**Consequence:** app source and IPA are public; no personal data or secrets. A private
repo requires a token and a server-hosted IPA instead.

## ADR-004 — English first, Swedish later

**Status:** accepted, 2026-11-05.

The owner changed the original Swedish-first PRD to English first. All strings go through
`Localizable.xcstrings`, so Swedish is a later locale, not a rewrite.

## ADR-005 — Dark-only v1

**Status:** accepted, 2026-11-05.

The brief pins a dark tactile instrument. v1 uses one dark theme, with increased-contrast
and Dynamic Type support. A light theme is a later option, not a v1 requirement.

## ADR-006 — Guide me default, skippable

**Status:** accepted, 2026-11-05.

The default is step-by-step guidance; Quick test is one tap away and remembered. Every
optional step has a visible skip. Critical skips state the missing data once; the report
shows `Not tested` and never fabricates a result.

## ADR-007 — Relative measurement, 3–6.5 kHz

**Status:** accepted, 2026-11-05.

Bluetooth HFP is a speech link, so absolute calibration is not possible. The app compares
left and right and uses the 3–6.5 kHz band for sibilance; if the input sample rate is too
low, it uses the available band and lowers confidence. The score is a heuristic, not a
lab result.

## ADR-008 — Apple's cleaning method, 165 Hz as comfort

**Status:** accepted, 2026-11-05.

The mesh guide follows Apple Support's official method (micellar water, soft children's
toothbrush, blot, distilled-water rinse, dry two hours). No ethanol on the mesh, no
compressed air, no vacuum tricks, no Blu-Tack. The 165 Hz tone is a clearly labelled
comfort tool, played out of the ears with the mesh down and the volume low; it is not a
repair.

## ADR-009 — Build unsigned, sign on the phone

**Status:** accepted, 2026-11-05.

The build server produces an unsigned IPA and never holds an Apple ID or signing
certificate. SideStore signs on-device. This keeps the server free of Apple credentials
and makes the free route practical.

## ADR-010 — No App Store in v1

**Status:** accepted, 2026-11-05.

The personal build may use `App-Prefs:` and PiP for a floating guide. Those are not
App Store-safe. A `PERSONAL_BUILD` compile flag keeps the door open for a later,
cleaned-up App Store version with the paid account.

## ADR-011 — Impeccable as the design authority

**Status:** accepted, 2026-11-05.

`impeccable` v4.8.0 governs design and UX review, adapted to native iOS. The web-only
detector is not used; the native audit, Simulator screenshots and accessibility audit are
the evidence. `minimalist-ui` conflicts with the dark tactile brief; `web-ux` is web-only.
