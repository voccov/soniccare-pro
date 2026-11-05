# Status — SonicCare Pro

**Version:** `0.1.0-dev.3`  
**Phase:** 0A — PWA built; 0B native proof next  
**Last updated:** 2026-11-05  
**State:** GitHub repo connected and plan pushed. Phase 0A PWA is **live on GitHub Pages**;
native app code has not started. The next step is a real AirPods test in Safari.

## Done

- Product, design, UX, copy, setup and decision records.
- Two independent reviews answered in `docs/REVIEW_RESPONSE.md`.
- Plan revision `0.1.0-dev.3` pushed to `voccov/soniccare-pro`.
- Deploy key authorized; remote pushed; tags `v0.1.0-dev`, `.2`, `.3`.
- GitHub Pages source set to GitHub Actions; workflow write permission set.
- Phase 0A PWA built in `web/` and **deployed live**:
  - microphone capture with processing disabled;
  - cross-phase, band-integrated SVR;
  - single-channel scratch check;
  - demo mode;
  - localStorage and JSON export;
  - installable manifest and icons.
- GitHub Pages workflow deployed successfully:
  <https://voccov.github.io/soniccare-pro/>
- `scripts/status.sh` and `scripts/check-docs.sh` pass.

## Next actions

1. Open the live PWA on the iPhone and run the real AirPods test, left and right.
2. Export the JSON and send it for threshold calibration.
3. Complete the one-time SideStore setup (iOS 26.7.2; spare Apple ID ready).
4. Scaffold the XcodeGen Phase 0B native spike.
5. Build the unsigned IPA on GitHub Actions and install via SideStore.
6. Compare the PWA data and set the native thresholds.

## Blockers

- SideStore one-time PC + USB setup; PC OS still unknown.
- Real AirPods test data for threshold calibration.

## Latest evidence

- Repo: `https://github.com/voccov/soniccare-pro`
- PWA: `web/` (Pages URL pending deployment)
- PWA demo test: session, spectrum, Ahh/Ssss capture and SVR report render correctly.
- Plan/version tags pushed; `check-docs.sh` passes for `0.1.0-dev.3`.

## Do not forget

- TestFlight is not free. The free route is SideStore; 7-day expiry, 3 apps, 10 App IDs
  per week.
- HFP is mono; the scratch check verifies only the target ear.
- SVR is cross-phase: `HF` from “Ssss” minus `LF` from “Ahhh”, band-integrated.
- Both ears can be equally muffled; the bilateral category is required.
- Apple’s official mesh cleaning method is micellar water + a soft children’s toothbrush.
- No 165 Hz tone, no Live Activity, no 0–100 headline, no `App-Prefs:` promise.
- Never commit secrets, the private deploy key, personal identifiers or microphone data.
