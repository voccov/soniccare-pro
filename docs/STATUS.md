# Status — SonicCare Pro

**Version:** `0.1.0-dev.2`  
**Phase:** 0A/0B — proof  
**Last updated:** 2026-11-05  
**State:** independent review incorporated; plan, design and review records complete.
No app code yet.

## Done

- Product, design, UX, copy, setup and decision records.
- Independent review received and answered in `docs/REVIEW_RESPONSE.md`.
- Plan revised to `0.1.0-dev.2`:
  - XcodeGen + native `xcodebuild`, no `xtool`.
  - One app target + one test target.
  - PWA validation/fallback track.
  - Per-ear SVR and bilateral category.
  - Categorical report; no 0–100 headline.
  - PiP video; no Live Activity; no 165 Hz in MVP.
  - One flow with skip; no mode toggle.
  - Fingernail scratch; manual Settings path.
  - Tertiary color `#8E8E93`.
- Local git repo; previous tag `v0.1.0-dev`; deploy key generated.
- `scripts/status.sh` and `scripts/check-docs.sh` pass.

## Next actions

1. Owner creates the public GitHub repo and sends the URL.
2. Owner adds the deploy key from the chat; we push the plan and tag `v0.1.0-dev.2`.
3. Build the Phase 0A PWA validation (recommended; can start before the native build).
4. Owner completes the one-time SideStore setup and sends the iPhone iOS version.
5. Scaffold the XcodeGen Phase 0B spike after GitHub is connected.
6. Build the unsigned IPA on GitHub Actions and install it through SideStore.

## Blockers

- GitHub repo URL and deploy-key authorization.
- iPhone iOS version (SideStore compatibility).
- One-time PC + USB access for SideStore.
- Owner decision on the PWA validation track.

## Latest evidence

- Impeccable v4.8.0; native iOS review contract in `docs/DESIGN_REVIEW.md`.
- `.allowBluetoothHFP` is the current symbol; `.allowBluetooth` is deprecated in Xcode 26.
  The first reviewer’s claim was outdated; compiler fallback added.
- Tertiary contrast measured: `#6E6E76` 3.64:1 (fail), `#8E8E93` 5.64:1 (pass).
- SideStore docs checked: iOS 15+ requirements, iloader install, LocalDevVPN, 7-day
  refresh.
- XcodeGen + `xcodebuild` unsigned IPA is a standard, reproducible CI path.

## Do not forget

- TestFlight is not free. The free route is SideStore; 7-day expiry, 3 apps, 10 App IDs
  per week.
- The app cannot switch the Left/Right microphone; the user does it in Settings and the
  app verifies with a fingernail scratch.
- HFP can be 8, 16 or 24 kHz; the high band follows the actual sample rate.
- Both ears can be equally muffled; per-ear SVR and a bilateral category are required.
- Apple’s official mesh cleaning method is micellar water + a soft children’s toothbrush,
  not ethanol on the mesh.
- No 165 Hz tone, no Live Activity, no 0–100 headline, no `App-Prefs:` promise.
- Never commit secrets, the private deploy key, personal identifiers or microphone data.
