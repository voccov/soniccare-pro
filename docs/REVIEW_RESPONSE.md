# Review response — independent critique

**Plan reviewed:** `v0.1.0-dev`  
**Revised plan:** `v0.1.0-dev.2`  
**Date:** 2026-11-05

This is the disposition of the independent review. It records what we accepted, what we
rejected, and why. The revised plan is in `docs/PLAN.md` and
`docs/PLAN_FOR_REVIEW.md`.

## Disposition at a glance

| # | Reviewer point | Verdict | Action |
|---|---|---|---|
| 1 | `.allowBluetoothHFP` will not compile | **Rejected — outdated** | Use `.allowBluetoothHFP` with a compiler fallback; `.allowBluetooth` is deprecated in Xcode 26. |
| 2 | Both ears can be equally clogged | **Accepted** | Add per-ear SVR and a `Both high-frequency loss` category; never green from L/R similarity alone. |
| 3 | 165 Hz tone is defeated by ear detection | **Accepted** | Cut from MVP; future experiment only, not a promised repair. |
| 4 | Live Activity fallback breaks free-account limits | **Accepted** | Cut completely; no widget extension. |
| 5 | `xtool` on macOS is unnecessary risk | **Accepted** | Use XcodeGen + native `xcodebuild` unsigned IPA. |
| 6 | Sample-buffer PiP is fragile | **Accepted** | Use a bundled 6-second MP4 with `AVPlayer` + `AVPlayerLayer`. |
| 7 | A PWA may be the better first product | **Partially accepted** | Add a PWA validation/fallback track; native remains the craft product. |
| 8 | SideStore is bad for occasional use | **Accepted risk** | Add baseline export/import, PWA fallback, and an expiry warning. |
| 9 | Three-target SwiftPM split is over-engineering | **Accepted** | One app target + one test target. |
| 10 | Five bash lint scripts are premature | **Accepted** | Keep `status.sh` and `check-docs.sh`; defer copy/token/contrast scripts. |
| 11 | Pseudo-localization is unnecessary | **Accepted** | English only in v1; localization later. |
| 12 | Cut the Guide me / Quick test toggle | **Accepted** | One linear flow with inline explanations and visible skips. |
| 13 | Stem tap triggers the force sensor | **Accepted** | Use a one-second fingernail scratch on the bottom silver ring. |
| 14 | `App-Prefs:` is blocked or redirected | **Accepted** | No private URL in the primary UX; manual Settings path and PiP video. |
| 15 | Public repo security | **Accepted** | Repo-scoped deploy key; docs check for emails, UDIDs, tailnet hosts. |
| 16 | Tertiary text contrast is too low | **Accepted** | Change `#6E6E76` to `#8E8E93`; measured 5.64:1 on `#131419`. |
| 17 | 0–100 score looks falsely scientific | **Accepted** | Categorical verdict + measured dB delta; no score headline. |
| 18 | HFP may be 16 or 24 kHz | **Accepted with correction** | Also 8 kHz CVSD; read the actual sample rate and set the FFT ceiling from Nyquist. |

---

## 1. Technical corrections

### 1.1 `.allowBluetoothHFP` — rejected as outdated

The reviewer says `.allowBluetoothHFP` is not a category option and will not compile. That
was true with the Xcode 16 SDK, but the plan builds with Xcode 26/27 on the macOS runner.
Apple’s current `AVAudioSession.CategoryOptions` documents `.allowBluetoothHFP`; `.allowBluetooth`
is marked deprecated. Xcode 26 emits a deprecation warning for `.allowBluetooth` and
recommends `.allowBluetoothHFP`.

The confusion is between two different symbols:

- `AVAudioSession.Port.bluetoothHFP` — the input port type we check at runtime.
- `AVAudioSession.CategoryOptions.allowBluetoothHFP` — the category option.

The revised plan uses:

```swift
#if compiler(>=6.2)
let options: AVAudioSession.CategoryOptions = [.allowBluetoothHFP, .allowBluetoothA2DP]
#else
let options: AVAudioSession.CategoryOptions = [.allowBluetooth, .allowBluetoothA2DP]
#endif
```

Evidence: Apple’s `CategoryOptions` documentation and the Swift Forums thread
“XCode 26: AVAudioSession.CategoryOptions.allowBluetooth deprecated.”

### 1.2 Bilateral clogging — accepted

A pure left-vs-right comparison can pass two equally muffled ears. The revised design
computes SVR per ear:

```
LF = mean power 150–800 Hz
HF = mean power 3–6.5 kHz (or the highest available band)
SVR = 10 * log10(HF / LF)
```

The report has separate categories:

