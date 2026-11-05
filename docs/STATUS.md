# Status — SonicCare Pro

**Version:** `0.1.0-dev`  
**Phase:** 0 — Proof  
**Last updated:** 2026-11-05  
**State:** planning and design records complete; waiting on the GitHub repo and the
one-time SideStore setup before scaffolding the spike.

## Done

- Product, design, UX, copy, setup and decision records.
- Skill audit: `impeccable` v4.8.0 is the design authority for this project; native iOS
  guidance, Operate mode, and the review sequence are recorded in `docs/DESIGN_REVIEW.md`.
- Free native distribution route chosen: GitHub Actions macOS builds an unsigned IPA;
  SideStore signs and installs it with a free Apple ID.
- English-first decision recorded; Swedish is a later locale.
- Anti-slop, guidance and automation rules written down.
- Local git repo initialized; first commit tagged `v0.1.0-dev`.
- Deploy key generated on the server; waiting to be added to GitHub.
- Independent review packet written: full plan, rationale, risks and reviewer questions.

## Next actions

1. Owner creates the public GitHub repo and sends the URL.
2. Owner adds the deploy key from the chat; we push the plan and the first tag.
3. Owner completes the one-time SideStore setup and sends the iPhone iOS version.
4. Scaffold the SwiftPM + `xtool` project and the Phase 0 spike.
5. Build the unsigned IPA on GitHub Actions and install it through SideStore.

## Blockers

- GitHub repo URL and deploy-key authorization.
- iPhone iOS version (SideStore compatibility).
- One-time PC + USB access for SideStore.

## Latest evidence

- Impeccable updated from v4.3.1 to v4.8.0; engine v0.1.18.
- SideStore docs checked: iOS 15+ requirements, iloader install, LocalDevVPN, 7-day
  refresh.
- Server has no `gh` and no Apple/Swift toolchain; the build runs on GitHub macOS.

## Do not forget

- TestFlight is not free. The free route is SideStore; 7-day expiry, 3 apps, 10 App IDs
  per week.
- The app cannot switch the Left/Right microphone; the user does it in Settings and the
  app verifies with a stem tap.
- HFP is a speech link. Use 3–6.5 kHz, check the actual sample rate, and lower confidence
  when the high band is unavailable.
- Apple's official mesh cleaning method is micellar water + a soft children's toothbrush,
  not ethanol on the mesh.
- Never commit secrets, the deploy key, or microphone data.
