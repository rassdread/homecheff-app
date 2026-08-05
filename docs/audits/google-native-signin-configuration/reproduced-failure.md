# Reproduced Failure

## Observed (Production live JS, dpl_CdRB2Yg…)

- Login common chunk contains literal `NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID` (warning copy)
- **0** `apps.googleusercontent.com` occurrences in login/common client chunks
- Native shell (`preferNative`) → `configBlocked` → button disabled + env-var amber text

## Device matrix

| Runtime | Status |
|---------|--------|
| Capacitor Android (affected) | FAIL pre-fix (empty Capgo id) |
| Chrome mobile web | PASS web OAuth path (separate) |
| Desktop web | PASS regression control |
| iOS native | N/A (no iOS shell claimed) |

Real Google account chooser on device: **OPERATOR after redeploy**
