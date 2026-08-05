# Current Failure Trace

## Pre-OAuth (Production live) — PASS

| Step | Result |
|------|--------|
| Guest `/login` | Loads; Google button visible |
| `GET /api/auth/providers` | `{ credentials, google }` |
| Click Google | Navigates to `accounts.google.com` |
| `redirect_uri` | `https://homecheff.eu/api/auth/callback/google` |
| PKCE | `code_challenge` + S256 present |
| Console errors | none |

## Reproduced defect class (www)

| Step | Result |
|------|--------|
| `POST https://www.homecheff.eu/api/auth/signin/google` | 302 to Google |
| `redirect_uri` | **`https://www.homecheff.eu/api/auth/callback/google`** (non-canonical) |
| PKCE/state cookies | Host-only on **www** |
| Session/callback cookies | `Domain=.homecheff.eu` |

**Failure mode:** If Google Cloud only allows apex callback → `redirect_uri_mismatch`. If both allowed but user later lands on apex mid-flow → PKCE/state missing → `OAuthCallback`.

## Session cookie name split (code)

- Write path: `next-auth.session-token` (authOptions + native mint)
- Middleware `getToken` default with HTTPS `NEXTAUTH_URL`: `__Secure-next-auth.session-token`
- Effect: middleware JWT reads miss the real session cookie

## Real provider OAuth (account selection → session)

**Not executed** in this phase (no operator Google test account / no deploy of feature branch). Marked OPERATOR ACTION.
