# Setup — GitHub and SideStore

> **Current state:** the public repo is created and the deploy key is connected, so
> sections 1–2 are done. Start at section 3 (spare Apple ID) or section 5 (SideStore).
> The native self-test IPA is already built.

This is the one-time setup. It is the only part that cannot be automated: SideStore must be
installed on the iPhone from a computer with a USB cable. After that, builds and updates are
one tap.

**Never send a password, Apple ID password, or two-factor code in chat.** The Apple ID
sign-in happens on your own computer and phone.

---

## 1. GitHub — create the repo (done)

1. Open this link:

   <https://github.com/new?name=soniccare-pro&description=AirPods+Pro+microphone+diagnostic+and+recovery+app&visibility=public>

2. Keep the name `soniccare-pro`. Choose **Public** (recommended for the free GitHub
   Actions and Pages route). Do **not** add a README, `.gitignore` or license; we push
   those.
3. Click **Create repository**.
4. Copy the repo URL from the address bar, for example
   `https://github.com/<your-name>/soniccare-pro`, and send it in the chat.

If you prefer a private repo, create it as **Private** and tell me. The free build still
works, but the IPA then has to be hosted on this server instead of a public release.

## 2. GitHub — connect this server with a deploy key (done)

I will send one **public** key in the chat after you send the repo URL. A deploy key is
safer than a password or a broad token.

1. Open your repo's **Settings → Deploy keys → Add deploy key**.
   Direct link after the repo exists:
   `https://github.com/<your-name>/soniccare-pro/settings/keys/new`
2. Title: `airpods-doctor build server`.
3. Paste the public key I send.
4. Tick **Allow write access**.
5. Click **Add key**.

That is the connection. No token, no password, no GitHub app.

## 3. Apple ID — use a spare account

Use a separate free Apple Account for signing, not your main iCloud account. This limits
the blast radius if a third-party signing tool ever trips Apple's security checks.

1. Open <https://account.apple.com/> in a private browser window.
2. Choose **Create Your Apple Account**.
3. Use an email address you can access and a password you store safely. No payment method
   is needed.
4. Verify the email and phone number.
5. Tell me only that the spare account is ready. **Do not send the email or password.**

## 4. iPhone — check the iOS version

Open **Settings → General → About → iOS Version** and send me the number (for example
`iOS 26.5`). SideStore supports iOS 15 and later according to its docs, but support for
the newest release can lag. This is the make-or-break check.

## 5. SideStore — one-time install (PC + USB)

You need a Windows, macOS or Linux computer, a USB cable, the iPhone, and about 20
minutes. This is the official SideStore flow.

### On the iPhone first

1. Install **LocalDevVPN** from the App Store:
   <https://apps.apple.com/app/localdevvpn/id6755608044>
2. Open it and tap **Connect**. Allow the VPN configuration when asked.
3. Keep it connected during installs and refreshes.

### On the computer

1. Download **iloader** for your OS:
   <https://iloader.app>
   (direct releases: <https://github.com/nab138/iloader/releases/latest>)
2. Connect the iPhone with the USB cable. Tap **Trust** on the phone and enter the
   passcode.
3. Open iloader.
4. Sign in with the **spare Apple ID** from step 3.
5. Select your iPhone.
6. Choose **Install SideStore (Stable)**.

### Back on the iPhone

1. **Settings → General → VPN & Device Management**.
2. Under **Developer App**, tap your Apple ID, then **Trust**, then **Allow & Restart**.
3. Enter the passcode.
4. **Settings → Privacy & Security → Developer Mode** → turn on. The phone restarts.
5. Open **LocalDevVPN** and connect.
6. Open **SideStore** and sign in with the same spare Apple ID.
7. Go to **My Apps** and tap the **7 DAYS** counter next to SideStore to refresh it.
8. If asked to revoke or create a certificate, tap **Yes** or **Refresh Now**.

Official guide:
<https://docs.sidestore.io/docs/installation/install>

Swedish version of the docs (optional):
<https://docs.sidestore.io/sv/docs/installation/install>

### If something goes wrong

- Send the exact error text or a screenshot. Do not send passwords.
- SideStore troubleshooting: <https://docs.sidestore.io/docs/troubleshooting/common-issues>
- iloader issues are handled by the idevice Discord listed on the SideStore page.
- A pairing file can expire after an iOS update or reset; the guide covers it:
  <https://docs.sidestore.io/docs/advanced/pairing-file>

## 6. What happens next

When the repo is connected and SideStore works:

1. The plan and Phase 0 spike are already pushed.
2. GitHub Actions builds an unsigned IPA on macOS.
3. Open <https://voccov.github.io/soniccare-pro/install.html> on the iPhone and tap
   **Install in SideStore**.
4. SideStore signs and installs the app.
5. The app appears on the Home Screen. Open it and run the self-test.
6. Every update: tap the new link, or use **Update** in SideStore.
7. Every 7 days: keep LocalDevVPN on Wi-Fi; SideStore refreshes automatically. If the app
   expires, open SideStore and tap the days counter to refresh.

## What to send back

- The iPhone iOS version.
- Confirmation that SideStore is installed and refreshed.
- Confirmation that the spare Apple ID is ready (no email or password).
- The exact text or a screenshot of any SideStore error.

That is everything. The rest is automated.

## Limits to expect

- Free Apple ID: 3 apps per device including SideStore, 10 App IDs per week, 7-day
  provisioning.
- TestFlight is **not** part of this route; it needs the $99/year Apple Developer Program.
- The app is a personal build, not an App Store release. If you later want the App Store,
  we remove the personal-only features, use the paid account, and go through review.
