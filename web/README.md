# SonicCare PWA — Phase 0A validation

A plain HTML/CSS/JS page. No build step, no dependencies, no network calls.

## Run locally

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory web
```

Open `http://127.0.0.1:8765/` in a browser. Microphone access requires a secure
context: `localhost` is accepted by browsers; for the iPhone use the GitHub Pages HTTPS
URL.

## What it does

- Requests the microphone with echo cancellation, noise suppression and AGC disabled.
- Shows the input label and sample rate; marks the result `Unverified` if the scratch
  check does not spike.
- Measures Phase A (“Ahhh”, 150–800 Hz) and Phase B (“Ssss”, 3–6.5 kHz) separately.
- Computes SVR per ear as band-integrated `HF − LF`.
- Compares left and right; supports a bilateral `Both high-frequency loss` category.
- Exports a JSON file with the raw values. Audio is never uploaded or recorded.
- Also hosts the native install page and the Phase 0B self-test checklist
  (`install.html`, `selftest.html`); the checklist copies a structured result and sends
  nothing.

## Limits

- It cannot switch the Left/Right microphone; use iOS Settings.
- It cannot verify absolute SPL or lab-grade frequency response.
- The thresholds are provisional and must be calibrated with real AirPods data.
- The scratch check verifies the active microphone, not both ears simultaneously.

## Test on the iPhone

1. Open the Pages URL in Safari.
2. Tap **Enable microphone** and allow access.
3. Set the microphone in Settings → Bluetooth → (i) → Microphone.
4. Return to Safari, tap **Reconnect input**, then **Start scratch check**.
5. Run “Ahh” and “Ssss” for the left ear, then switch and repeat for the right.
6. Tap **Export JSON** and keep the file for calibration.

## Privacy

No uploads, accounts, analytics, third-party scripts or persisted audio. Results are
stored in `localStorage` on the phone and exported only when you tap Export.

## Phase 1 mockup

`mockup.html` is a clickable design mockup of the planned guided flow. It uses example
data, is not a measurement, and is not linked from the PWA. It exists for design review.

