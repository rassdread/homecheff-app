# HOMECHEFF — Google Auth Production Release

**Date:** 2026-08-06  
**Merge SHA:** `5b1865411d4bb22784a9c1ae5d500c0b65575efc`  
**Production deployment:** `dpl_zRG9nbxeYafiuk5nYHdncD6jZPGr`  
**Canonical host:** https://homecheff.eu  

## Verdict

`HOMECHEFF_GOOGLE_AUTH_PARTIAL`

`ANDROID_NATIVE_PROOF_REQUIRED`

`WEB_GOOGLE_INFRA_PASS`

`WEB_GOOGLE_INTERACTIVE_OPERATOR_PROOF_REQUIRED`

`PRODUCTION_NOT_FROZEN_FULL` — evidence freeze committed; behavioural success incomplete until interactive web + real Android proofs pass.

## What shipped

- Non-fast-forward merge of `fix/google-login-production-repair` into `origin/main`.
- Production deploy Ready and aliased to `homecheff.eu`.
- Live proofs: www→apex before OAuth; Google OAuth start uses apex `redirect_uri` + state + PKCE + openid/email/profile; client bundle inlines native public client pattern; Production login HTML does not show raw env-var warning.
- Email/credentials provider remains listed alongside Google.

## What remains

1. Operator-completed interactive Google web login matrix on Production (account chooser → session → return journeys → logout/relogin).
2. Android build: install JDK, place `android/app/google-services.json` for `eu.homecheff.mobile` / Firebase `homecheff-cbb05`, Capacitor sync, new APK/AAB.
3. Real-device Capgo native Google chooser → `/api/auth/native/google` → session continuity proof.
4. DB integrity check on approved test identities after interactive tests.
5. Full freeze elevation to `HOMECHEFF_GOOGLE_AUTH_PRODUCTION_SUCCESS` only after (1)–(3) pass.

## Non-goals preserved

No Workspace / GeoFeed / Controlled Host / commerce / SEO / schema changes in this promotion.
