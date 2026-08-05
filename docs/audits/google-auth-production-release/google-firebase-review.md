# Google / Firebase configuration review

## Web OAuth (NextAuth)

| Item | Status |
|------|--------|
| Canonical origin `https://homecheff.eu` | Confirmed live |
| Callback `https://homecheff.eu/api/auth/callback/google` | Confirmed in providers + OAuth start `redirect_uri` |
| www redirects to apex before OAuth | Live 307 `www` → apex |
| Scopes | Live OAuth start: `openid email profile` |
| Consent | Operator-owned; not re-audited in console this session |

## Android / Firebase

| Item | Status |
|------|--------|
| Expected Firebase project | `homecheff-cbb05` (operator target) |
| Expected package | `eu.homecheff.mobile` (matches `android/app/build.gradle`) |
| Capgo SocialLogin | Present in dependencies + native config code |
| `google-services.json` in release worktree | **MISSING** at `android/app/google-services.json` |
| Debug/release/Play SHA fingerprints | Not re-verified in Google console this session |
| client_type 3 web client vs Capgo serverClientId | Code expects Web client as Capgo `serverClientId`; operator must ensure Firebase/Google Cloud alignment |
| Stale `com.homecheff.app` | Non-blocking warning — do not delete unless proven unused |

## Operator actions still required for Android proof

1. Place current `google-services.json` for `eu.homecheff.mobile` into `android/app/`.
2. Confirm SHA-1/SHA-256 for the distributed signing key (Play App Signing upload + app signing certs as applicable).
3. Build new APK/AAB from merge `5b18654…` after Production env bake-in.
4. Real-device Capgo Google chooser proof.
