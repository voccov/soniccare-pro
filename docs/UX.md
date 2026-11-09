# UX — SonicCare Pro

The flow is a guided check, not a course. It must be usable by someone who has never
tested a microphone, while staying out of the way for someone who just wants the result.

One linear flow. Inline guidance. A visible skip on every optional step. No mode toggle.

## Flow

```
Start
  → Readiness (case, ears, fit test, quiet room, volume)
  → Connection (permission, route, sample rate)
  → Ear identity (left/right ping; swapped earbuds)
  → Side setup (left, then right; inline Settings visual; fingernail scratch)
  → Voice test (Ahh and Ssss, per ear; target level)
  → Report (category, dB delta, spectral diff)
  → Recovery (four zones, safety, retest)
  → Done / Before-after
```

## Guidance

- One-line instruction per screen, plus an inline “Why” disclosure where it helps.
- A visual only when it replaces a paragraph.
- Tips appear once and stay dismissed.
- No modal tour, no repeated coach marks, no popup on every launch.
- A returning user can skip the explanation, not the honesty rules.

## Phase 1 interaction direction (proposed, 2026-11-09)

- **Both earbuds stay in. One microphone at a time.** iOS HFP sends one mono stream, so the
  app never shows two live microphone meters. Two ear cards are allowed: the active card
  has the live meter, the other says **Next** until the user switches the microphone in
  Settings. No fake simultaneous data.
- **Readiness before measurement.** Show the case → earbuds → ears sequence with a short
  vector animation. Ask the user to run Apple's Ear Tip Fit Test and confirm a good seal;
  a bad seal can look like high-frequency loss. Check the room noise, then set the volume
  deliberately low.
- **Ear identity ping.** Before the microphone is active, play a left-only or right-only
  tone over A2DP and ask “Which ear did you hear it in?”. This catches swapped earbuds and
  a dead driver, and makes no microphone claim.
- **Volume safety.** The app cannot read or set system volume. It renders its own tone at
  a low digital level, asks “Can you hear it?”, and raises one step only with consent. No
  tone during cleaning, no 165 Hz, no surprise loud playback.
- **One target-level ring.** Guide the voice into a comfortable band; reject frames that
  are too quiet, clipped or too short. A short retry is better than a bad capture.
- **Purposeful motion.** The case, earbud, mesh zone and ear map animate on step changes;
  only the level ring and spectrum animate continuously. Reduce Motion uses crossfades.
- **Block only validity.** Block the measurement until the route, microphone and level are
  verified. Physical actions use a confirmation, not a pretend sensor; every optional step
  keeps a visible skip and the report says **Not tested**. The cleaning guide is never
  blocked.
- **Acoustic loopback is an experiment.** A tone or sweep played through the AirPods while
  the HFP microphone is active is tested in the PWA first. It becomes a feature only if
  the data shows a repeatable per-ear response; until then the voice SVR is the method.

## Skip matrix

Visible as a text link, never a competing button.

| Step | Skip behaviour |
|---|---|
| Readiness | Use the iPhone microphone in demo mode; every result is labelled Demo. |
| Connection | Same as readiness; the report says the route was not verified. |
| Ear identity | Skip the ping; the ear side stays unverified and the report says so. |
| Side setup | Single-ear check; no left/right comparison. The report says so. |
| Voice phase | Missing band is shown as Not tested; no category for incomplete data. |
| Ear test | Only the completed ear is reported; the other is Not tested. |
| Recovery | Exit; the baseline stays saved. |
| Report | Not applicable; this is the result. |

Critical skips ask once, in a small confirmation sheet that states exactly what will be
missing. The app never fills a gap with a guess.

## Screen rules

### Start

- Status pill: `AirPods Pro · Connected`, `iPhone microphone`, or `Demo`.
- One headline, two lines of explanation, one primary button: `Start check`.
- Secondary: `How it works`.
- Last result card if a baseline exists: date, left/right category, `See result`.
- Settings in the toolbar.

### Readiness

- Show the case → earbuds → ears sequence as a short vector animation.
- Rows: `Both earbuds in`, `Ear Tip Fit Test` (Settings path and a good-seal confirmation),
  `Quiet room`, `Volume low`.
- Each row: icon, label, status, and one action. The app cannot sense in-ear status or run
  the fit test; it asks for a clear confirmation and explains why it matters.
- Primary: `Continue` when ready.
- `Skip setup` link with the skip confirmation.

### Connection

- Vector hero card; microphone access, connection state, input route, sample rate.
- Warning if Control Center Mic Mode is not Standard.
- Demo toggle in the top corner, clearly labelled.
- Primary `Continue`; secondary `Not connected?`.

### Ear identity

- Before the microphone is active, play a left-only ping over A2DP.
- Ask `Which ear did you hear it in?` with `Left`, `Right`, `Both`, `Neither`.
- `Right` on a left ping means the earbuds are swapped: guide the user to swap them and
  test again. `Both` or `Neither` points to fit, connection or a driver problem.
- This is a playback check, not a microphone measurement. The report never uses it as a
  per-ear result.

### Side setup

- Three-step visual: Settings → Bluetooth → (i) → Microphone → Always Left/Right.
- No one-tap Bluetooth settings promise. The MVP path is an inline visual of the three
  Settings taps, plus a Control Center long-press tip where it works. PiP is Phase 2.
- The bundled `PiPGuide.mp4` remains the Phase 2 enhancement; the checklist stays on
  screen when it is not used.
