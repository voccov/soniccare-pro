# Phase 1 UX/UI blueprint

An interactive web blueprint for the planned guided flow. This is a design artifact, not
the app. All values are example data.

**Open:** <https://voccov.github.io/soniccare-pro/blueprint/>

## What to test

- **Graphite / Porcelain.** Graphite is the product direction. Porcelain is a warm light
  exploration of the same system.
- **System / Full / Reduced motion.** The default follows the system; the override is for
  testing.
- **Happy path / Wrong route / Low signal.** The two error states show the recovery copy
  and the disabled Continue.
- **Play walkthrough (36 s).** The automated run covers every step. The recording is
  `walkthrough.mp4`.
- **Film mode.** Add `?film=1` to hide the Studio controls, hide the walkthrough banner
  and auto-play the walkthrough. Reload to replay; record the screen.

## Decisions the blueprint makes visible

- Both earbuds stay in. One microphone measures at a time; the inactive ear card says
  **Next**.
- The Settings path is inline and verified with the fingernail scratch. No PiP in the MVP.
- Fit, seal, quiet room and volume are confirmations. The app cannot sense them.
- The measurement is simulated. No microphone is requested and nothing is measured.
- The result leads with a categorical verdict, then the dB values, confidence and what
  was not measured.
- The level ring and the spectrum are the only continuous motion. Other motion explains a
  state change.
- The app cannot set or read system volume, in-ear status, firmware, serial or battery.

## Built with

- Plain HTML, CSS, SVG, Canvas and the Web Animations API. No runtime dependencies.
- Headless Chromium and system `ffmpeg` for the walkthrough recording.
- Impeccable review and detector; checked at 1440×900 and 390×844 with no overflow and no
  console errors.

## Upgrade paths

- **Rive** for stateful vector transitions if the earbud/ear illustration needs richer
  authored animation.
- **GSAP** for complex timelines; **Remotion** or **Hyperframes** for a polished product
  film.
- The code-native build stays the source of truth for the flow; the native SwiftUI build
  reuses the same interaction model.
