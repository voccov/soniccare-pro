# SonicCare Pro — full plan for independent review

**Version:** `0.1.0-dev`  
**Date:** 2026-11-05  
**Status:** Phase 0 — proof. Planning and design records are complete; no app code yet.

## Reviewer prompt

You are reviewing a build plan for a personal native iOS app. The owner is a
non-developer, works remotely over Tailscale, reads on a phone, and wants a polished,
idiot-proof diagnostic tool. Please critique the plan as a principal iOS engineer and
product designer. Be specific and blunt. Focus on:

1. Factual errors, technical impossibilities, or overclaims.
2. The riskiest assumptions and the cheapest way to test them.
3. Whether native iOS is justified, or whether a web/PWA product would be better.
4. Whether the free SideStore route is sensible for this owner, versus the $99/year
   TestFlight route.
5. Scope: what should be cut from the first release, and what is over-engineered.
6. UX and visual-design concerns, especially for a first-time, non-technical user.
7. Security, privacy, legal, and maintenance red flags.

Do not rewrite the plan. Give a prioritized critique and concrete alternatives.

---

## 1. Executive summary

SonicCare Pro is a personal iPhone app for AirPods Pro (2nd generation). It guides the
owner through a left/right microphone check, shows whether one side is muffled in the
high frequencies, and gives one safe next step: clean and retest, or stop and seek
service.

The product has five steps:

1. Connection and readiness.
2. Guided Left/Right microphone setup, with a floating Picture-in-Picture guide and a
   stem-tap verification.
3. A two-phase voice test per ear: a low-mid vowel and a high-frequency sibilant.
4. A report with a relative clarity score, a spectral difference chart, and an honest
   split between what was measured and what was not.
5. A four-zone cleaning guide, a 165 Hz comfort tone, and a before/after comparison.

The build route is deliberately unusual because the owner has no Mac and does not want a
paid Apple Developer account:

- Code is SwiftUI + SwiftPM, built with `xtool` on a **free GitHub Actions macOS runner**.
- The build produces an **unsigned IPA**.
- **SideStore** signs and installs it on the iPhone with a **free Apple ID**.
- The app expires every 7 days and is refreshed by SideStore.
- No TestFlight, no App Store, no server port, no Apple credentials on the build server.

The plan is phased: prove the riskiest chain first (build → install → microphone → PiP),
then build the diagnostic MVP, then polish, then automate the release loop.

The biggest risks are the free signing route, the limits of Bluetooth HFP audio, the
reliability of PiP, and the scope of the first release.

---

## 2. Context and constraints

### The owner

- Non-developer, remote over Tailscale, often reading on a phone.
- Has AirPods Pro (2nd generation) and an iPhone.
- Has a GitHub account, but no Mac and no paid Apple Developer account.
- Wants a native app that feels like a first-party Apple utility, with a dark tactile
  instrument aesthetic.
- Wants step-by-step guidance that is idiot-proof but skippable, with smooth motion and
  no “AI slop” design or copy.
- Wants as much automation as possible.
- Is willing to accept a 7-day signing expiry.

### The build server

- Ubuntu 24.04 VM, 6 vCPUs, 19 GB RAM, ~589 GB free on `/srv`.
- No Swift, no Xcode, no iOS SDK, no GitHub CLI.
- The project lives in `/srv/dev/projects/airpods-doctor`.
- Build artifacts would live in `/srv/data/airpods-doctor` if a local host is ever needed.
- No server port is part of the chosen route.

### The hard product constraints

- iOS cannot let a third-party app toggle the AirPods Left/Right microphone setting. The
  user must do it in Settings. The app can guide and verify with a stem tap.
- Bluetooth HFP is a speech link, not a studio path. It is band-limited and processed.
  Absolute calibration is not possible. The app can compare left vs right and before vs
  after, but cannot claim a lab-grade absolute measurement.
- Firmware, serial and battery are not available through public APIs. The app must not
  claim them.
- Audio is sensitive. It is processed in memory on the phone; no uploads, accounts,
  analytics, or persisted recordings.
- The app is a personal build, not a medical device and not an App Store product.

---

