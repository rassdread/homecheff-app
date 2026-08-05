# Executive Summary — Google Login Production Repair

**Branch:** `fix/google-login-production-repair`  
**Date:** 2026-08-05  
**Live baseline tested:** https://homecheff.eu (dpl_CdRB2YgtsLmCFCTtBRia7sKPaP2y)

## Verdict (pre-deploy)

`HOMECHEFF_GOOGLE_LOGIN_CODE_PASS_OPERATOR_ACTION_REQUIRED`

## What was wrong

1. **www.homecheff.eu did not redirect to apex** → Google OAuth started on www used `redirect_uri=https://www.homecheff.eu/api/auth/callback/google` with **host-only** PKCE/state cookies, while Production canonical host is `homecheff.eu`. This is a classic `redirect_uri_mismatch` / OAuthCallback failure class.
2. **Middleware `getToken` used the default `__Secure-next-auth.session-token` name** while the app writes `next-auth.session-token` → server middleware could not see the session (split-brain vs `getServerSession`).
3. **Google provider ignored `GOOGLE_WEB_*` helpers** (legacy-only wiring) despite Phase-2 client separation.
4. **Google sign-in discarded `callbackUrl`** (always `/auth/social-success`) → return journey lost for Create/Messages/Profile entry points.
5. **`sanitizePostAuthRelativeUrl` stripped hosts from absolute URLs** (path kept) — hardened to relative-only.

## What still requires the operator

- Confirm Google Cloud authorized redirect URI includes **exactly** `https://homecheff.eu/api/auth/callback/google` (and optionally www only if kept live — after this fix www redirects to apex).
- Add `GOOGLE_CLIENT_ID` to Vercel **Development** (present in Production + Preview; missing in Development).
- Complete **real** Google account proof after Preview/Production deploy of this branch (not done here — no deploy per mission rules).

## Pre-OAuth production proof (live)

- `/api/auth/providers` includes `google`
- Button “Log in with Google” works (desktop + phone)
- Authorization URL uses correct apex `redirect_uri`, PKCE S256, state present
- 0 console errors on login page during pre-OAuth
