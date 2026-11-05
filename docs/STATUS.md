# Status — SonicCare Pro

**Version:** `0.1.0-dev.3`  
**Phase:** 0A — PWA live; first real AirPods data in; native Phase 0B starting  
**Last updated:** 2026-11-05  
**State:** PWA is live and working on the owner's AirPods. First full pair received; the
left ear is the weaker side, but one more controlled pair is needed for repeatability.
Native app code has not started yet; Phase 0B is the next build.

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

## Next actions

1. Run one more controlled left+right pair at the same volume and distance.
2. If the left stays at least 6 dB weaker, clean the **left mesh only**, wait 2 hours, and
   retest.
3. Send the PC OS for the one-time SideStore setup.
4. Start native Phase 0B: XcodeGen shell, self-test, GitHub Actions IPA.
5. Install via SideStore and compare native vs PWA.
6. Set the final thresholds from repeated real data.

## Blockers

- SideStore one-time PC + USB setup; PC OS still unknown.
- Another controlled pair for repeatability before cleaning.

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