## 3. What the app does

### Step 1 — Connection and readiness

- Shows whether the audio route is AirPods HFP, the iPhone microphone, or demo mode.
- Checks microphone permission, route, sample rate and a quiet-room confirmation.
- Warns if iOS Control Center “Mic Mode” is not Standard.
- Provides a clearly labelled demo mode so every screen can be tested without AirPods.

### Step 2 — Left/Right setup

- Shows the exact Settings path: Bluetooth → AirPods → (i) → Microphone → Always Left.
- Offers a one-tap Settings link. A private `App-Prefs:` URL is attempted first, with a
  public `UIApplication.openSettingsURLString` fallback.
- Starts a floating PiP guide with the three steps, intended to stay visible over the
  Settings app.
- On return, the user confirms which side was selected. A two-second stem tap is detected
  with an adaptive RMS transient threshold; success is confirmed with a haptic.
- If the side check is skipped, the report says the comparison is unverified.

### Step 3 — Voice test

For each ear, two three-second phases:

- **Low-mid:** say a steady “Ahh”; measure 150–800 Hz.
- **High-frequency:** say a steady “Ssss”; measure 3–6.5 kHz, or the highest available
  band if the HFP input is narrowband.

The app shows a live level ring and a 16–32 band spectrum. It detects silence and asks
for a retry. It never invents a value for a skipped phase.

### Step 4 — Report

- Plain-language verdict: similar, muffled, critical, or not enough data.
- A relative clarity score (proposed 0–100) with a confidence label.
- A left/right spectral difference chart, with the muffled band annotated by the measured
  dB difference.
- “What we measured” versus “What we didn’t measure.”
- One next step: clean and retest, retest, or seek service.

### Step 5 — Recovery

- Four explanatory zones: stem ring, speaker mesh, outer ANC mesh, inner pressure/mic
  port.
- Apple’s official cleaning method for the Pro 2 meshes: micellar water with PEG-6
  Caprylic/Capric Glycerides, a soft children’s toothbrush, blotting, distilled-water
  rinse, and two hours of drying.
- Explicit bans: no ethanol on the mesh, no compressed air, no vacuum tricks, no Blu-Tack,
  no sharp tools, no liquids in openings.
- A 165 Hz comfort tone, played with the buds out of the ears and mesh-down, at low volume,
  for a short cycle. It is labelled as a comfort tool, not a proven repair.
- A before/after comparison against the saved baseline.

---

## 4. Why the plan looks like it does

### 4.1 Why native iOS instead of a web app

The core experience needs:

- `AVAudioSession` `.playAndRecord` + `.measurement` and explicit route control.
- `AVAudioEngine` plus Accelerate/vDSP for low-latency analysis.
- CoreHaptics for tactile confirmation.
- Background audio and Picture in Picture for the Settings guide.
- A native-feeling, first-party-quality interface.

A web app can play tones and use the microphone, but it cannot control the audio session
with the same fidelity, cannot float a PiP guide over Settings, and has no haptics. It also
cannot switch the Left/Right microphone either.

Crucially, native does **not** unlock the things people often assume:

- It cannot toggle the Left/Right microphone setting.
- It cannot read firmware, serial or battery through public APIs.
- It cannot widen Bluetooth HFP or make the measurement lab-grade.

So native is justified by the experience and audio control, not by magic access. If the
core diagnostic were the only goal, a web app would be viable; the floating guide, haptics
and native feel are what tip the decision.

### 4.2 Why the free SideStore route instead of TestFlight

TestFlight is not free for the developer. It requires the $99/year Apple Developer Program.
The owner explicitly chose the free route and accepted 7-day expiry.

The free route:

- Builds an **unsigned IPA** on GitHub Actions macOS.
- Installs SideStore once through `iloader` on a PC with a USB cable.
- SideStore signs the IPA on the phone with a free Apple ID and refreshes it before the
  7-day profile expires.
- Keeps Apple credentials off the build server entirely.

The costs are real: one-time PC + USB setup, 3 apps per device including SideStore, 10 App
IDs per week, 7-day refresh, and dependence on community tools and Apple’s sign-in
changes. The alternative is $99/year for TestFlight, which removes the expiry and the
SideStore setup but adds a paid account and App Store Connect.

