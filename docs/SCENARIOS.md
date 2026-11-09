# Scenarios — what people report and what the app can check

Last updated 2026-11-09. This is product and design research, not a statistical survey.
There is no representative public dataset for AirPods Pro 2 faults, and the app has no
analytics. The labels below are **community signals** from the sources at the bottom; they
are not percentages and must not be shown as statistics in the app.

## Why this note exists

The first build assumed one problem: a muffled earbud. Real reports are broader. This note
maps the common reports to a check the app can actually perform, and names the ones it
cannot. It keeps the product honest and makes the test chooser match what people bring.

## Signal map

| What people report | Community signal | What the app can check | Test | What it cannot do |
|---|---|---|---|---|
| Muffled, distant or uneven sound | Very common; dirty speaker mesh, earwax, fit, or call mode | Band-integrated high-frequency response per microphone; relative left/right | **Microphone check** | Absolute SPL, a hardware fault, or the cause |
| One earbud quieter or silent | Very common; charge contact, debris, balance, pairing, driver | A real tone in each earbud; which side it is heard on | **Sound check** | Battery health, charging, or a driver failure |
| Calls sound bad or muffled | Common; blocked voice-mic mesh; the selected microphone | The selected microphone's high-frequency response; switch L/R and repeat | **Microphone check** | The other person's audio or the network |
| Loose fit, slipping, weak bass or ANC | Common; wrong tip size, poor seal, different ears | Nothing directly; Apple's Ear Tip Fit Test and tip guidance | **Fit and seal** (optional) | A measured seal or a guaranteed tip size |
| Crackling, popping or whistling | Common; ANC feedback, debris, moisture, driver | A tone in each earbud and the route; cleaning/drying guidance | **Sound check + cleaning** | Repair; repeated crackling needs service |
| One earbud does not connect or charge | Common; contacts, case, pairing | The active route; a tone per earbud | **Connection + sound check** | Battery and charging state |
| Water, sweat or rain exposure | Common; moisture in a mesh | Drying and cleaning guidance only | **Recovery** | Whether water is still inside |
| ANC or Transparency feels wrong | Common; fit, debris, a blocked microphone | Fit, cleaning and a service decision | **Fit + cleaning** | The ANC calibration or a hardware fault |
| Battery drains too fast | Common | Nothing; the public API does not expose per-bud battery health | **Not tested** | Battery health; do not claim it |
| Firmware or serial questions | Common | Nothing; not available through public APIs | **Not tested** | Firmware version, serial, or model beyond the paired name |

## What the tests cover

- **Microphone check (primary).** The cross-phase SVR check; one microphone at a time;
  both earbuds stay in. This is the only test that measures the high-frequency response.
- **Sound check.** A real 1 kHz tone panned left and right. The user reports where each
  tone is heard. It checks drivers and stereo routing, not the microphone.
- **Fit and seal (optional).** A guide to Apple's Ear Tip Fit Test and tip sizes. It never
  blocks the check and is never presented as a measurement.
- **Connection.** The route and input-rate check inside the microphone check.
- **Recovery.** The cleaning and two-hour drying guide, then a retest against the baseline.

## Community numbers (not representative)

One public repair-timeline site reports crackling/popping peaking around 12% of AirPods
Pro 2 devices and battery degradation affecting around 50% by 2.5 years. These are
community repair estimates, not a representative survey, and they are not shown in the
app. The app cannot read battery health or repair a driver.

Source: <https://sundr.ca/failure-timeline/apple-airpods-pro-2nd-gen>

## Sources

- Apple Support, clean AirPods Pro: <https://support.apple.com/en-us/120409>
- Apple Support, AirPods hub (one AirPod, charging, connection, fit test):
  <https://support.apple.com/airpods>
- Comply, why AirPods Pro sound muffled:
  <https://www.complyfoam.com/blogs/comply-foam-blog/why-do-my-airpods-pro-sound-muffled>
- BGR, five common AirPods problems:
  <https://www.bgr.com/2238850/common-problems-owners-have-apple-airpods>
- iFixit, AirPods Pro crackling and ANC feedback:
  <https://www.ifixit.com/Answers/View/723447/Right+AirPods+Pro+crackling+during+the+slightest+movement>
- Glitchary, muffled sound and the call-mode clue:
  <https://glitchary.com/guides/airpods-sound-muffled>
- Sundr, community repair timelines for AirPods Pro 2 (community data, not a survey):
  <https://sundr.ca/failure-timeline/apple-airpods-pro-2nd-gen>

## If we want a real survey

The app has no analytics and no network. A representative survey would be a separate,
explicitly anonymous form outside the app. Until it exists, use words such as “common” and
“community signal”, never a percentage.
