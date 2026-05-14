# Google Play closed testing — review account (internal)

Lightweight checklist for preparing an account Google reviewers can use during **internal**, **closed**, or **open** testing. Do **not** put real passwords, API keys, or production payment instruments in this file; store secrets in your password manager and in Play Console / Firebase only.

## What reviewers need

- A **dedicated test account** (email you control), not a personal production seller account with real payouts.
- The app installed from **Play** (the testing track the review uses), not a sideloaded APK, so behavior matches what users get.
- Access to the **core flows** declared in the Play Console questionnaire (e.g. browse, account, messaging, checkout if you claim payments).

## Creating the account

1. Use an email address you can read during review (e.g. `play-review+<project>@yourdomain`).
2. Register in the app (or create the user in your admin tools if you have invite-only signup).
3. Complete **minimum profile steps** required by the app (name, terms acceptance, etc.) so the account is not stuck behind gates.
4. If the app supports **Google Sign-In**, either:
   - create a **Google account** used only for review and link it in-app, or  
   - document that reviewers must use **email/password** for the test account (consistent with what you submit to Google).

## Verification and roles

- Confirm the account can **log in** on a clean device after install from Play.
- If you have **buyer vs seller** modes, either give one account both capabilities (if supported) or provide **two test accounts** and say which is which in Play Console “App access” instructions.
- Ensure the account is **not** blocked, suspended, or pending KYC in a way that prevents testing—use a completed sandbox or test seller profile if Stripe/KYC applies.

## What reviewers should be able to access

Document in **Play Console → App content → App access** (or the review instructions field):

- Login method (email + password, or Google).
- Any **static PIN**, **demo OTP**, or **bypass** you enable **only** for test users (never production secrets).
- Deep links or paths to **paid features** if they are not obvious from the home screen.
- If chat or orders need a **counterparty**, state that reviewers can use a **second test account** or pre-seeded demo data.

## Push notifications

- Reviewers should use a **physical device** or emulator with **Google Play services** if you rely on **FCM**.
- They must **allow notifications** when prompted if push is part of the declared experience.

## Payments (Stripe)

- Prefer **test cards** and a **test/sandbox** backend configuration for review builds, if your architecture allows it.
- If only **live** mode exists, state clearly that reviewers must **not** complete real purchases—or provide a **no-charge** demo path approved by your policy team.

## Credentials handling

- Never commit passwords, OTP seeds, or service account JSON into the repo.
- Rotate review credentials after each major review cycle if they were shared broadly.

## Related Android release notes

- **Play Store release** builds omit `REQUEST_INSTALL_PACKAGES` and the optional APK installer plugin; updates are expected via **Play**. Debug builds may still include the installer for internal sideload testing.
