# Copy — SonicCare Pro

English first. Calm, plain, specific. The app is a precision instrument, not a coach and
not a chatbot. Every string lives in `Localizable.xcstrings`; no user-facing string in a
view.

## Voice

- Short sentences. Concrete verbs. Sentence case.
- Say what happened, what it means, and what to do next.
- Use "you" for the owner; use "we" only for the app's measurement.
- Prefer "test", "check", "microphone", "earbud", "result", "not tested".
- Avoid audio-engineer jargon. If a term is necessary, explain it once in plain English.
- Never blame the user, never fake enthusiasm, never overclaim precision.

## Banned patterns

Do not use these words or shapes in user-facing copy:

> unlock, elevate, seamless, effortless, revolutionary, AI-powered, smart, game-changing,
> dive in, curated, empower, leverage, robust, supercharge, unleash, next-level, cutting-edge.

Also banned:

- Exclamation marks.
- "Oops!", "Uh-oh!", "Something went wrong" without a cause and a next action.
- "Just", "simply", "easy" when describing a step that may not be.
- Fake urgency, fake scarcity, fake social proof, invented statistics.
- "Diagnose" as a medical claim. Use "check" and "result".
- Emoji in interface copy.
- Long paragraphs inside a screen. Two or three lines, then a disclosure.
- A 0–100 score presented as a lab result.

## Glossary

| Term | Use |
|---|---|
| AirPods Pro (2nd generation) | First mention; "AirPods" after. |
| Left earbud / Right earbud | Physical side. |
| Left microphone / Right microphone | The selected input. |
| Test tone | The short playback check. |
| Baseline | The first saved result used for comparison. |
| Not tested | A step that was skipped. Never fill it with a guess. |
| Demo | Built-in microphone or simulated signal; always labelled. |
| Muffled | Plain-language result; not a diagnosis. |
| High-frequency loss | The measured category; not "soap film". |
| Confidence | How much the app trusts the comparison: High, Medium, Low. |

## Screen copy examples

**Start**
- Title: `Check your AirPods`
- Body: `A two-minute check for muffled or uneven sound. We test each earbud and show you
  what we found.`
- Primary: `Start check`
- Secondary: `How it works`

**Pre-flight**
- `Microphone access` / `Allowed` / `Open Settings`
- `AirPods connected` / `Connected` / `Check connection`
- `Quiet room` / `Ready` / `I'm ready`
- `Continue`

**Side setup**
- `Set the microphone to Left`
- `Open Settings, tap your AirPods, then Microphone, then Always Left.`
- `Long-press the Bluetooth control in Control Center for a shortcut.`
- `Start floating guide`
- `I've set it to Left`
- `Lightly scratch the bottom silver ring with a fingernail for one second.`
- `Left microphone confirmed.`
- `Nothing happened. iOS is still using the other microphone. Go back to Settings and
  check the selected microphone.`

**Voice test**
- `Say "Ahh" for three seconds.`
- `Say "Ssss" for three seconds.`
- `Listening…`
- `We didn't hear enough. Move the phone closer or try again in a quieter room.`
- `Skip this phase`

**Report**
- `Right microphone has high-frequency loss`
- `The right microphone loses 12.4 dB in the high frequencies (3–6.5 kHz). This can happen
  when the mesh is blocked.`
- `Both microphones have high-frequency loss`
- `Both ears are lower in the high frequencies. This can happen when both meshes are
  blocked or damp.`
- `What we measured` / `What we didn't measure`
- `Clean and test again`
- `Test again`
- `Not enough data`

**Recovery**
- `Clean the mesh`
- `Use Apple's method: micellar water and a soft children's toothbrush. No liquids in the
  openings, no compressed air, no sharp tools.`
- `Test again and compare`
- `Export baseline`

**Errors**
- `Microphone access is off. Open Settings to turn it on, or use the iPhone microphone
  for a demo.`
- `iOS is using the iPhone microphone. Open Control Center and check the audio route.`
- `This build expires in 3 days. Export your baseline and refresh it in SideStore.`

## Skip confirmations

- Side check: `Skip the side check? The left and right microphones won't be compared.`
  Actions: `Skip` / `Keep going`.
- Voice phase: `Skip this phase? The high-frequency result will show as Not tested.`
  Actions: `Skip phase` / `Continue`.
- Pre-flight: `Use the iPhone microphone? Results will be labelled Demo and won't describe
  your AirPods.` Actions: `Use demo` / `Go back`.

## Localization

- English is the source language and the only v1 language.
- Swedish is a later locale. Keep strings out of views; use `Localizable.xcstrings`.
- Do not concatenate sentences; use whole-string keys with placeholders.
- Dates, numbers and units use the system formatters.
- Pseudo-localization and expansion testing are deferred until a second locale exists.

## Microcopy test

Before shipping a string, ask:

1. Would a calm person say this out loud?
2. Does it say what happened and what to do next?
3. Does it claim something the app did not measure?
4. Can it be shorter without losing meaning?
5. Does it sound like an Apple Support page rather than a marketing page?

If the answer to 3 is yes, rewrite it.
