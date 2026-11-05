# SonicCare Pro — full plan for independent review (revision 3)

**Version:** `0.1.0-dev.3`  
**Date:** 2026-11-05  
**Status:** Phase 0A/0B — proof. Planning and design records are complete; no app code yet.  
**Supersedes:** `v0.1.0-dev.2` (revision 2).  
**Review disposition:** `docs/REVIEW_RESPONSE.md` (rounds 1 and 2).

## Reviewer prompt

You are reviewing a build plan for a personal native iOS app. The owner is a
non-developer, works remotely over Tailscale, reads on a phone, and wants a polished,
idiot-proof diagnostic tool. This is revision 3, after two independent reviews.
Please critique it as a principal iOS engineer and product designer. Be specific and
blunt. Focus on:

1. Factual errors, technical impossibilities, or overclaims that remain.
2. The riskiest assumptions and the cheapest way to test them.
3. Whether native iOS is justified, or whether the PWA validation track should become
   the product.
4. Whether the free SideStore route is sensible for an occasional-use utility, versus the
   $99/year TestFlight route.
5. Scope: what should be cut from the first release, and what is still over-engineered.
6. UX and visual-design concerns, especially for a first-time, non-technical user.
7. Security, privacy, legal, and maintenance red flags.

Do not rewrite the plan. Give a prioritized critique and concrete alternatives.

## What changed in revision 3

After a second independent review:

- **Scratch check is single-channel.** HFP sends one mono stream; the app verifies only
  the target ear. A transient ≥18 dB above the noise floor means `Verified`; silence means
  the other microphone is still active. No simultaneous opposite-ear comparison.
- **SVR is cross-phase and band-integrated.** `LF` comes from Phase A (“Ahhh”, 150–800 Hz);
  `HF` comes from Phase B (“Ssss”, 3–6.5 kHz). Use integrated power, not mean per bin.
- **`xcodebuild` path fixed.** `-derivedDataPath build -destination 'generic/platform=iOS'`;
  copy from `build/Build/Products/Release-iphoneos/`.
- **PiP loops with `AVQueuePlayer` + `AVPlayerLooper`**; `requiresLinearPlayback = false`.
- **PWA diagnostics:** show `sampleRate` and `label`; include the scratch check; Phase 0A
  is a hard gate for the native MVP.
- **Provisional thresholds** are recorded as hypotheses, not validated constants.

---

## 1. Executive summary

SonicCare Pro is a personal iPhone app for AirPods Pro (2nd generation). It guides the
owner through a left/right microphone check, shows whether one or both sides are muffled
in the high frequencies, and gives one safe next step: clean and retest, or stop and seek
service.

The product has five steps:

1. Connection and readiness.
2. Guided Left/Right microphone setup, with a floating Picture-in-Picture video guide and
   a fingernail-scratch verification.
3. A two-phase voice test per ear: a low-mid vowel and a high-frequency sibilant.
4. A report with a categorical verdict, per-ear SVR, a spectral difference chart, and an
   honest split between what was measured and what was not.
5. A four-zone cleaning guide, a before/after comparison, and baseline export.

The build route is unusual because the owner has no Mac and does not want a paid Apple
Developer account:

- SwiftUI + XcodeGen + native `xcodebuild` on a **free GitHub Actions macOS runner**.
- The build produces an **unsigned IPA**.
- **SideStore** signs and installs it with a **free Apple ID**.
- The app expires every 7 days and is refreshed by SideStore.
- No TestFlight, no App Store, no server port, no Apple credentials on the build server.

Revision 2 added a PWA validation track. Revision 3 makes it a **hard gate for the native
MVP**: it tests the acoustic method immediately, provides a no-expiry fallback, and decides
whether the native app is worth the SideStore trade-off.

The plan is phased: validate the method and the build/install chain first, then build the
diagnostic MVP, then polish, then automate the release loop.

The biggest risks are the free signing route, HFP bandwidth, PiP reliability, bilateral
threshold validity, and scope.

---

## 2. Context and constraints

### The owner

- Non-developer, remote, often reading on a phone.
- Has AirPods Pro (2nd generation) and an iPhone.
- Has a GitHub account, but no Mac and no paid Apple Developer account.
- Wants a native app that feels like a first-party Apple utility, with a dark tactile
  instrument aesthetic.
- Wants step-by-step guidance that is idiot-proof but skippable, with smooth motion and
  no “AI slop” design or copy.