- On return: `Which microphone did you set?` segmented control.
- `Test left microphone`: ask the user to **lightly scratch the bottom silver ring with a
  fingernail for one second**. Do not tap the stem; the force sensor can trigger a gesture.
  HFP sends only the active mono stream, so this verifies the **target ear** only: a
  transient at least 18 dB above the noise floor confirms it; silence means iOS is still
  using the other microphone. No simultaneous opposite-ear claim. Success haptic; `Left
  microphone confirmed` or `Nothing happened — check the selected microphone`.
- `Skip side check` marks the comparison unverified; the report says so.

### Voice test

- Full-screen measurement session; no navigation chrome that invites accidental exit.
- Step header, ear indicator, phase label, 3-2-1 countdown, live level ring and spectrum.
- The level ring shows a target band. Accept only frames inside it; reject low or clipped
  audio and ask for a short retry with a specific instruction.
- Phase detection starts and stops the capture when enough valid frames exist; the user
  holds the sound for three seconds and does not press anything.
- No UI sounds or haptics during the capture; confirm after, not over the microphone.
- Prompts: `Say "Ahh" for three seconds` and `Say "Ssss" for three seconds`.
- `Start`, `Stop`, `Test again`, `Skip this phase`.
- Low signal: `We didn't hear enough. Move the phone closer or try again in a quieter
  room.` No blame.
- After each phase: a small check and a beat before the next; the user can pause.
- At the ear change: `Now the right ear. Switch the microphone in Settings, then come
  back.` State is saved.
- The app computes SVR per ear, not only left vs right.

### Report

- Verdict first: `Balanced`, `Right high-frequency loss`, `Left high-frequency loss`,
  `Both high-frequency loss`, `Severely blocked`, or `Not enough data`.
- Measured dB delta and SVR values; a confidence label.
- `What this means` disclosure.
- `What we measured`: left/right SVR, high-frequency roll-off, measured dB difference.
- `What we didn't measure`: absolute calibration, firmware, serial, battery, hardware
  fault.
- Spectral diff chart; the muffled band is annotated with the measured dB difference.
- Primary: `Clean and test again` when muffled; otherwise `Test again`.
- Secondary: `Save result`, `Export baseline`, `See cleaning guide`.
- No 0–100 headline score.

### Recovery

- Safety note at the top: Apple's official method; no liquids in openings, no compressed
  air, no sharp tools.
- Four zone cards: stem ring, speaker mesh, outer ANC mesh, inner pressure/mic port.
- Each card says what the zone does, what to do, and what not to do.
- `Test again` and before/after comparison; no "fixed" claim without a measurement.
- A 165 Hz tone is not part of the MVP. If it is ever added, it is a clearly labelled
  future experiment with Automatic Ear Detection off, buds out of the ears, mesh down,
  low volume, and no repair promise.

### Settings

- Demo mode.
- Language: English; Swedish later.
- Privacy: audio stays on device; no network.
- Data: export baseline, import baseline, reset history.
- About: version, signing expiry, `Send diagnostics` (share a local log).

## States

Design every one of these; no blank screens.

- **Permission denied:** `Microphone access is off. Open Settings to turn it on, or use
  the iPhone microphone for a demo.`
- **No AirPods:** `Connect your AirPods Pro, or use the iPhone microphone for a demo.`
- **Wrong route:** `iOS is using the iPhone microphone. Open Control Center and check the
  audio route.`
- **Low signal:** retry guidance, not a failure verdict.
- **Bilateral loss:** `Both microphones are quieter in the high frequencies. This can
  happen when both meshes are blocked or damp.`
- **Interrupted:** `Your progress is saved. Continue when you're ready.`
- **Signing expiring:** `This build expires in N days. Export your baseline and refresh
  it in SideStore.`
- **No baseline:** `No previous result yet. After this check, you can compare.`
- **Loading:** a calm skeleton or a one-line status, never a spinner in the middle of
  content.

## Resume and persistence

- Persist the current step, ear, phase and captured data after every meaningful change.
- If the app is backgrounded for Settings or a call, return to the same place with a
  short `Welcome back` line, not a restart.
- Store results locally in Application Support; no cloud. Keep the last 10 sessions.
- Export/import baseline JSON; a re-sign via SideStore must not erase data.
- Keep a signing-expiry warning visible in About and before a long gap.

## PWA validation

The Phase 0A PWA mirrors this flow without PiP, haptics or native route verification. It is
a validation tool, a no-expiry fallback, and a **hard gate for the native MVP**. It must
show `audioTrack.getSettings().sampleRate` and `audioTrack.label`, and include the
fingernail-scratch check. If scratching the AirPod stem does not spike the meter, Safari is
on the iPhone microphone; the result is `Unverified`. Its JSON export informs the native
bilateral thresholds.

## Accessibility

- VoiceOver labels and hints for every control; the spectrum gets a text summary.
- Dynamic Type up to the largest sizes; no truncation of the primary action.
- 44×44 pt targets; 8 pt spacing between adjacent targets.
- Increased contrast and Reduce Motion.
- No color-only status: icon + text always.
- Haptics and audio cues are optional and never the only feedback.

## Balance rules

- Guide the next action, not the whole journey. One screen, one job.
- Explain only when the user asks or when a decision needs context.
- Skip is always visible, but the consequence is stated once.
- Never block the cleaning guide behind a completed test.
- Never force a demo; offer it as a clearly labelled fallback.
