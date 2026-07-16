# P0 — Native Google configuration recovery

**Date:** 2026-07-17  
**Branch:** `identity/phase2-auth-foundation`

## 1. Root cause

Production web Google was restored with:

`GOOGLE_CLIENT_ID` = **6156…** (web OAuth)

while Android Capgo still uses:

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` = **3720…** (Firebase/native audience)

**Deployed** `lib/auth/native-google-session.ts` (`origin/main`) still contained the old gate:

```ts
if (publicClientId && publicClientId !== audience) {
  // → google_client_id_mismatch
}
```

Call path:

1. `NativeGoogleSignInButton` → `POST /api/auth/native/google`
2. `createSessionFromNativeGoogleIdToken` → `resolveGoogleVerifyAudience()`
3. Equality fail → `503` `google_client_id_mismatch`
4. UI: `"Google configuratie mismatch. Controleer server-omgeving (GOOGLE_CLIENT_ID)."`

This belongs to the **old** architecture (`GOOGLE_CLIENT_ID === NEXT_PUBLIC_GOOGLE_CLIENT_ID` mandatory). It conflicts with the approved split (web ≠ native).

## 2. Files modified (this commit only)

| File | Change |
|------|--------|
| `lib/auth/google-oauth-clients.ts` | **New** — native audience allowlist (+ unused web helpers kept for validators) |
| `lib/auth/native-google-session.ts` | Remove equality; verify idToken against native audiences only |
| `lib/native/google-sign-in-config.ts` | Capgo id from public native/legacy env (never server web id) |
| `components/auth/NativeGoogleSignInButton.tsx` | Clearer error copy for native config |
| `scripts/validate-google-oauth-client-separation.ts` | Unit validator |
| `env/.env.append.example` | Document web/native env names |

**Not modified:** `lib/auth.ts` (web GoogleProvider still uses `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` only).

## 3. Exact code removed

- `resolveGoogleVerifyAudience()` equality: `publicClientId !== audience`
- Return path `google_client_id_mismatch` when web ≠ public native id
- Native verify audience sourced from `GOOGLE_CLIENT_ID` (web)

## 4. Exact code added

- `resolveNativeGoogleAudiences()` allowlist: `GOOGLE_NATIVE_CLIENT_ID`, `GOOGLE_NATIVE_CLIENT_IDS`, `NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID`, legacy `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `verifyIdToken({ audience: audiences })` — no web client required
- Fail closed with `google_native_not_configured` when allowlist empty

## 5. Reasoning

After Production restored **6156** for web, native **3720** tokens are correctly rejected by the obsolete equality check. Removing that check restores Android without changing web OAuth or env.

With existing Production `NEXT_PUBLIC_GOOGLE_CLIENT_ID=3720…`, server can verify native tokens after this code is deployed — **no Production env change required** for the legacy public fallback.

## 6–7. Validation / regression

| Check | Result |
|-------|--------|
| `validate-google-oauth-client-separation` | 8/8 PASS |
| `validate-auth-origin-resolution` | PASS |
| `npm run smoke-check` | PASS |
| Web `lib/auth.ts` GoogleProvider | Unchanged (GOOGLE_CLIENT_*) |
| Credentials path | Untouched |

## 8–9. Git

See commit after validation.

## 10. Confirmation

Only obsolete native Google configuration validation (+ supporting native config/docs/validator) changed. Web Google OAuth registration path unchanged.