### 4.3 Why GitHub Actions macOS instead of local `xtool` on Ubuntu

There are two ways to build an unsigned IPA without a Mac:

- **Local `xtool` on Ubuntu:** possible, but needs a multi-GB Xcode `.xip`, an extracted
  iOS SDK, a matching Swift toolchain, and an experimental community toolchain. No iOS
  Simulator.
- **GitHub Actions macOS:** a real Xcode installation, a real iOS Simulator, free macOS
  minutes on a public repository, and an artifact/release pipeline. `xtool` still does the
  SwiftPM-to-IPA build, but on macOS where the SDK is native.

The plan chooses GitHub Actions because it is more reliable, gives us Simulator
screenshots and accessibility audits, and avoids putting a 4 GB Xcode download on the
server. The trade-off is a public repo and code/IPA visibility. A private repo would need
a token and a server-hosted IPA, adding complexity.

### 4.4 Why English first

The owner changed the original Swedish-first brief to English first. The app is
localization-ready: all strings live in `Localizable.xcstrings`, so Swedish can be added
later without touching views. The plan tests pseudo-localization at +30% expansion.

### 4.5 Why this design direction

The owner asked for a “billion-dollar” first-party Apple utility with a dark tactile
Braun/Teenage Engineering instrument feel, and explicitly asked for anti-AI-slop design.
The plan therefore commits to:

- A precision-instrument world, not a generic dark SaaS dashboard.
- One electric-blue accent, graphite surfaces, fine hairlines, monospaced measurements.
- Native iOS structure: `NavigationStack`, system sheets, SF Symbols, safe areas, 44 pt
  targets, Dynamic Type, Reduce Motion.
- One primary action per screen; progressive disclosure; no modal tour.
- A written anti-slop contract and copy bans.

`impeccable` v4.8.0 is the design authority. `minimalist-ui` was rejected because its warm
monochrome editorial world conflicts with the dark instrument brief. `web-ux` is web-only
and not used for the native app; its state and anti-slop gates are a checklist only.

### 4.6 Why the guidance model is “Guide me + Quick test + skip”

The owner wants an idiot-proof flow that does not feel like a tutorial. The default is
**Guide me**: one-line instructions, an inline “Why” disclosure, and a clear next action.
**Quick test** is one tap away for a returning user. The choice is remembered.

Every optional step has a visible skip. Critical skips state exactly what will be missing
once, then the report shows `Not tested`. The app never fills gaps with guesses. This is
the balance between hand-holding and getting out of the way.

### 4.7 Why the measurement is relative and band-limited

Bluetooth HFP uses a speech codec. Wideband mSBC can reach roughly 7 kHz; narrowband CVSD
is far lower. The link is lossy and processed, and `.measurement` may not disable every
Bluetooth-side process. The app cannot produce a calibrated SPL or a lab-grade frequency
response.

The plan therefore:

- Compares left vs right and before vs after, not against an absolute reference.
- Uses 3–6.5 kHz for sibilance; if the actual sample rate is 8 kHz, it falls back to the
  highest available band and lowers confidence.
- Shows a confidence label and a “what we didn’t measure” section.
- Treats the 0–100 score as a heuristic, not a medical or lab result.

The proposed score thresholds (85–100 optimal, 35–84 damped, below 35 critical) are
product heuristics. They need validation against real captures; the plan does not pretend
they are clinically derived.

### 4.8 Why the cleaning guidance is conservative

Apple’s official method for the Pro 2 meshes is micellar water and a soft children’s
toothbrush, followed by a distilled-water rinse and two hours of drying. The plan follows
that method and explicitly rejects ethanol on the mesh, compressed air, vacuum tricks,
Blu-Tack and sharp tools.

The PRD’s “soap film” hypothesis may be only one cause of a muffled mesh; earwax, moisture
and damage are also plausible. The report says “blocked or damped,” not “soap film.” The
165 Hz tone is a comfort tool, not a promised repair, and is never played while the buds
are in the ears.