- Wants as much automation as possible.
- Is willing to accept a 7-day signing expiry, but needs the app to be usable after long
  gaps and to keep baseline history.

### The build server

- Ubuntu 24.04 VM, 6 vCPUs, 19 GB RAM, ~589 GB free on `/srv`.
- No Swift, no Xcode, no iOS SDK, no GitHub CLI.
- The project is now its own workspace and git repo at
  `/srv/dev/projects/airpods-doctor`.
- Build artifacts would live in `/srv/data/airpods-doctor` if a local host is ever needed.
- No server port is part of the chosen route.

### The hard product constraints

- iOS cannot let a third-party app toggle the AirPods Left/Right microphone setting. The
  user must do it in Settings. The app can guide and verify with a fingernail scratch.
- Bluetooth HFP is a speech link, not a studio path. It is band-limited and processed.
  Absolute calibration is not possible. The app can compare left vs right, before vs
  after, and per-ear SVR, but cannot claim a lab-grade absolute measurement.
- Firmware, serial and battery are not available through public APIs. The app must not
  claim them.
- Audio is sensitive. It is processed in memory on the phone; no uploads, accounts,
  analytics, or persisted recordings.
- The app is a personal build, not a medical device and not an App Store product.

---

## 3. What the app does

### Step 1 — Connection and readiness

- Shows whether the audio route is AirPods HFP, the iPhone microphone, or demo mode.
- Checks microphone permission, route, input sample rate and a quiet-room confirmation.
- Warns if iOS Control Center “Mic Mode” is not Standard.
- Provides a clearly labelled demo mode so every screen can be tested without AirPods.

### Step 2 — Left/Right setup

- Shows the exact Settings path: Bluetooth → AirPods → (i) → Microphone → Always Left.
- Does **not** promise a one-tap Bluetooth settings link. `App-Prefs:` is private and
  unreliable on modern iOS; the primary UX is the visual path.
- Offers a floating PiP guide: a bundled 6-second video showing the three Settings taps,
  played through `AVPlayerLayer`.
- On return, the user confirms which side was selected. A one-second **fingernail scratch**
  on the bottom silver ring is detected as a broadband transient above an adaptive noise
  floor. Because HFP sends only the active mono stream, the app verifies the **target
  ear** only: a transient at least 18 dB above the room noise floor means `Verified`;
  silence means iOS is still listening to the other microphone. The app never claims a
  simultaneous opposite-ear comparison. Success is confirmed with a haptic.
- If the side check is skipped, the report says the comparison is unverified.

### Step 3 — Voice test

For each ear, two three-second phases:

- **Low-mid:** say a steady “Ahh”; measure 150–800 Hz.
- **High-frequency:** say a steady “Ssss”; measure 3–6.5 kHz, or the highest available
  band if the HFP input is narrowband.

The app shows a live level ring and a 16–32 band spectrum. It detects silence and asks for
a retry. It never invents a value for a skipped phase. It computes SVR per ear, not only
left vs right.

### Step 4 — Report

- Categorical verdict: `Balanced`, `Left high-frequency loss`, `Right high-frequency
  loss`, `Both high-frequency loss`, `Severely blocked`, or `Not enough data`.
- Measured dB delta and SVR values, with a confidence label.
- A left/right spectral difference chart, with the muffled band annotated by the measured
  dB difference.
- “What we measured” versus “What we didn’t measure.”
- One next step: clean and retest, retest, or seek service.

There is no 0–100 headline score. A number that looks like a lab result would be false
precision over an uncalibrated Bluetooth codec.

### Step 5 — Recovery

- Four explanatory zones: stem ring, speaker mesh, outer ANC mesh, inner pressure/mic
  port.
- Apple’s official cleaning method for the Pro 2 meshes: micellar water with PEG-6
  Caprylic/Capric Glycerides, a soft children’s toothbrush, blotting, distilled-water
  rinse, and two hours of drying.
- Explicit bans: no ethanol on the mesh, no compressed air, no vacuum tricks, no Blu-Tack,
  no sharp tools, no liquids in openings.
- A before/after comparison against the saved baseline, and baseline export/import JSON.
- No 165 Hz tone in the MVP. It is a future experiment only; AirPods pause or reroute
  playback when removed unless Automatic Ear Detection is disabled, and a low-volume tone
  is not a proven repair.

---

## 4. Why the plan looks like it does

### 4.1 Why native iOS instead of a web app

