# Status — SonicCare Pro

**Version:** `0.1.0-dev.3`  
**Phase:** 0A — PWA live; 0B native self-test built; install pending  
**Last updated:** 2026-11-05  
**State:** PWA is live and working on the owner's AirPods. Native Phase 0B is built: an
unsigned IPA on GitHub and an install page are ready. The self-test has not run on the
iPhone yet. The left-ear diagnosis still needs one controlled repeat.

## Done

- Product, design, UX, copy, setup and decision records.
- Two independent reviews answered in `docs/REVIEW_RESPONSE.md`.
- Plan revision `0.1.0-dev.3` pushed to `voccov/soniccare-pro`.
- Deploy key authorized; remote pushed; tags `v0.1.0-dev`, `.2`, `.3`, `.3-pwa`,
  `.3-pwa2`.
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
  - unsigned arm64 IPA, iOS 17+, 102 KB;
  - GitHub Actions native build successful; release tag `native-latest`;
  - install page at <https://voccov.github.io/soniccare-pro/install.html>.

## Next actions

1. Complete the one-time SideStore setup on the Linux PC.
2. Install the native self-test from the install page.
3. Run the native self-test: permission, HFP route, sample rate, live RMS, tone, haptics, PiP.
4. Run one more controlled left+right PWA pair at the same volume and distance.
5. If the left stays at least 6 dB weaker, clean the **left mesh only**, wait 2 hours, and
   retest.
6. Set the final thresholds and start the native MVP.

## Blockers

- SideStore one-time Linux setup; Linux distribution still unknown.
- Native self-test results.
- Another controlled PWA pair for repeatability.

## Latest evidence

- Repo: <https://github.com/voccov/soniccare-pro>
- PWA: <https://voccov.github.io/soniccare-pro/>
- Data: left −8.1 dB SVR, right −0.95 dB SVR; left suspect; both mics live.
- Scratch: left +37.0 dB delta / +18.2 dB ratio; right +28.3 dB delta / +10.4 dB ratio.
- Plan/version checks pass for `0.1.0-dev.3`.

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