- `Balanced`
- `Left high-frequency loss`
- `Right high-frequency loss`
- `Both high-frequency loss`
- `Severely blocked`
- `Not enough data`

`Both high-frequency loss` is raised when both ears’ SVR is low, even if the left/right
delta is small. The exact threshold is provisional until real captures are collected;
until then the app shows confidence and never calls a low-SVR pair “healthy.” The PWA
validation track exists partly to collect that data.

### 1.3 165 Hz tone — accepted, cut from MVP

AirPods Pro 2 pause or reroute playback when both buds leave the ears unless Automatic Ear
Detection is disabled. A low-volume 165 Hz tone on a small driver is not a proven way to
move water through the mesh. The MVP removes the feature. A future experiment may revisit
it only with a measured protocol, Automatic Ear Detection off, the buds out of the ears,
and a clear “comfort, not repair” label.

### 1.4 Live Activity — accepted, cut

A Live Activity needs a Widget Extension target with its own bundle identifier, which
consumes free-account App ID slots and often fails Personal Team provisioning. The
fallback is removed; PiP is the only floating guide.

### 1.5 `xtool` on macOS — accepted, replaced

`xtool` exists to cross-compile without Xcode. On a macOS runner, Xcode is already there.
The revised plan uses XcodeGen plus native `xcodebuild`:

```sh
xcodegen generate
xcodebuild -project SonicCarePro.xcodeproj -scheme SonicCarePro \
  -configuration Release -sdk iphoneos \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  build
mkdir -p Payload
cp -R build/Release-iphoneos/SonicCarePro.app Payload/
zip -qry SonicCarePro.ipa Payload
```

This handles `.xcstrings`, asset catalogs, `Info.plist` background modes and test targets
natively. The project is one app target + one test target.

### 1.6 PiP — accepted, pre-rendered video

The live `ImageRenderer` → `CMSampleBuffer` path is replaced by a small bundled
`PiPGuide.mp4` (6-second loop, H.264, 720×1280, silent audio track) played through
`AVPlayer` + `AVPlayerLayer` + `AVPictureInPictureController`. It is more stable across
audio route changes, needs far less code, and survives backgrounding better. The fallback
is a concise Settings checklist on the SideSetup screen.

---

## 2. Strategic critique

### 2.1 Native vs PWA — partially accepted

The reviewer is right that a PWA can do more than the original plan admitted: iOS Safari
can request raw-ish microphone constraints, Web Audio can compute FFT bands, and HTML5
video PiP can float over Settings. Native still gives:

- programmatic verification that the input port is `bluetoothHFP`, not the iPhone mic;
- CoreHaptics;
- a more reliable native PiP and audio session;
- the native SwiftUI craft the owner asked for.

The plan adds **Phase 0A — PWA validation**: a small `web/` app hosted on GitHub Pages that
implements the same SVR and bilateral logic, runs in Safari, stores data locally, and
exports JSON. It gives the owner a working tool immediately, validates the acoustic method
on real AirPods, and serves as a fallback if SideStore is painful. Native remains the craft
product; the PWA is not a replacement.

### 2.2 SideStore and occasional use — accepted risk

The reviewer’s usage pattern is real: intensive use for two days, then months of inactivity,
then an expired app. Mitigations:

- Add `Export baseline` / `Import baseline` JSON via the share sheet.
- Show a signing-expiry warning and a “export before you forget” prompt.
- Keep the PWA fallback available.
- Document that a re-install may be needed after a long gap.
- Keep the one-time SideStore setup guide in `docs/SETUP.md`.

The free route is still the owner’s choice; the plan is honest about the trade-off.

---

## 3. Scope cuts

Accepted:

- One app target + one test target; no `SonicCareCore`/`SonicCareDSP`/app split.
- Defer `check-copy.sh`, `check-tokens.sh`, `check-contrast.sh` and `screenshots.sh` until
  after the audio engine works. Keep `status.sh` and `check-docs.sh`.
- No pseudo-localization in v1; English only.
- No 165 Hz in the MVP.
- No Live Activity.
- One linear flow; no Guide me / Quick test mode toggle.
- No 0–100 score headline; categories plus measured dB.
- No 3D engine; a vector hero is enough.
- No 60 fps PiP; a 6-second video loop is better.

Kept:

- The five-step flow.
- The SVR method, now per-ear plus L/R.
- Native route verification, haptics and PiP.
- Apple’s official cleaning method.
- The design system and anti-slop rules.
- The phased proof before the full app.

---

## 4. UX, acoustic and security corrections

### 4.1 Fingernail scratch instead of stem tap

