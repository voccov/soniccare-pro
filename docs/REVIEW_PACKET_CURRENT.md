# SonicCare Pro — current app, solution, and plan for independent review

**Reviewer:** you are a principal iOS engineer and product designer. Be blunt and
specific. Do not rewrite the plan. Prioritize what matters, answer the questions at the
end, and name the top three risks.

## 1. Current status — what actually exists

> **Update after the first review:** the live PWA now has vocal-gated capture,
> friction-ratio scratch detection, adaptive 8 kHz bandwidth detection, automatic stream
> re-lock on return from Settings, a 4-zone cleaning guide, a 2-hour dry timer, and
> Copy JSON. PWA PiP and light haptics are possible but not implemented; full CoreHaptics
> remains native-only. Native is on hold until real AirPods captures are exported.

- The owner is a non-developer, remote, reading on an iPhone. AirPods Pro (2nd gen),
  iOS 26.7.2. A spare free Apple ID is ready.
- A **PWA** is live and publicly reachable:
  **https://voccov.github.io/soniccare-pro/**
- Repo: **https://github.com/voccov/soniccare-pro** (public; no personal data or
  secrets).
- Version `0.1.0-dev.3`; tag `v0.1.0-dev.3-pwa`; GitHub Pages deployment works.
- The PWA has been smoke-tested in a desktop browser, including demo capture and report
  rendering. It has **not yet been tested on the owner’s real AirPods**. That test is the
  next step.
- The **native iOS app has not been built yet.** It is planned, not abandoned.
- **SideStore has not been installed yet.** The one-time PC + USB setup is pending; the
  owner’s PC OS is unknown.
- The PWA is the Phase 0A validation gate. It gives a working tool now, no expiry, and
  real data before the native build. The native app is Phase 0B and the craft product.

## 2. The app

### What it is

A guided, honest microphone check for AirPods Pro 2. It compares the left and right
microphones, looks for high-frequency loss caused by a blocked or damp mesh, and gives one
safe next step: clean and retest, or stop and seek service.

It is a personal instrument, not a medical device. It does not claim a lab result, and it
does not claim to fix hardware.

### The full five-step flow (native plan)

1. **Connection and readiness:** detect AirPods HFP vs iPhone mic, microphone permission,
   sample rate, quiet room, demo mode.
2. **Left/Right setup:** guide the user through iOS Settings; a floating PiP video guide;
   verify the target ear with a one-second fingernail scratch on the bottom stem ring.
3. **Voice test:** three seconds of “Ahhh” (low-mid 150–800 Hz), then three seconds of
   “Ssss” (high 3–6.5 kHz, or 2–3.5 kHz if HFP is 8 kHz). Repeat for the other ear.
4. **Report:** categorical verdict, measured dB delta, per-ear SVR, spectral difference,
   and a clear split between what was measured and what was not.
5. **Recovery:** Apple’s official mesh-cleaning method, four explanatory zones,
   before/after comparison, baseline export/import.

### What the current PWA actually does

- Requests the microphone with `echoCancellation: false`,
  `noiseSuppression: false`, `autoGainControl: false`.
- Shows the input label and sample rate.
- Includes a scratch check.
- Captures Phase A (“Ahhh”) and Phase B (“Ssss”) separately.
- Computes cross-phase, band-integrated SVR.
- Shows a categorical result and per-ear SVR.
- Has a demo signal, localStorage, JSON export/copy.
- Does **not** yet include the full cleaning guide, PiP, haptics, native route check, or
  the full five-step native UX.

## 3. The solution

### 3.1 PWA (live)

- Plain HTML/CSS/JS on GitHub Pages; no build step, no dependencies, no network calls
  after load.
- Web Audio `AnalyserNode`, 4096 FFT, 32-band spectrum.
- `getUserMedia` with processing flags disabled; iOS Safari may ignore some flags.
- Scratch check: 1.7 s window, 380 ms noise floor, peak must be at least 18 dB above the
  floor.
- Cross-phase SVR:
  `LF_dB` from Phase A “Ahhh” (150–800 Hz);
  `HF_dB` from Phase B “Ssss” (3–6.5 kHz);
  `SVR_dB = HF_dB − LF_dB`, using band-integrated power, not mean per bin.
- Results are saved locally; JSON export/copy; no audio upload or storage.
- PWA limits: no port-type verification, no full CoreHaptics, no PiP yet (HTML5 video PiP
  is possible), no background audio, no native feel, localStorage can be cleared by the
  browser. Light haptic ticks are possible via Safari’s `<input switch>` behavior, but
  they are not a substitute for CoreHaptics.

### 3.2 Native iOS (planned)

- SwiftUI, one app target + one test target.
- XcodeGen `project.yml`; native `xcodebuild` on GitHub Actions macOS; unsigned IPA;
  SideStore signs and installs on the phone with a free Apple ID.
- `AVAudioSession` `.playAndRecord`, `.measurement`, `.allowBluetoothHFP` with a compiler
  fallback to `.allowBluetooth` for older Xcode. Check
  `currentRoute.inputs.first?.portType == .bluetoothHFP`.
- `AVAudioEngine` input tap, Accelerate/vDSP FFT and RMS, per-ear SVR, bilateral category.
- `AVQueuePlayer` + `AVPlayerLooper` + `AVPlayerLayer` + `AVPictureInPictureController` for
  a bundled 6-second guide video; `requiresLinearPlayback = false`.
- CoreHaptics; baseline export/import; no 165 Hz tone in the MVP; no Live Activity; no
  `App-Prefs:` promise; no 0–100 headline score.

### 3.3 Measurement and honesty

- Bluetooth HFP is a speech link; it can be 8, 16 or 24 kHz and is band-limited and
  processed. Absolute SPL/lab calibration is impossible.