### 4.9 Why the automation looks like this

The owner asked to automate as much as possible. The plan automates the build, tests,
Simulator screenshots, accessibility audit, copy/token/contrast checks, IPA release and
SideStore source. The only manual parts are the one-time GitHub connection, the one-time
SideStore setup, the voice test itself, and the owner’s final confirmation.

---

## 5. Architecture

### Source layout

```
airpods-doctor/
  Package.swift
  xtool.yml
  Sources/
    SonicCareCore/        # pure Swift: models, bands, SVR, score, storage
    SonicCareDSP/         # vDSP FFT/RMS adapters, iOS/macOS
    SonicCarePro/         # SwiftUI app
      App/
      Audio/
      Services/
      Views/
      Resources/
  Tests/
    SonicCareCoreTests/
  scripts/
  docs/
```

### Audio

- `RouteMonitor`: observes `AVAudioSession.routeChangeNotification`, checks
  `currentRoute.inputs.first?.portType == .bluetoothHFP`, and publishes route/sample-rate
  state.
- `AcousticAnalyzer`: configures `.playAndRecord`, `.measurement`, `.allowBluetoothHFP`
  (with a fallback), installs an input tap, converts to mono Float32, runs FFT/RMS, and
  publishes level and band data at 30 fps.
- `ToneGenerator`: `AVAudioSourceNode` sine playback for routing checks.
- `WaterEjectGenerator`: 165 Hz plus subtle harmonics, `.playback`, volume-capped, 20 s.
- `StemTapDetector`: adaptive transient threshold above the noise floor, not a fixed
  -18 dBFS.
- `MockAnalyzer`: deterministic synthetic spectra for demo mode and UI tests.

### Views

- `MainCoordinatorView`: phase state machine and persistent status pill.
- `ConnectionCheckView`, `SideSetupView`, `AcousticTestView`, `DiagnosticReportView`,
  `RecoveryGuideView`.
- Shared components: status pill, step header, primary button, info disclosure, metric
  readout, level ring, spectrum, ear card, safety note, permission card, empty/error
  states, demo badge.

### Services

- `PiPGuideManager`: `AVPictureInPictureController` + `AVSampleBufferDisplayLayer`;
  `ImageRenderer` at 2–5 fps, not 60.
- `Haptics`: CoreHaptics with `UIImpactFeedbackGenerator` fallback.
- `BaselineStore`: local JSON in Application Support; last 10 sessions.
- `SettingsLink`: private `App-Prefs:` attempt with public fallback.
- `SigningStatus`: shows the 7-day expiry and refresh instructions.

### Data

All audio is processed in memory. No recordings, no uploads, no analytics. Results are
stored locally; a re-sign through SideStore must preserve them.

---

## 6. UX flow and skip model

```
Start → Pre-flight → Connection → Side setup → Voice test → Report → Recovery → Done
```

- **Start:** status pill, one headline, one primary action, last result if available.
- **Pre-flight:** microphone permission, AirPods route, quiet room; fix actions.
- **Connection:** route, sample rate, Mic Mode warning, demo toggle.
- **Side setup:** Settings path, PiP guide, stem-tap verification, skip.
- **Voice test:** full-screen measurement, countdown, live level, skip per phase.
- **Report:** verdict, score/confidence, spectral diff, measured vs not measured.
- **Recovery:** four zones, Apple’s method, 165 Hz, before/after, skip.

Skip consequences are explicit: demo results are labelled; a skipped side check removes
the left/right comparison; a skipped phase shows `Not tested`; no score is computed from
incomplete data.

States covered: permission denied, no AirPods, wrong route, low signal, interruption,
expiring signing, no baseline, loading. Every error has one next action. The flow resumes
after Settings, a call or a relaunch.

Accessibility: VoiceOver labels and hints, Dynamic Type, 44×44 pt targets, increased
contrast, Reduce Motion, no color-only status.

---

## 7. Design system and anti-slop

- Background `#070709`; surface `#131419`; raised `#1B1C22`; hairline white 8%.
- Text `#F5F5F7` / `#A1A1AA` / `#6E6E76`; accent `#0A84FF`; success `#30D158`; warning
  `#FF9F0A`; critical `#FF453A`.