Native still provides things the web cannot reliably provide:

- Programmatic verification that the input port is `bluetoothHFP`, not the iPhone mic.
- CoreHaptics.
- A more reliable native PiP and audio session.
- The native SwiftUI craft the owner asked for.

But the earlier plan overclaimed. Modern iOS Safari can request raw-ish microphone
constraints, Web Audio can compute FFT bands, and HTML5 video PiP can float over Settings.
A PWA can do most of the diagnostic job and never expires. The native app is justified by
route verification, haptics, and craft, not by magic access.

Therefore the plan uses a **PWA validation track**. It is both a real tool and a test of
whether the native app is worth the SideStore trade-off. Phase 0A is a hard gate for the
native MVP.

Crucially, native does **not** unlock:

- toggling the Left/Right microphone setting;
- firmware, serial or battery through public APIs;
- a wider Bluetooth HFP link or a lab-grade measurement.

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
changes. For an occasional-use utility, the app may be expired when the owner needs it.

Mitigations: baseline export/import, a signing-expiry warning, the PWA fallback, and a
documented re-install path. The alternative is $99/year for TestFlight, which removes the
expiry and the SideStore setup but adds a paid account and App Store Connect.

### 4.3 Why GitHub Actions macOS with XcodeGen instead of local `xtool`

There are two ways to build an unsigned IPA without a Mac:

- **Local `xtool` on Ubuntu:** possible, but needs a multi-GB Xcode `.xip`, an extracted
  iOS SDK, a matching Swift toolchain, and an experimental community toolchain. No iOS
  Simulator.
- **GitHub Actions macOS:** a real Xcode installation, a real iOS Simulator, free macOS
  minutes on a public repository, and an artifact/release pipeline.

The plan uses **XcodeGen + native `xcodebuild`** on the macOS runner. `xtool` is a bridge
for machines without Xcode; on a runner that already has Xcode, it adds risk around
`.xcstrings`, asset catalogs, `Info.plist` background modes and test targets. XcodeGen
generates a small project from `project.yml`; `xcodebuild` does the rest.

The trade-off is a public repo and code/IPA visibility. A private repo would need a token
and a server-hosted IPA, adding complexity.

### 4.4 Why English first

The owner changed the original Swedish-first brief to English first. The app is
localization-ready: all strings live in `Localizable.xcstrings`, so Swedish can be added
later without touching views. Pseudo-localization is deferred; it is not worth the build
cycles before the English product exists.

### 4.5 Why this design direction

The owner asked for a “billion-dollar” first-party Apple utility with a dark tactile
Braun/Teenage Engineering instrument feel, and explicitly asked for anti-AI-slop design.
The plan commits to:

- A precision-instrument world, not a generic dark SaaS dashboard.
- One electric-blue accent, graphite surfaces, fine hairlines, monospaced measurements.
- Native iOS structure: `NavigationStack`, system sheets, SF Symbols, safe areas, 44 pt
  targets, Dynamic Type, Reduce Motion.
- One primary action per screen; progressive disclosure; no modal tour.
- A written anti-slop contract and copy bans.

`impeccable` v4.8.0 is the design authority. `minimalist-ui` was rejected because its warm
monochrome editorial world conflicts with the dark instrument brief. `web-ux` is web-only
and not used for the native app; its state and anti-slop gates are a checklist only.

Tertiary text is `#8E8E93`, not `#6E6E76`: the latter measures 3.64:1 on `#131419` and
fails WCAG AA for small text; `#8E8E93` measures 5.64:1.

### 4.6 Why one flow with skip, not “Guide me + Quick test”

The owner wants an idiot-proof flow that does not feel like a tutorial. A separate mode
toggle adds state and decisions without helping. The plan uses **one linear flow**:

- One-line instruction.
- An inline “Why” disclosure where needed.
- A visible `Skip` on every optional step.
- A short confirmation when skipping changes the result.
- The report shows `Not tested` and never fills gaps.

This serves both a first-time user and a returning user without a second mode.

### 4.7 Why the measurement is relative, per-ear and band-limited

Bluetooth HFP uses a speech codec. The input can be 8 kHz CVSD, 16 kHz mSBC, or 24 kHz
AAC-ELD on AirPods. The link is lossy and processed, and `.measurement` may not disable
every Bluetooth-side process. The app cannot produce a calibrated SPL or a lab-grade
frequency response.

The plan therefore:

- Computes **cross-phase, band-integrated SVR** per ear:
  - `LF_dB` from Phase A (“Ahhh”): `10 log10(Σ |X_A(f)|²)` over 150–800 Hz.
  - `HF_dB` from Phase B (“Ssss”): `10 log10(Σ |X_B(f)|²)` over 3–6.5 kHz.
  - `SVR_dB = HF_dB − LF_dB`.
  - Same FFT size, window and normalization for both phases; no mean-per-bin values.
- Compares left vs right **and** checks each ear against a conservative range/baseline.
- Flags `Both high-frequency loss` when both ears have low SVR, even if they match each
  other. This fixes the “both ears equally clogged” blind spot.
- Reads the actual input sample rate and sets the high band from Nyquist:
  - 8 kHz → 2–3.5 kHz, low confidence;
  - 16 kHz → 3–6.5 kHz, medium confidence;
  - 24 kHz → 3–6.5 kHz, medium confidence;
  - 48 kHz demo → 3–6.5 kHz, high confidence in demo only.
- Shows a confidence label and a “what we didn’t measure” section.
- Uses categories and measured dB, not a 0–100 headline score.

Provisional starting thresholds (16/24 kHz HFP, band-integrated power; **not validated**):

| Category | Starting hypothesis |
|---|---|
| Healthy / balanced | SVR within −6 to +4 dB, or L/R SVR delta < 4 dB |
| Unilateral high-frequency loss | One ear’s SVR at least 6 dB lower than the other |
| Both high-frequency loss | L/R SVR within 5 dB **and** both SVR < −10 dB |
| Severely blocked | SVR < −18 dB, or “Ahhh” RMS never exceeds −40 dBFS despite a passing quiet-room/scratch check |

Phase 0A records clean and muffled takes and sets the final thresholds. The app shows
confidence and never calls a low-SVR pair “healthy.”

### 4.8 Why the cleaning guidance is conservative

Apple’s official method for the Pro 2 meshes is micellar water and a soft children’s
toothbrush, followed by a distilled-water rinse and two hours of drying. The plan follows
that method and explicitly rejects ethanol on the mesh, compressed air, vacuum tricks,
Blu-Tack and sharp tools.

The PRD’s “soap film” hypothesis may be only one cause of a muffled mesh; earwax, moisture
and damage are also plausible. The report says “blocked or damped,” not “soap film.”

### 4.9 Why the automation looks like this

The owner asked to automate as much as possible. The plan automates the build, tests,
Simulator screenshots, accessibility audit, IPA release and SideStore source. It does not
spend early cycles on regex lint scripts before the audio engine exists; those checks are
deferred. The only manual parts are the one-time GitHub connection, the one-time SideStore
setup, the voice test, and the owner’s final confirmation.

---

## 5. Architecture

### Source layout

```
airpods-doctor/
  project.yml                 # XcodeGen
  Sources/
    SonicCarePro/
      App/
      Audio/
      Services/
      Views/
      Models/
      Resources/
        Info.plist
        Assets.xcassets
        Localizable.xcstrings
        PiPGuide.mp4
  Tests/
    SonicCareProTests/
  web/                        # Phase 0A PWA validation
  scripts/
  docs/
```

One app target, one test target. No three-module SwiftPM split. The test target uses
`@testable import SonicCarePro` and runs on the iOS Simulator.

### Audio

- `RouteMonitor`: observes `AVAudioSession.routeChangeNotification`, checks
  `currentRoute.inputs.first?.portType == .bluetoothHFP`, and publishes route and
  sample-rate state.
- `AcousticAnalyzer`: configures `.playAndRecord`, `.measurement`,
  `.allowBluetoothHFP` (with a compiler fallback to `.allowBluetooth` for older Xcode),
  installs an input tap, converts to mono Float32, runs FFT/RMS, and publishes level and
  **band-integrated** data at 30 fps.
- `ToneGenerator`: `AVAudioSourceNode` sine playback for routing checks.
- `StemScratchDetector`: adaptive broadband transient above the noise floor; the opposite
  ear should not show the same spike.
- `MockAnalyzer`: deterministic synthetic spectra for demo mode and UI tests.
- No 165 Hz water-eject generator in the MVP.

### Views

- `MainCoordinatorView`: phase state machine and persistent status pill.
- `ConnectionCheckView`, `SideSetupView`, `AcousticTestView`, `DiagnosticReportView`,
  `RecoveryGuideView`.