- The app reads the actual sample rate and chooses the high band from Nyquist.
- SVR is per-ear and cross-phase; it also compares left vs right and can flag
  **Both high-frequency loss**, so two equally muffled ears do not pass as healthy.
- Starting thresholds (provisional, not validated): healthy SVR −6 to +4 dB; unilateral
  delta at least 6 dB lower; bilateral both below −10 dB with less than 5 dB spread;
  severe below −18 dB or “Ahhh” RMS never above −40 dBFS.
- The report uses categories plus measured dB, not a 0–100 score.
- No claim of firmware, serial, battery, or a hardware diagnosis.

### 3.4 UX and design

- One linear flow with inline explanations and visible skips; no Guide/Quick mode toggle.
- One primary action per screen; progressive disclosure; no modal tour.
- Dark-only v1, one electric-blue accent, graphite surfaces, monospaced measurements.
- SF Pro Rounded / SF Pro / SF Mono; Dynamic Type, VoiceOver, 44 pt targets, reduced
  motion, increased contrast.
- Tertiary text `#8E8E93` (5.64:1 on surface); no 0–100 ring; no fake charts, gradients,
  glassmorphism, emoji icons, or hype copy.
- English first; Swedish later.

### 3.5 Build, distribution, security

- GitHub Actions macOS builds an unsigned IPA; SideStore signs/installs on the phone with
  a free Apple ID. No Apple credentials on the server.
- Free-account limits: 7-day provisioning, 3 apps per device including SideStore, 10 App
  IDs per week.
- TestFlight would cost $99/year and remove the 7-day expiry; it is not used.
- Deploy key is scoped to this one repo; public repo contains no personal data; docs scan
  for emails, UDIDs, tailnet hosts; audio never uploaded.

## 4. The plan

### Phase 0A — PWA validation (done)

- PWA built, deployed to GitHub Pages, smoke-tested.
- Real AirPods test and JSON export are still pending.
- Purpose: validate the acoustic method and UX before the native build; provide a
  no-expiry fallback; calibrate thresholds.

### Phase 0B — Native proof (next)

- XcodeGen project + app shell.
- Spike: microphone permission, route display, tone, RMS, looping PiP video, haptics,
  self-test screen.
- GitHub Actions builds the unsigned IPA.
- Install via SideStore; run the self-test.
- Design proof: connection, measurement, report.
- Go/no-go review.

### Phase 1 — Native MVP

- Full audio engine, cross-phase SVR, bilateral category, scratch detection.
- Five-step flow, skip/resume, all states, accessibility.
- Report, cleaning guide, baseline export/import.
- Unit tests and on-device test.

### Phase 2 — PiP and polish

- PiP video, Settings checklist, motion, haptics, vector hero, four-zone diagram.
- No Live Activity; no 165 Hz tone in v1.

### Phase 3 — Release loop

- AltSource, one-tap install/update, signing-expiry warning, docs, dashboard if a service
  is added.

## 5. Why the PWA came first

- Two independent reviews recommended a PWA as a hard gate: prove the SVR/scratch method
  and UX on real AirPods before paying the native setup/expiry cost.
- The native install needs a one-time PC + USB SideStore setup, which is not done. The
  PWA could be tested immediately.
- There is no Mac on the server; native iteration goes through GitHub Actions. The PWA
  iterates instantly.
- The PWA is not a replacement. Native remains the craft product with route verification,
  haptics and PiP.

## 6. Risks and what is unproven

1. **Real AirPods route:** Safari may choose the iPhone microphone; the scratch check
   catches it, but native port-type verification is stronger. Real test pending.
2. **SVR thresholds:** provisional; no real clean/muffled captures yet. The PWA test is
   meant to collect them.
3. **SideStore:** 7-day expiry, 3-app limit, 10 App IDs/week, one-time PC/USB, reliance on
   community tools. Occasional-use risk.
4. **HFP limits:** bandwidth, processing, no absolute calibration; native does not fix
   this.
5. **Bilateral detection:** logic is sound, threshold validity unproven.
6. **PiP reliability:** video PiP planned; auto-start and route changes still need a
   device test.
7. **No Mac:** native build/test loop is slower; hardware-only checks need the owner.
8. **Public repo:** code/IPA are public; no personal data, but it is a visibility choice.
9. **Scope:** the native app is a large build; the PWA may already be enough.
10. **Legal/terms:** personal sideloading with community tools is a gray area; not an App
    Store distribution.

## 7. Questions for the reviewer

1. Now that the PWA exists, is native iOS still justified? Would you ship the PWA only, or
   build the native app as a craft/portfolio product?
2. Is the free SideStore route worth the 7-day expiry and setup for an occasional-use
   utility, or is $99/year TestFlight the more responsible recommendation?
3. Is the cross-phase, band-integrated SVR method credible? What test protocol and
   thresholds would you use to validate it on real AirPods?
4. Is the single-channel scratch check enough to verify the active microphone, or would
   you add another check?
5. Is the native architecture right: XcodeGen, one target, `.measurement`, video PiP,
   CoreHaptics? Any hidden pitfalls?
6. What would you cut from the native MVP? What is over-engineered?
7. Is the one-flow-with-skip UX right for a non-technical user, or is anything missing?
8. Is the dark tactile instrument direction appropriate for a diagnostic utility? Any
   accessibility concerns?
9. Is the build/sign/distribution/security path sound? Any red flags?
10. What are the top three risks, and what would you test first?
11. Are there any factual errors or overclaims in this document?

## 8. What I want back

A prioritized critique, not a rewrite:

- What is wrong or overclaimed.
- What to cut.
- What to test first.
- Whether to continue native or stop at the PWA.
- The single most important change you would make.
