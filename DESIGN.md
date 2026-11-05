# Design — SonicCare Pro

The visual authority for the native iOS app. Product truth lives in `PRODUCT.md`;
UX rules live in `docs/UX.md`; copy rules live in `docs/COPY.md`.

## Direction

**A precision instrument that happens to be an iPhone app.** Dark anodized panel,
graphite surfaces, one electric blue accent, fine hairlines, monospaced readouts, and a
soft top-edge highlight. Apple-calm structure, Braun restraint, Teenage Engineering
tactile detail. The measurement is the hero; decoration stays out of its way.

This is an **Operate** surface: familiarity, scanability, and trust outrank expression.
The app should feel native to iOS, not like a website in a phone frame.

## Anti-slop contract

Do not ship any of these:

- Purple/blue gradient washes, glassmorphism, neon glow, or generic "AI" illustrations.
- Emoji as interface icons, giant pill buttons, or cards inside cards inside cards.
- Fake charts, fake testimonials, invented stats, or a dashboard of meaningless metrics.
- Confetti, shimmer, looping sparkles, or motion that does not communicate state.
- "Unlock", "elevate", "seamless", "effortless", "revolutionary", "AI-powered", "smart",
  "game-changing", "dive in", "curated", "empower", "leverage", or "robust" copy.
- Exclamation marks, "Oops!", "Uh-oh!", vague "Something went wrong", or blame.
- More than one accent color, more than one primary button per screen, or a modal as the
  first answer to a layout problem.
- A 0–100 ring or gauge that looks like a lab result over an uncalibrated Bluetooth codec.

If a screen looks like a generic dark SaaS dashboard, it is wrong.

## Color tokens

Implement as semantic `Color` values in `Theme.swift`; never use raw hex in views.

| Token | Value | Use |
|---|---|---|
| `bg` | `#070709` | App background |
| `surface` | `#131419` | Cards and panels |
| `surfaceRaised` | `#1B1C22` | Selected or elevated panels |
| `line` | `#FFFFFF` at 8% | Hairlines and card top edge |
| `textPrimary` | `#F5F5F7` | Headlines and body |
| `textSecondary` | `#A1A1AA` | Supporting copy |
| `textTertiary` | `#8E8E93` | Disabled and micro-labels |
| `accent` | `#0A84FF` | Primary action, selection, focus |
| `success` | `#30D158` | Confirmed, healthy |
| `warning` | `#FF9F0A` | Needs attention |
| `critical` | `#FF453A` | Failed or dangerous |
| `demo` | `#64D2FF` | Demo-mode badge only |

Rules: one accent drives interaction. Green, amber and red are state only. Dark-only v1;
still test increased contrast. Status is never color alone: pair it with an icon and text.
`textTertiary` is `#8E8E93` (5.64:1 on `surface`); the earlier `#6E6E76` was 3.64:1 and
failed WCAG AA for small text.

## Typography

Use Dynamic Type text styles; no hard-coded point sizes in views. SF Pro carries the UI.
SF Pro Rounded is for display and screen titles. SF Mono is for measurements only.

| Role | Style | Notes |
|---|---|---|
| Display | `.largeTitle` rounded, semibold | Start screen only |
| Title | `.title2` rounded, semibold | Screen titles |
| Headline | `.headline` | Card titles, step names |
| Body | `.body` | Explanations, max 2–3 lines |
| Label | `.subheadline` medium | Controls and labels |
| Micro | `.caption2` semibold, tracking 0.08 | Instrument labels, uppercase sparingly |
| Metric | `.title` monospaced, semibold | dB, Hz, % |
| Metric small | `.body` monospaced, medium | Inline values |

Numbers use `.monospacedDigit()`. Never use a display face for buttons, labels or data.
Minimum text size is 11 pt; body is 17 pt.

## Spacing and shape

- 8 pt grid; screen margin 20 pt; card padding 20 pt; section gap 24 pt.
- Radii: 12 pt small, 16 pt cards, 20 pt hero panels. Pills only for status badges.
- Hairline 1 px; top-edge highlight `line`; no heavy drop shadows. One soft shadow is
  allowed under the hero card, never on every card.
- Controls sit inside the safe area. No floating controls under the Dynamic Island or
  home indicator.

## Motion

Motion communicates state, never decorates. Respect Reduce Motion.

| Token | Value | Use |
|---|---|---|
| `quick` | 0.18 s ease-out | Press, toggle, small state change |
| `standard` | 0.28 s ease-in-out | Step push, sheet, content swap |
| `expressive` | 0.4 s spring (0.4, 0.8) | Success check, result reveal, hero entrance |
| `reduce` | 0.15 s crossfade | Replacement when Reduce Motion is on |

- Use the system navigation push and sheet transitions. Do not invent a global
  navigation model or disable the edge-swipe back gesture.
- The live level ring and spectrum are the only continuous animations. Everything else
  settles.
- No page-load choreography, no looping shimmer, no confetti.
- Haptics: soft tick on step change, crisp success pattern, warning thud. Optional and
  never the only feedback.

## Components

Build these once and reuse them; variants must share the same vocabulary.

- `StatusPill` — connection and demo state, icon + text.
- `StepHeader` — "Step 2 of 5", title, one-line instruction, progress.
- `PrimaryButton` — one per screen, full-width, 52 pt tall, accent fill.
- `SecondaryLink` — text-only secondary action.
- `InfoDisclosure` — inline "Why this matters" expandable; never a modal tour.
- `MetricReadout` — monospaced number + unit + label.
- `LevelRing` — circular input level with a needle-like arc, not a generic progress ring.
- `SpectrumView` — 16–32 fine bands, drawn with `Canvas`.
- `EarCard` — left/right result with category, measured dB delta and a short verdict.
- `SafetyNote` — amber-bordered note for cleaning or volume warnings.
- `PermissionCard` — mic/route fix with one action.
- `EmptyState` — teaches the next step, never "nothing here".
- `ErrorState` — what happened, why, and one next action.
- `DemoBadge` — unmistakable demo labelling.

Every interactive component needs default, pressed, disabled, loading, success, warning
and error states where applicable.

## Screen rules

- One primary action per screen. Secondary actions are text links, not buttons.
- Use `NavigationStack` for the five-step flow, sheets for focused tasks (safety,
  permission, settings), and a full-screen cover only for the measurement session.
- Large title on the start screen; inline title deeper in the flow.
- No tab bar: this is one guided flow, not five sections.
- The top status pill is persistent but quiet. It never covers content.
- Every screen has a safe exit or a "Skip for now" path, except the active measurement,
  which has Stop.
- Prefer inline guidance and progressive disclosure over modals.
- The report leads with a plain-language verdict, then evidence, then one next step.

## Verification

- Build and run in the iOS Simulator on GitHub Actions macOS.
- Capture every key state at iPhone 16 Pro and a small iPhone, in dark mode and at a
  large Dynamic Type size.
- Run `performAccessibilityAudit`; fix contrast, hit-target and label issues.
- Run the copy, token and contrast checks before calling a phase done.
- Screenshots come from the Simulator, not a browser. Hardware-only behaviour (mic,
  PiP, haptics, Bluetooth) is tested on the owner's iPhone and reported separately.