- Shared components: status pill, step header, primary button, info disclosure, metric
  readout, level ring, spectrum, ear card, safety note, permission card, empty/error
  states, demo badge.

### Services

- `PiPGuideManager`: `AVQueuePlayer` + `AVPlayerLooper` + `AVPlayerLayer` +
  `AVPictureInPictureController` playing `PiPGuide.mp4`; set
  `canStartPictureInPictureAutomaticallyFromInline = true` and
  `requiresLinearPlayback = false`; checklist fallback.
- `Haptics`: CoreHaptics with `UIImpactFeedbackGenerator` fallback.
- `BaselineStore`: local JSON in Application Support; last 10 sessions; export/import via
  the share sheet.
- `SigningStatus`: shows the 7-day expiry and refresh instructions.

### Data

All audio is processed in memory. No recordings, no uploads, no analytics. Results are
stored locally; a re-sign through SideStore must preserve them.

### Build

GitHub Actions `macos-15` or `macos-26`:

1. `brew install xcodegen`
2. `xcodegen generate`
3. `xcodebuild test` on the Simulator
4. `xcodebuild build -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath build CODE_SIGNING_ALLOWED=NO`
5. copy `build/Build/Products/Release-iphoneos/SonicCarePro.app` into `Payload/`
6. zip the IPA and upload the artifact

`project.yml` sets `GENERATE_INFOPLIST_FILE: NO` and an explicit `INFOPLIST_FILE` so the
background-audio mode and microphone usage strings survive generation.

---

## 6. UX flow and skip model

```
Start → Pre-flight → Connection → Side setup → Voice test → Report → Recovery → Done
```

- **Start:** status pill, one headline, one primary action, last result if available.
- **Pre-flight:** microphone permission, AirPods route, quiet room; fix actions.
- **Connection:** route, sample rate, Mic Mode warning, demo toggle.
- **Side setup:** Settings path, PiP video, fingernail scratch, skip.
- **Voice test:** full-screen measurement, countdown, live level, skip per phase.
- **Report:** categorical verdict, confidence, dB delta, spectral diff, measured vs not
  measured.
- **Recovery:** four zones, Apple’s method, before/after, baseline export.

Skip consequences are explicit: demo results are labelled; a skipped side check removes
the left/right comparison; a skipped phase shows `Not tested`; no category is computed from
incomplete data.

States covered: permission denied, no AirPods, wrong route, low signal, interruption,
expiring signing, no baseline, loading. Every error has one next action. The flow resumes
after Settings, a call or a relaunch.

Accessibility: VoiceOver labels and hints, Dynamic Type, 44×44 pt targets, increased
contrast, Reduce Motion, no color-only status.

---

## 7. Design system and anti-slop

- Background `#070709`; surface `#131419`; raised `#1B1C22`; hairline white 8%.
- Text `#F5F5F7` / `#A1A1AA` / `#8E8E93`; accent `#0A84FF`; success `#30D158`; warning
  `#FF9F0A`; critical `#FF453A`.
- SF Pro Rounded for headings; SF Pro for body; SF Mono for dB/Hz/%.
- 8 pt grid; 20 pt screen margins; 16–20 pt radii; one soft hero shadow.
- Motion: 0.18 s quick, 0.28 s standard, 0.4 s spring for expressive moments; Reduce
  Motion crossfade; the live meter is the only continuous animation.
- Banned: gradients, glassmorphism, emoji icons, giant pills, card-on-card, fake charts,
  confetti, shimmer, stock AI art, hype copy, exclamation marks, “Oops”.
- No 0–100 ring. The report uses a categorical verdict and a measured dB strip.

Verification: Simulator screenshots at iPhone 16 Pro and a small iPhone, dark mode and
large Dynamic Type, `performAccessibilityAudit`, copy/token/contrast checks (deferred
until after the MVP if they cost more than they return).

---

## 8. Automation

GitHub Actions macOS:

- `swiftformat`/`swiftlint` only if they are cheap; not a Phase 0 blocker.
- `xcodegen` + `xcodebuild test` on the Simulator.
- `xcodebuild` unsigned device build + IPA packaging.
- Simulator screenshots for key states.
- `performAccessibilityAudit`.
- Artifact/release upload; tag → release + SideStore source.

PWA: GitHub Pages deploy, no server.

Scripts:

- `status.sh` (already): version, phase, git state, next actions.
- `check-docs.sh` (already): semver, changelog entry, local URLs, personal identifiers.
- Deferred: `check-copy.sh`, `check-tokens.sh`, `check-contrast.sh`, `screenshots.sh`.
- Later: `release.sh`.

Bounded review: one batch of screenshots and fixes per phase, at most one confirmation
round. No endless polishing.

---

## 9. Phases and acceptance criteria

### Phase 0A — PWA validation (hard gate for native MVP)

- Plain HTML/CSS/JS `web/` app on GitHub Pages.
- `getUserMedia` with raw-ish constraints, Web Audio FFT, cross-phase integrated SVR,
  per-ear and bilateral categories.
- Show `audioTrack.getSettings().sampleRate` and `audioTrack.label`; include the
  fingernail-scratch check. No spike means Safari is on the iPhone mic; result is
  `Unverified`.
- localStorage, JSON export, no uploads.
- Test on the owner’s AirPods; collect clean and muffled takes.

**Acceptance:** works in Safari; displays route label and sample rate; measures both ears;
categorical result; scratch check distinguishes the AirPods mic; JSON export; no network
calls. If the PWA solves the problem, native becomes an optional craft build.

### Phase 0B — Native proof (`v0.1.0`)

- Connect GitHub and SideStore.
- XcodeGen project + theme + app shell.
- Spike: mic permission, route, tone, RMS, PiP video, haptics, self-test.
- Unsigned IPA via GitHub Actions.
- Install via SideStore; run self-test.
- Design proof: connection, measurement, report.
- Simulator screenshots and accessibility audit.
- Go/no-go review.

**Acceptance:** installs and launches; auth/route work; tone plays; RMS moves; PiP starts
or the checklist fallback works; haptics fire; self-test reports pass/fail; refresh keeps
data; iOS version supported.

### Phase 1 — Diagnostic MVP (`v0.2.0`)

- Full audio engine, FFT/SVR, bilateral category, fingernail scratch.
- Five-step flow, one flow with skip and resume.
- Report with categorical verdict, confidence, dB delta, spectral diff.
- Recovery with Apple’s method, before/after, baseline export/import.
- English copy, all states, accessibility.
- Tests on the Simulator and on-device test.

**Acceptance:** complete check in under five minutes; both ears can be flagged; skipped
data marked; no fabricated results; no crash; copy/contrast checks pass.

### Phase 2 — Copilot and polish (`v0.3.0`)

- PiP video, auto-start and fallback.
- Manual Settings checklist; no private URL promise.
- Motion, haptics, vector hero, four-zone diagram from static SVG/PDF assets.
- Screenshot review and final visual fixes.

### Phase 3 — Release loop (`v1.0.0`)

- AltSource and one-tap install/update.
- Signing-expiry banner and baseline export prompt.
- Release script, README, status/changelog.
- Tag and handover.

---

## 10. Versioning and progress

- `VERSION` uses semver; currently `0.1.0-dev.3`.
- `CHANGELOG.md` and `docs/STATUS.md` update at every phase.
- Conventional Commits; tags `v0.1.0`, `v0.2.0`, `v0.3.0`, `v1.0.0`.
- The local project is its own git repo; the GitHub repo is the public mirror.
- The OpenChamber knowledge plan shows the checklist and current blockers.

---

## 11. Risks, unknowns, and what could kill it

1. **Free signing fragility.** SideStore/iloader can break with iOS or Apple sign-in
   changes. Mitigation: spare Apple ID, official tools, Phase 0B test, USB refresh
   fallback, PWA fallback.
2. **iOS compatibility.** The owner’s iOS version is unknown. SideStore support for the
   newest release may lag. Mitigation: check before building; fallback to USB install.
3. **HFP limits.** Narrowband input may make the high band unavailable; AGC may still
   apply. Mitigation: sample-rate check, lower band, confidence label, no lab claims.
4. **Bilateral threshold validity.** The `Both high-frequency loss` threshold is
   provisional. Mitigation: PWA data collection, conservative confidence, baseline.
5. **PiP reliability.** Auto-start may be blocked or video may not qualify. Mitigation:
   video PiP, button fallback, checklist fallback, test in Phase 0B.
6. **SideStore expiry.** The app may be expired when needed months later. Mitigation:
   export/import baseline, expiry warning, PWA fallback, documented re-install.
7. **No hardware simulator.** The Simulator can test layout and accessibility, not mic,
   PiP, haptics or Bluetooth. The owner is the only hardware tester; iteration is slower.