Tapping the stem can trigger the force sensor and send low-frequency thuds through the
head. The revised instruction is: “Lightly scratch the bottom silver ring with a fingernail
for one second.” The detector looks for a broadband transient above an adaptive noise
floor, and checks that the opposite ear does not show the same spike.

### 4.2 No `App-Prefs:` promise

`App-Prefs:root=Bluetooth` is private and unreliable on modern iOS; it can redirect to the
app’s own settings page. The primary UX is the visual path and the PiP video: Settings →
Bluetooth → (i) → Microphone. A Control Center long-press tip can be shown, but it is not a
promise of one-tap navigation.

### 4.3 Public repo and secrets

- The deploy key is scoped to this one repository with write access.
- No Apple ID email, UDID, tailnet host or personal email in docs, workflow logs or commit
  metadata.
- Commit identity is a neutral noreply address.
- `check-docs.sh` now scans user-facing docs for email addresses, tailnet host suffixes,
  Tailscale IPs and 40-character device identifiers.
- The build server holds no Apple credentials; SideStore signs on the phone.

### 4.4 Contrast

`#6E6E76` on `#131419` measures 3.64:1 and fails WCAG AA for small text. The revised
tertiary color is `#8E8E93` (Apple systemGray), which measures 5.64:1 on `#131419` and
6.17:1 on `#070709`.

### 4.5 HFP sample rates

The reviewer’s 16/24 kHz point is useful but incomplete: CVSD 8 kHz is also possible.
The app must read the actual input sample rate and set the usable band from Nyquist:

| Input rate | Nyquist | High band | Confidence |
|---|---|---|---|
| 8 kHz (CVSD) | 4 kHz | 2–3.5 kHz | Low |
| 16 kHz (mSBC) | 8 kHz | 3–6.5 kHz | Medium |
| 24 kHz (AAC-ELD) | 12 kHz | 3–6.5 kHz | Medium |
| 48 kHz (built-in/demo) | 24 kHz | 3–6.5 kHz | High in demo only |

`.measurement` is still requested, but the app does not claim it disables every Bluetooth
codec process. Confidence labels carry that uncertainty.

---

## 5. What changed in the plan

- Revision `0.1.0-dev.2`.
- Build: XcodeGen + native `xcodebuild`; `xtool` removed.
- One app target + one test target.
- Phase 0A PWA validation/fallback; Phase 0B native proof.
- Per-ear SVR and bilateral category.
- Categorical report; no 0–100 headline.
- PiP video asset; no sample-buffer renderer.
- No 165 Hz in MVP; no Live Activity.
- One flow with inline guidance and skip; no mode toggle.
- Fingernail scratch; manual Settings path.
- Tertiary color `#8E8E93`.
- Baseline export/import.
- Deferred lint scripts and pseudo-localization.
- Added `REVIEW_RESPONSE.md`, updated `PLAN.md`, `PLAN_FOR_REVIEW.md`, `UX.md`, `COPY.md`,
  `DESIGN.md`, `DECISIONS.md`, `STATUS.md`, `AGENTS.md`, `README.md`.

## 6. What did not change

- Native remains the primary craft product.
- The free SideStore route remains the owner’s choice, with its trade-offs stated.
- The SVR method remains the core measurement.
- Apple’s official cleaning method remains the safety reference.
- The five-step flow and the honest “measured vs not measured” report remain.
- The project stays privacy-first: no uploads, no accounts, no analytics.

## 7. Remaining risks

1. HFP bandwidth and repeatability on the owner’s specific iPhone/AirPods.
2. PiP auto-start and route changes; video PiP is better but still needs a device test.
3. SideStore expiry and community-tool fragility.
4. Bilateral threshold validity; needs real captures.
5. Public repo visibility; acceptable only with no personal identifiers.
6. Scope: the native app is still a large build; the PWA gate can stop it early if the
   method is not useful.

## 8. Evidence links

- Apple `AVAudioSession.CategoryOptions`:
  <https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct>
- Swift Forums, Xcode 26 `.allowBluetooth` deprecation:
  <https://forums.swift.org/t/xcode-26-avaudiosession-categoryoptions-allowbluetooth-deprecated/80956>
- Apple WWDC25 high-quality Bluetooth recording:
  <https://developer.apple.com/videos/play/wwdc2025/251>
- Apple ActivityKit:
  <https://developer.apple.com/documentation/activitykit>
- Apple AVKit Picture in Picture:
  <https://developer.apple.com/documentation/avkit/avpictureinpicturecontroller>
- XcodeGen: <https://github.com/yonaskolb/XcodeGen>
- SideStore install: <https://docs.sidestore.io/docs/installation/install>
- Apple cleaning guidance: <https://support.apple.com/en-us/120409>
