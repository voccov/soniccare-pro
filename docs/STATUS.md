# Status — SonicCare Pro

**Version:** `0.1.0-dev.4`  
**Phase:** 0A — PWA live; 0B native self-test run on the iPhone; Phase 1 UX/UI blueprint ready for review  
**Last updated:** 2026-11-09  
**State:** PWA is live and working on the owner's AirPods. Native Phase 0B is built and
installed via iloader: the microphone chain, route, live level, tone and PiP work; the
haptic tap does not fire yet. SideStore is installed but its Apple ID sign-in returns
`-80045`, so the 7-day refresh still needs a fix. The left-ear diagnosis still needs one
controlled repeat. The audit fixed the PWA's unverified-report path and the native
PiP/route-change conflicts.

## Done

- Product, design, UX, copy, setup and decision records.
- Two independent reviews answered in `docs/REVIEW_RESPONSE.md`.
- Plan revision `0.1.0-dev.4` pushed to `voccov/soniccare-pro`.
- Deploy key authorized; remote pushed; tags `v0.1.0-dev`, `.2`, `.3`, `.3-pwa`,
  `.3-pwa2`, `.4`.
- GitHub Pages source set to GitHub Actions; workflow write permission set.
- Phase 0A PWA live at <https://voccov.github.io/soniccare-pro/>:
  - microphone capture with processing disabled;
  - cross-phase, band-integrated SVR;
  - single-channel scratch check with a high-band friction ratio;
  - vocal-gated capture;
  - adaptive 8 kHz narrowband detection from the FFT cliff;
  - automatic stream re-lock after Settings;
  - cleaning guide + 2-hour dry timer;
  - demo mode, localStorage, JSON export/copy.
- First real AirPods pair captured:
  - left SVR **−8.1 dB** (LF −35.0, HF −43.1);
  - right SVR **−0.95 dB** (LF −39.1, HF −40.1);
  - left is 7.2 dB weaker; right is in the healthy provisional range;
  - both scratch checks verified; both mics are live;
  - wideband link, medium confidence; no 8 kHz cliff.
- First left run was −13.5 dB; the left SVR moved 5.4 dB between runs. Repeatability is
  not settled.
- Phase 0B native self-test built:
  - XcodeGen + SwiftUI shell, one app target, one test target;
  - microphone permission, HFP route, sample rate, live RMS;
  - 1 kHz tone, haptic tap, looping `PiPGuide.mp4` with PiP;
  - input restarts on a route change; PiP pauses the mic instead of fighting it;
  - unsigned arm64 IPA, iOS 17+, 115 KB;
  - CI run `42077740655`: unit tests 2m55s, device build 34s, IPA published;
  - release tag `native-latest` updated with the audited build;
  - install page at <https://voccov.github.io/soniccare-pro/install.html>.
- Audit fixes:
  - native `AudioMath` tests for RMS, level mapping, Bluetooth port and sample-rate label;
  - iOS 17 permission API, iOS 26 HFP availability guard, real input sample rate;
  - PWA refuses a category when the scratch check or AirPods input is unverified;
  - PWA locks the ear selector during a capture and flags phase/ear input changes;
  - demo mode uses two tones and reports `Demo only`, never a false ear diagnosis;
  - headless Chromium PWA run with a synthetic two-tone microphone passed:
    scratch verified, both ears captured, JSON copied, report restored after reload;
  - the live dev.4 page was re-tested; legacy captures migrate to the new input schema.
- macOS install path prepared:
  - `docs/SETUP.md` rewritten for macOS + iloader (DMG v2.4.1 or `brew install --cask
    iloader`), with iPhone trust, Developer Mode, LocalDevVPN and refresh steps;
  - a phone self-test checklist at <https://voccov.github.io/soniccare-pro/selftest.html>
    that copies a structured result, linked from the install page;
  - the published IPA re-verified: 115,110 bytes, arm64, iOS 17+, `PiPGuide.mp4`
    included, no app icon by design.
