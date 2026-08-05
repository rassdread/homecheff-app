# Executive Summary — Google Native Sign-In Configuration

**Branch:** `fix/google-login-production-repair`  
**Date:** 2026-08-05  
**Runtime:** Capacitor Android WebView + Capgo `@capgo/capacitor-social-login` (not React Native / Expo / bare WebView-only)

## Verdict

`HOMECHEFF_GOOGLE_NATIVE_SIGNIN_CODE_PASS_OPERATOR_ACTION_REQUIRED`

## Root cause (confirmed)

`resolvePublicNativeGoogleClientId()` used **dynamic** `process.env[name]`. Next.js only inlines `NEXT_PUBLIC_*` via **static** property access. Live Production login/common chunks contained the **warning string** but **zero** `apps.googleusercontent.com` client IDs → Capgo `webClientId` was empty → amber env-var warning in the Android shell.

Vercel already lists `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for Production/Preview; the value never reached the client bundle.

## Code fixes

1. Static `process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` reads
2. Rename Capgo constant to `CAPGO_GOOGLE_SERVER_CLIENT_ID` (clarify ≠ NextAuth web client)
3. Remove Production UI that prints env var names
4. System-browser OAuth fallback via `@capacitor/browser` when native public id missing / Capgo init fails
5. User-safe NL/EN messages; dev-only technical hint

## Operator still required

- Redeploy after merge so NEXT_PUBLIC values bake into the client bundle
- Prefer adding explicit `NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID` (= Firebase web/serverClientId audience, typically 3720…)
- Optionally `GOOGLE_NATIVE_CLIENT_ID` server-only allowlist
- Real Android device Google proof after deploy + APK/WebView reload
