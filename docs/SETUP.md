# Setup — GitHub and SideStore

> **Current state:** the public repo is created, the deploy key is connected, and the
> native self-test IPA is built and published. The only remaining setup is the one-time
> SideStore install from a Mac with a USB cable. Start at **Quick path** below.
>
> **Never send a password, Apple ID password, or two-factor code in chat.** The Apple ID
> sign-in happens on your own Mac and iPhone.

---

## Quick path (macOS + iPhone, about 20 minutes)

You need: the Mac, the iPhone, a USB cable, and the **spare Apple ID** from section 3.
Have the phone unlocked and its passcode ready. If the spare Apple ID does not exist yet,
create it first (section 3); it takes a few minutes.

### On the Mac

1. Download **iloader** for macOS:
   <https://iloader.app>
   (direct DMG: <https://github.com/nab138/iloader/releases/download/v2.4.1/iloader-darwin-universal.dmg>)

   If you use Homebrew, this is the same app:

   ```sh
   brew install --cask iloader
   ```

2. Open iloader. If macOS blocks it, allow it under
   **System Settings → Privacy & Security**.
3. Connect the iPhone with the USB cable.
4. On the iPhone: tap **Trust**, enter the passcode.
5. On the Mac: if macOS asks **Allow this accessory to connect?**, choose **Allow**.
6. In iloader: sign in with the **spare Apple ID**.
7. Select the iPhone, then choose **Install SideStore (Stable)**.
8. Keep the cable connected and the iPhone unlocked until iloader says it is done.

### On the iPhone

1. **Settings → General → VPN & Device Management → Developer App** → tap your Apple ID
   → **Trust** → **Allow & Restart** → enter the passcode.
2. **Settings → Privacy & Security → Developer Mode** → turn on. The phone restarts.
3. Install **LocalDevVPN** from the App Store:
   <https://apps.apple.com/app/localdevvpn/id6755608044>
4. Open LocalDevVPN and tap **Connect**. Allow the VPN configuration when asked.
   Keep it connected during installs and refreshes.

   **Already using Tailscale or another VPN?** iOS keeps only one VPN active at a time,
   so disconnect it while LocalDevVPN is connected, then switch back afterwards. Tailscale
   cannot replace LocalDevVPN: SideStore needs an on-device VPN that reaches iOS's own
   installation service, not a route to your home network.
5. Open **SideStore** and sign in with the same spare Apple ID.
6. Go to **My Apps** and tap the **7 DAYS** counter next to SideStore to refresh it.
7. If asked to revoke or create a certificate, tap **Yes** or **Refresh Now**.

SideStore is now installed. You can unplug the cable.

### Install SonicCare Pro

1. On the iPhone, open this page in **Safari** (not an in-app browser):
   <https://voccov.github.io/soniccare-pro/install.html>
2. Tap **Install in SideStore**.
3. SideStore signs the app and installs it. The app appears on the Home Screen.
4. Open **SonicCare Pro**, allow microphone access, and run the self-test.
5. Record the result with the checklist:
   <https://voccov.github.io/soniccare-pro/selftest.html>
6. Tap **Copy result** and send it in the chat.

Official SideStore guide:
<https://docs.sidestore.io/docs/installation/install>

Swedish version:
<https://docs.sidestore.io/sv/docs/installation/install>

### If something goes wrong

- **The iPhone does not appear in iloader:** unlock the phone, tap Trust again, try
  another cable or USB port. Avoid hubs and charge-only cables.
- **SideStore sign-in fails with `-80045`:** this is a known SideStore/anisette issue, not
  a wrong password. Two ways forward:
  - Install the IPA directly with iloader: **Import IPA** → choose `SonicCarePro.ipa`.
    This signs and installs the app without SideStore sign-in. The 7-day refresh then
    needs iloader again until SideStore works.
  - Fix the on-device login later: SideStore → **Settings → User Customizations** → turn
    off **On-Device Anisette**, pick a working anisette server, reset `adi.pb`, fully
    close SideStore, then retry with the **same Apple ID used in iloader**. Do not retry
    many times in a row; Apple rate-limits with 429/503.
- **SideStore shows an error:** send the exact error text or a screenshot. Do not send
  passwords or two-factor codes.
- **SideStore says “no ipsec/IKEv2 interface found” on iOS 26.4 or later:** use a remote
  pairing file. In SideStore: **Settings → Pairing File Management** → long-press
  **Remote Pairing** → **Set as Preferred**, then force-quit and reopen SideStore. If
  there is no Remote Pairing entry, generate one with the current iloader and import it.
- **The install button on the install page does nothing:** SideStore is not installed or
  not refreshed yet. Finish the iPhone steps above first.
- **The app expires after 7 days:** open LocalDevVPN, then SideStore, and tap the days
  counter to refresh. This is a free-Apple-ID limit, not an app bug.
- **A pairing file expired after an iOS update:** follow
  <https://docs.sidestore.io/docs/advanced/pairing-file>.
- SideStore troubleshooting:
  <https://docs.sidestore.io/docs/troubleshooting/common-issues>

---

## 1. GitHub — create the repo (done)

The public repo is <https://github.com/voccov/soniccare-pro>. It was created with no
README, `.gitignore` or license, then this repository was pushed to it.

## 2. GitHub — connect the build server with a deploy key (done)

The deploy key has write access, so the build server can push commits, tags and the
unsigned IPA release. No GitHub token or password is stored.

## 3. Apple ID — use a spare account (check first)

The signing account must be a separate free Apple Account, not the main iCloud account.
The password stays with the owner.

- If it does not exist yet, create it now; it takes a few minutes:
  <https://account.apple.com/> in a private browser window.
- No payment method is needed.
- The agent never receives the email, password or two-factor code.

## 4. iPhone — check the iOS version (done)

Confirmed **iOS 26.7.2**. SideStore supports iOS 15 and later according to its docs.
Developer Mode and the 7-day refresh are the parts that need the newest iOS to behave.

## 5. What happens next

1. Builds and updates are automatic: GitHub Actions builds an unsigned IPA on macOS and
   publishes it to the `native-latest` release.
2. To update: open the install page and tap **Install in SideStore**, or use **Update** in
   SideStore.
3. Every 7 days: keep LocalDevVPN on Wi-Fi. SideStore refreshes automatically. If the app
   expires, open SideStore and tap the days counter.
4. Send back the self-test result from the checklist page.

## What to send back

- Confirmation that SideStore is installed and refreshed.
- The self-test result from the checklist page.
- The exact text or a screenshot of any error.

## Limits to expect

- Free Apple ID: 3 apps per device including SideStore, 10 App IDs per week, 7-day
  provisioning.
- TestFlight is **not** part of this route; it needs the $99/year Apple Developer Program.
- The app is a personal build, not an App Store release. If you later want the App Store,
  we remove the personal-only features, use the paid account, and go through review.
