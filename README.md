# airpods-doctor — SonicCare Pro

A native iOS app that checks the left and right AirPods Pro (2nd generation) microphones,
shows whether one or both sides are muffled in the high frequencies, and gives one safe
next step: clean and retest, or seek service. English first; Swedish later. The app never
claims a measurement it did not make.

Status: **Phase 0A — PWA built; native proof next.** Plan revision `0.1.0-dev.3`. The
product, design, UX, copy, review response and phase plan are in place. The PWA is in
`web/`; native app code has not started.

## Route

- **Native SwiftUI**, iOS 17+, one app target + one test target.
- **Build:** XcodeGen + native `xcodebuild` on GitHub Actions macOS. No `xtool`.
- **Distribution:** unsigned IPA; SideStore signs and installs it with a free Apple ID.
  No TestFlight, no paid developer account.
- **7-day refresh** with SideStore. Limits: 3 apps per device including SideStore, 10 App
  IDs per week. Baseline export/import is part of the app.
- **PWA validation:** a small `web/` app on GitHub Pages tests the SVR method, gives a
  no-expiry fallback, and is a hard gate for the native MVP.
- **English first.** Swedish is a later localization.
- **No server port.** The app runs on the iPhone; build artifacts live under
  `/srv/data/airpods-doctor/` if a local host is needed.

## Live validation build

**https://voccov.github.io/soniccare-pro/**

Open it in Safari on the iPhone, then **Share → Add to Home Screen** for a full-screen
app. It is the Phase 0A PWA: no SideStore, no expiry. The native app is Phase 0B.

## Docs

- [Product](PRODUCT.md) — users, purpose, constraints, principles.
- [Design](DESIGN.md) — the visual world, tokens, motion, anti-slop contract.
- [Plan](docs/PLAN.md) — phases, acceptance criteria, automation, versioning.
- [Review response](docs/REVIEW_RESPONSE.md) — what changed after the independent critique.
- [Review packet](docs/PLAN_FOR_REVIEW.md) — the full revision-2 plan and reviewer questions.
- [Status](docs/STATUS.md) — current phase, next actions, blockers.
- [UX](docs/UX.md) — flow, guidance, skip rules, states.
- [Copy](docs/COPY.md) — voice, banned patterns, screen copy.
- [Setup](docs/SETUP.md) — GitHub and SideStore steps, with links.
- [Decisions](docs/DECISIONS.md) — durable architecture and product choices.
- [Design review](docs/DESIGN_REVIEW.md) — the native iOS quality gate.

## How to run it

The PWA is in `web/`. Phase 0B adds `project.yml`, the XcodeGen project and the GitHub
Actions workflow. The native app is installed through SideStore, not a local dev server.

## Facts

- Data path: `/srv/data/airpods-doctor/` for build artifacts and toolchain only. App data
  stays on the iPhone.
- Secrets: none on the build server. The unsigned build never holds an Apple ID.
- No public exposure: no ports, no Tailscale Serve, no tunnel.
- Agent rules: `AGENTS.md` in this folder, the standalone project authority.