- Phase 1 UX/UI blueprint built and live (2026-11-09), ready for review:
  - <https://voccov.github.io/soniccare-pro/blueprint/>;
  - Graphite and Porcelain variants; System/Full/Reduced motion; happy, wrong-route and
    low-signal states; inline Settings + scratch; one microphone at a time;
  - a 36-second walkthrough and `walkthrough.mp4` recording;
  - example data only; no microphone request, no measurement.
- Native self-test run on the iPhone (2026-11-09), installed via iloader because SideStore
  sign-in returns `-80045`:
  - microphone permission Granted; route BluetoothHFP; live level moved when speaking;
  - 1 kHz tone audible; PiP works and pauses the microphone as designed, but is deferred
    to Phase 2; the rest of the chain is reported working;
  - **haptic tap does not fire**; under diagnosis (system haptics vs generator lifetime);
  - sample rate displays **48000 Hz**: that is the engine rate, not proof of the HFP link
    rate; Phase 1 must still set the band from the FFT cliff;
  - the header scrolls under the status bar; fix in the design pass.

## Next actions

1. Review the UX/UI blueprint at <https://voccov.github.io/soniccare-pro/blueprint/>;
   pick Graphite or Porcelain and note any step that should change.
2. Finish the on-device self-test checklist and send the copied result.
3. Diagnose the haptic tap (system haptics vs generator lifetime); fix and rebuild if it
   is the app.
4. Run the Phase 0A **tone/loopback experiment** in the PWA before native Phase 1:
   channel-panned ping, quiet tone/sweep through the AirPods while the HFP mic is active.
5. Run one more controlled left+right PWA pair at the same volume and distance.
6. If the left stays at least 6 dB weaker, clean the **left mesh only**, wait 2 hours, and
   retest.
7. Set the final thresholds and start the native MVP.
8. Fix the SideStore `-80045` sign-in for the 7-day refresh; iloader is the interim
   installer.

## Blockers

- Haptic tap and the sample-rate/bandwidth question from the first self-test.
- SideStore sign-in `-80045` for on-device refresh; not blocking the self-test.
- Another controlled PWA pair for repeatability.

## Known gaps

- Native self-test still has no app icon and uses hardcoded English strings; the final UI
  must move them to `Localizable.xcstrings`.
- No Simulator screenshots or `performAccessibilityAudit` run yet; Dynamic Type styles are
  in place, but the visual proof is still pending.
- The native five-step diagnostic flow, SVR engine and scratch detection are Phase 1.
- The PWA has no service worker/offline cache, PiP or haptics; those are documented
  native/PWA limits.

## Latest evidence

- Repo: <https://github.com/voccov/soniccare-pro>
- PWA: <https://voccov.github.io/soniccare-pro/>
- Self-test checklist: <https://voccov.github.io/soniccare-pro/selftest.html>
- Data: left −8.1 dB SVR, right −0.95 dB SVR; left suspect; both mics live.
- Scratch: left +37.0 dB delta / +18.2 dB ratio; right +28.3 dB delta / +10.4 dB ratio.
- Plan/version checks pass for `0.1.0-dev.4`.
- Native CI: <https://github.com/voccov/soniccare-pro/actions/runs/42077740655> — unit
  tests on the Simulator, unsigned device IPA, release asset 115,110 bytes.
- IPA re-checked 2026-11-09: `com.soniccarepro.app`, build 1, iOS 17.0+, arm64, iPhone
  only, `PiPGuide.mp4` bundled, microphone usage string present, no app icon by design.

## Do not forget

- One run is not enough; SVR is sensitive to speaking volume and distance.
- Both mics are live; this is not a dead-mic signal.
- The left is the suspect; do not clean the right unless a repeat says otherwise.
- TestFlight is not free. The free route is SideStore; 7-day expiry, 3 apps, 10 App IDs
  per week.
- HFP is mono; the scratch check verifies only the target ear.
- SVR is cross-phase: `HF` from “Ssss” minus `LF` from “Ahhh”, band-integrated.
- Apple’s official mesh cleaning method is micellar water + a soft children’s toothbrush.
- No 165 Hz tone, no Live Activity, no 0–100 headline, no `App-Prefs:` promise.
- Never commit secrets, the private deploy key, personal identifiers or microphone data.
