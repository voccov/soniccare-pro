# Status — SonicCare Pro

**Version:** `0.1.0-dev.3`  
**Phase:** 0A/0B — proof  
**Last updated:** 2026-11-05  
**State:** two independent reviews incorporated; plan, design and review records complete.
No app code yet.

## Done

- Product, design, UX, copy, setup and decision records.
- Round 1 review answered in `docs/REVIEW_RESPONSE.md`.
- Round 2 review answered; the plan is now `0.1.0-dev.3`:
  - Single-channel scratch verification; no simultaneous opposite-ear claim.
  - Cross-phase, band-integrated SVR (`HF` from “Ssss”, `LF` from “Ahhh”).
  - Provisional thresholds recorded as hypotheses, not validated constants.
  - `xcodebuild -derivedDataPath build -destination 'generic/platform=iOS'`.
  - XcodeGen `GENERATE_INFOPLIST_FILE: NO` and explicit `INFOPLIST_FILE`.
  - `AVQueuePlayer` + `AVPlayerLooper` for PiP; `requiresLinearPlayback = false`.
  - PWA shows `sampleRate`/`label`, includes the scratch check, and is a hard gate.
  - Static SVG/PDF assets for the four-zone diagram.
  - Tailscale CGNAT/IPv6 scan in `check-docs.sh`.
- Local git repo; previous tags `v0.1.0-dev` and `v0.1.0-dev.2`.
- Deploy key generated.
- `scripts/status.sh` and `scripts/check-docs.sh` pass.

## Next actions

1. Owner creates the public GitHub repo and sends the URL.
2. Owner adds the deploy key; we push the plan and tag `v0.1.0-dev.3`.
3. Build the Phase 0A PWA validation (hard gate; no GitHub/SideStore required to develop).
4. Owner completes the one-time SideStore setup and sends the iPhone iOS version.
5. Scaffold the XcodeGen Phase 0B spike after GitHub is connected.
6. Build the unsigned IPA on GitHub Actions and install it through SideStore.

## Blockers

- GitHub repo URL and deploy-key authorization.
- iPhone iOS version (SideStore compatibility).
- One-time PC + USB access for SideStore.
- Owner decision on starting the PWA validation.

## Latest evidence

- Round 1: `.allowBluetoothHFP` is the current symbol; `.allowBluetooth` is deprecated in
  Xcode 26. Compiler fallback added. The reviewer’s claim was outdated.
- Round 2: HFP is mono, so the scratch check verifies the target ear only; silence means
  the other microphone is active.
- SVR is cross-phase and band-integrated; mean-per-bin values were removed.
- `xcodebuild` writes to DerivedData unless `-derivedDataPath build` is passed.
- `AVPlayerLooper` prevents the 6-second PiP video from collapsing at its end.
- Tertiary contrast: `#6E6E76` 3.64:1 (fail), `#8E8E93` 5.64:1 (pass).
- SideStore docs checked: iOS 15+ requirements, iloader install, LocalDevVPN, 7-day
  refresh.

## Do not forget

- TestFlight is not free. The free route is SideStore; 7-day expiry, 3 apps, 10 App IDs
  per week.
- The app cannot switch the Left/Right microphone; the user does it in Settings and the
  app verifies the target with a fingernail scratch.
- HFP can be 8, 16 or 24 kHz; the high band follows the actual sample rate.
- Both ears can be equally muffled; per-ear SVR and a bilateral category are required.
- Apple’s official mesh cleaning method is micellar water + a soft children’s toothbrush,
  not ethanol on the mesh.
- No 165 Hz tone, no Live Activity, no 0–100 headline, no `App-Prefs:` promise.
- Never commit secrets, the private deploy key, personal identifiers or microphone data.