- SF Pro Rounded for headings; SF Pro for body; SF Mono for dB/Hz/%.
- 8 pt grid; 20 pt screen margins; 16–20 pt radii; one soft hero shadow.
- Motion: 0.18 s quick, 0.28 s standard, 0.4 s spring for expressive moments; Reduce
  Motion crossfade; the live meter is the only continuous animation.
- Banned: gradients, glassmorphism, emoji icons, giant pills, card-on-card, fake charts,
  confetti, shimmer, stock AI art, hype copy, exclamation marks, “Oops”.

Verification: Simulator screenshots at iPhone 16 Pro and a small iPhone, dark mode and
large Dynamic Type, `performAccessibilityAudit`, copy/token/contrast scripts.

---

## 8. Automation

GitHub Actions macOS:

- `swift test` for the pure core.
- SwiftFormat/SwiftLint.
- `xtool dev build --ipa` for an unsigned IPA.
- Simulator screenshots for every key state.
- `performAccessibilityAudit`.
- Artifact/release upload; tag → release + SideStore source.

Scripts:

- `check-copy.sh`: banned words, exclamation marks, placeholders.
- `check-tokens.sh`: no raw colors/fonts outside `Theme.swift`.
- `check-contrast.sh`: WCAG 4.5:1 body / 3:1 large text.
- `screenshots.sh`: launch arguments per state.
- `release.sh`: version, build, screenshots, release, source.
- `status.sh`: version, phase, git state, next actions.

Bounded review: one batch of screenshots and fixes per phase, at most one confirmation
round. No endless polishing.

---

## 9. Phases and acceptance criteria

### Phase 0 — Proof (`v0.1.0`)

- Connect GitHub and SideStore.
- Scaffold SwiftPM + `xtool` + theme + app shell.
- Spike: mic permission, route, tone, RMS, PiP, haptics, self-test.
- GitHub Actions unsigned IPA + release.
- Install via SideStore; run self-test.
- Design proof: connection, measurement, report screens.
- Simulator screenshots and accessibility audit.
- Go/no-go review.

**Acceptance:** installs and launches; auth/route work; tone plays; RMS moves; PiP starts
or the fallback works; haptics fire; self-test reports pass/fail; refresh keeps data; iOS
version supported.

### Phase 1 — Diagnostic MVP (`v0.2.0`)

- Full audio engine, FFT/SVR, stem tap.
- Five-step flow, Guide me/Quick test, skip/resume.
- Report with score/confidence/spectral diff.
- Recovery with Apple’s method, 165 Hz, before/after.
- English copy, all states, accessibility.
- Unit tests and on-device test.

**Acceptance:** complete check in under five minutes; skipped data marked; no fabricated
results; no crash; copy/contrast checks pass.

### Phase 2 — Copilot and polish (`v0.3.0`)

- PiP guide, auto-start and fallback.
- Settings link with fallback.
- Motion, haptics, vector hero, four-zone diagram.
- Live Activity fallback.
- Screenshot review and final visual fixes.

### Phase 3 — Release loop (`v1.0.0`)

- AltSource and one-tap install/update.
- Signing-expiry banner.
- Release script, README, status/changelog.
- Tag and handover.

---

## 10. Versioning and progress

- `VERSION` uses semver; currently `0.1.0-dev`.
- `CHANGELOG.md` and `docs/STATUS.md` update at every phase.
- Conventional Commits; tags `v0.1.0`, `v0.2.0`, `v0.3.0`, `v1.0.0`.
- The local project has its own git repo and tag `v0.1.0-dev`; the GitHub repo is the
  public mirror.
- The OpenChamber knowledge plan shows the checklist and current blockers.

---

## 11. Risks, unknowns, and what could kill it

1. **Free signing fragility.** SideStore/iloader can break with iOS or Apple sign-in
   changes. Mitigation: spare Apple ID, official tools, Phase 0 test, USB refresh fallback.
2. **iOS compatibility.** The owner’s iOS version is unknown. SideStore support for the
   newest release may lag. Mitigation: check before building; fallback to USB install.
