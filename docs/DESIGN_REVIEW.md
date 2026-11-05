# Design review — SonicCare Pro

Use this checklist before calling a phase done. Evidence first; opinions second.

## Authority

- `impeccable` v4.8.0 is the design authority. Native iOS guidance applies; the web-only
  detector does not.
- `DESIGN.md` owns the visual system; `docs/UX.md` owns flow and skip rules;
  `docs/COPY.md` owns voice and banned patterns.
- `minimalist-ui` is not used: its warm monochrome editorial world conflicts with the dark
  tactile brief. `web-ux` is web-only; its anti-slop and state gates are used as a
  checklist, not as a browser test.

## The iOS slop test

Ask: would a fluent iPhone user trust this app, or pause at off-spec controls?

- [ ] System navigation: `NavigationStack`, edge-swipe back, large title only at the top.
- [ ] No custom global nav, no tab bar for a single flow, no reinvented back gesture.
- [ ] Native controls for settings, pickers, toggles, sheets and alerts.
- [ ] SF Symbols only; no emoji or web icon set.
- [ ] 44×44 pt targets with breathing room.
- [ ] Safe areas respected; nothing under the Dynamic Island or home indicator.
- [ ] Dynamic Type; no truncated primary action; 11 pt floor.
- [ ] Dark mode and increased contrast checked; no color-only status.
- [ ] Reduce Motion: crossfade instead of parallax or large slides.
- [ ] One accent; no hand-rolled glassmorphism; no rainbow of state colors.

## Visual contract

- [ ] The screen reads as a precision instrument, not a SaaS dashboard.
- [ ] One primary action; secondary actions are text links.
- [ ] Spacing on the 8 pt grid; consistent card padding and section gaps.
- [ ] Type hierarchy uses the tokens; measurements are monospaced.
- [ ] Hairlines and top-edge highlights are subtle; no heavy shadows.
- [ ] No banned pattern from `DESIGN.md`: gradients, glass, emoji icons, giant pills,
      fake charts, confetti, shimmer, stock AI art.
- [ ] The AirPods hero and the four-zone diagram are custom vectors, not clip art.
- [ ] Empty, loading, error and permission states exist and teach the next step.

## UX contract

- [ ] The user always knows: what this is, what to do, what happens next.
- [ ] Guide me is the default; Quick test is available and remembered.
- [ ] Every optional step has a visible skip; critical skips state the loss once.
- [ ] Skipped data shows `Not tested`; no fabricated values.
- [ ] The flow resumes after Settings, a call or a relaunch.
- [ ] No dead ends; every error has one next action.
- [ ] The report separates measured from not measured and gives one next step.
- [ ] No modal tour; tips are inline and dismissible.

## Copy contract

- [ ] English only in v1; strings in `Localizable.xcstrings`.
- [ ] No banned words from `docs/COPY.md`; no exclamation marks; no "Oops".
- [ ] Errors say what happened and what to do.
- [ ] No medical claim, no fake precision, no guaranteed repair.
- [ ] Pseudo-localization at +30% does not truncate the primary action.

## Evidence

- [ ] Simulator screenshots at iPhone 16 Pro and a small iPhone.
- [ ] Dark mode and large Dynamic Type captured.
- [ ] `performAccessibilityAudit` passes or the exceptions are documented.
- [ ] `scripts/check-copy.sh`, `scripts/check-tokens.sh`, `scripts/check-contrast.sh`
      pass.
- [ ] Hardware-only checks (mic, PiP, haptics, Bluetooth) reported separately from the
      Simulator evidence; never claim a hardware pass from a Simulator.

## Review cadence

- One batch of screenshots and findings per phase.
- Fix everything the batch shows in one pass.
- Confirm with at most one more round, then stop. Do not polish endlessly.

## Current state

Phase 0 has not produced UI yet. The first design review happens after the three-screen
design proof is built and captured in the Simulator.
