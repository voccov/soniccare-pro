# Status — SonicCare Pro

**Version:** `0.1.0-dev.4`  
**Phase:** 0A — PWA live; 0B native self-test built and audited; install from macOS pending  
**Last updated:** 2026-11-09  
**State:** PWA is live and working on the owner's AirPods. Native Phase 0B is built: an
unsigned IPA on GitHub and an install page are ready. The owner now has a macOS computer
with the iPhone and a USB cable, so the SideStore blocker is a physical 20-minute step,
not an unknown. The self-test has not run on the iPhone yet. The left-ear diagnosis still
needs one controlled repeat. The audit fixed the PWA's unverified-report path and the
native PiP/route-change conflicts.

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

## Next actions

1. On the Mac: install SideStore with iloader (macOS DMG v2.4.1) using the spare Apple ID;
   follow `docs/SETUP.md`.
2. Install the native self-test from the install page.
3. Run the self-test and record it at
   <https://voccov.github.io/soniccare-pro/selftest.html>; send the copied result.
4. Run one more controlled left+right PWA pair at the same volume and distance.
5. If the left stays at least 6 dB weaker, clean the **left mesh only**, wait 2 hours, and
   retest.
6. Set the final thresholds and start the native MVP.

## Blockers

- SideStore install from the owner's Mac; the iPhone and USB cable are available.
- Native self-test results.
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