3. **HFP limits.** Narrowband input may make the high band unavailable; AGC may still
   apply. Mitigation: sample-rate check, lower band, confidence label, no lab claims.
4. **PiP reliability.** Auto-start may be blocked or content may not qualify. Mitigation:
   button fallback, Live Activity fallback, test in Phase 0.
5. **Scope.** Five steps, PiP, charts, scoring, baseline, cleaning, animations and
   automation is a lot for a personal app. Mitigation: Phase 0 proof, cut to the core if
   needed.
6. **No hardware simulator.** The Simulator can test layout and accessibility, not mic,
   PiP, haptics or Bluetooth. The owner is the only hardware tester; iteration is slower.
7. **Public repo.** Code and IPA are public. If unacceptable, switch to private + server
   hosting, which adds a token and a service.
8. **Legal/terms.** Personal sideloading with community tools is a gray area; it is not an
   App Store distribution. The app must not be presented as a medical device.
9. **Score validity.** The 0–100 score is a heuristic. It needs real captures; thresholds
   are not clinically derived.
10. **Cleaning safety.** Incorrect cleaning can damage the mesh. The app follows Apple’s
    official method and bans aggressive techniques.
11. **Toolchain limits.** `xtool` may not support every entitlement, background mode or
    Info.plist shape. Phase 0 tests this before the full app.
12. **Data loss.** Deleting the app loses local history; there is no cloud backup.
    Mitigation: export/share later, or keep the last 10 sessions local.

---

## 12. Explicitly out of scope for v1

- App Store distribution, TestFlight, paid developer account.
- Android, web, iPad-specific layouts, Mac app.
- Cloud sync, accounts, analytics, push notifications.
- Automatic Left/Right microphone switching.
- Firmware, serial, battery or hardware-fault detection.
- Medical diagnosis, guaranteed repair, lab calibration.
- 60 fps rendering, a 3D engine, live translation.
- Any server port, tunnel, funnel or public exposure.

---

## 13. Questions for the reviewer

1. Is native iOS justified, given that the app still cannot switch the microphone or
   read firmware/serial? Would you build a web/PWA first instead?
2. Is the free SideStore route worth the fragility for a non-developer, or is the
   $99/year TestFlight route the more responsible recommendation?
3. Is the SVR measurement approach credible enough to ship as a heuristic? What would
   you change to make it more honest and robust?
4. Is the 0–100 score defensible, or should the app use only categorical results
   (similar / muffled / not enough data)?
5. Is PiP as a floating Settings guide reliable on current iOS? What is the best
   fallback?
6. What would you cut from the first release? What is over-engineered?
7. Is the Guide me / Quick test / skip model balanced, or does it still risk being
   annoying or confusing?
8. Is the dark tactile instrument direction appropriate for a diagnostic utility, or
   does it fight legibility and accessibility?
9. Is the build/sign/distribution path secure and maintainable? Any red flags?
10. What are the top three risks, and what would you test first?
11. Are there any factual errors or overclaims in this plan?

---

## 14. Current state and next steps

**Done:** product, design, UX, copy, setup and decision records; local git repo; version
`0.1.0-dev`; tag `v0.1.0-dev`; deploy key generated; design/automation plan.

**Waiting on:** public GitHub repo URL; deploy key added; iPhone iOS version; one-time
SideStore setup on a PC with USB.

**Then:** push the plan, add GitHub Actions, scaffold the Phase 0 spike, build the unsigned
IPA, install through SideStore, run the self-test, and hold the go/no-go review.

## 15. References

- Apple Support — How to clean your AirPods Pro:
  <https://support.apple.com/en-us/120409>
- SideStore — installation:
  <https://docs.sidestore.io/docs/installation/install>
- SideStore — prerequisites:
  <https://docs.sidestore.io/docs/installation/prerequisites>
- iloader: <https://iloader.app>
- xtool: <https://github.com/xtool-org/xtool>
- Apple TestFlight / Developer Program:
  <https://developer.apple.com/programs/>
- Apple Human Interface Guidelines:
  <https://developer.apple.com/design/human-interface-guidelines/>