8. **Public repo.** Code and IPA are public. If unacceptable, switch to private + server
   hosting, which adds a token and a service.
9. **Legal/terms.** Personal sideloading with community tools is a gray area; it is not an
   App Store distribution. The app must not be presented as a medical device.
10. **Cleaning safety.** Incorrect cleaning can damage the mesh. The app follows Apple’s
    official method and bans aggressive techniques.
11. **Scope.** The native app is still a large build; the PWA gate can stop it early if
    the method is not useful.
12. **Data loss.** Deleting the app loses local history; baseline export/import is the
    mitigation.
13. **Safari microphone selection.** `getUserMedia` may choose the iPhone mic instead of
    the AirPods. Mitigation: show label/sample rate, include the scratch check, mark
    `Unverified` when the spike is missing.
14. **PiP route switching.** Bluetooth settings changes can interrupt the audio session.
    Mitigation: `AVPlayerLooper`, `requiresLinearPlayback = false`, a checklist fallback,
    and a device test in Phase 0B.

---

## 12. Explicitly out of scope for v1

- App Store distribution, TestFlight, paid developer account.
- Android, web product (the PWA is validation, not the product), iPad-specific layouts,
  Mac app.
- Cloud sync, accounts, analytics, push notifications.
- Automatic Left/Right microphone switching.
- Firmware, serial, battery or hardware-fault detection.
- Medical diagnosis, guaranteed repair, lab calibration.
- 165 Hz water-eject tone in the MVP.
- Live Activities.
- 0–100 headline score.
- 60 fps rendering, a 3D engine, live translation.
- Any server port, tunnel, funnel or public exposure.

---

## 13. Questions for the reviewer

1. Is native iOS still justified now that the PWA validation track exists, or should the
   PWA become the product and the native app a later craft project?
2. Is the free SideStore route worth the fragility for an occasional-use utility, or is
   $99/year TestFlight the more responsible recommendation?
3. Is the per-ear SVR plus bilateral category a credible way to catch two equally muffled
   ears? What threshold or calibration would you use?
4. Is the categorical report plus measured dB delta the right honesty level, or is there
   still a useful numeric summary?
5. Is a bundled looping MP4 in a standard `AVPlayer` PiP reliable enough on current iOS?
   What is the best fallback?
6. Is XcodeGen + native `xcodebuild` the right CI choice? Any hidden pitfalls with
   `.xcstrings`, asset catalogs, background modes or unsigned IPAs?
7. What would you cut from the native MVP? Is the PWA gate the right way to avoid
   over-building?
8. Is the one-flow-with-skip UX balanced, or does it still risk being annoying or
   confusing?
9. Is the dark tactile instrument direction appropriate for a diagnostic utility, or does
   it fight legibility and accessibility?
10. Is the build/sign/distribution path secure and maintainable? Any red flags?
11. What are the top three risks, and what would you test first?
12. Are there any factual errors or overclaims in this revision?
13. Are the provisional SVR thresholds reasonable, and what would you measure in Phase 0A
    to calibrate them?

---

## 14. Current state and next steps

**Done:** product, design, UX, copy, setup, review responses and decision records; local
git repo; version `0.1.0-dev.3`; design/automation plan.

**Waiting on:** owner decision to build Phase 0A; public GitHub repo URL; deploy key added;
iPhone iOS version; one-time SideStore setup on a PC with USB.

**Then:** build the PWA validation, push the plan, scaffold the XcodeGen spike, build the
unsigned IPA, install through SideStore, run the self-test, and hold the go/no-go review.

## 15. References

- Apple Support — How to clean your AirPods Pro:
  <https://support.apple.com/en-us/120409>
- SideStore — installation:
  <https://docs.sidestore.io/docs/installation/install>
- SideStore — prerequisites:
  <https://docs.sidestore.io/docs/installation/prerequisites>
- iloader: <https://iloader.app>
- XcodeGen: <https://github.com/yonaskolb/XcodeGen>
- Apple TestFlight / Developer Program:
  <https://developer.apple.com/programs/>
- Apple Human Interface Guidelines:
  <https://developer.apple.com/design/human-interface-guidelines/>
- Apple `AVAudioSession.CategoryOptions`:
  <https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct>
- Apple AVKit Picture in Picture:
  <https://developer.apple.com/documentation/avkit/avpictureinpicturecontroller>
