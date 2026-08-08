# Phase I.2 — HomeCheff SSO Authorize + Exchange Backend

**Status:** Implemented (feature-flagged)  
**Date:** 2026-08-08  
**Repo:** `homecheff-app`  
**Routes:**
- `POST /api/identity/v1/sso/authorize`
- `POST /api/identity/v1/sso/exchange`

## Gate

Both endpoints require:

```
CENTRAL_IDENTITY_ENABLED=true
CENTRAL_SSO_ENABLED=true
```

Otherwise **404** `{ code: "SSO_DISABLED" }` — no codes issued, minimal audit noise.

Production default: **OFF** (env absent).

## PKCE decision (final)

**Required S256** for all authorize/exchange flows (matches design).  
Authorize stores `codeChallenge`; exchange verifies `BASE64URL(SHA256(codeVerifier))`.

## Client auth

Exchange: `Authorization: Bearer <GROWTH_SSO_CLIENT_SECRET>`  
Optional: `X-SSO-Client-Id: <GROWTH_SSO_CLIENT_ID>`  
Rotation: `GROWTH_SSO_CLIENT_SECRET_PREVIOUS` accepted briefly.

## Code

- 256-bit `randomBytes(32)` → base64url  
- Hash-at-rest: `SHA-256(pepper + ":" + code)` hex  
- TTL: **60s**  
- Atomic consume: `updateMany` where `usedAt IS NULL AND expiresAt > now`  
- Replay → `USED_CODE` (409)

## Redirect allowlist

Exact URI match only. Env `GROWTH_SSO_REDIRECT_URI` (CSV) or defaults:
- production: `https://growth.homecheff.eu/auth/sso/callback`
- development: `http://localhost:3000/auth/sso/callback`
- preview: **no default** — must set explicit stable alias (no `*.vercel.app` wildcard)

## Error → HTTP

| Code | HTTP |
|------|------|
| SSO_DISABLED | 404 |
| UNAUTHORIZED / UNAUTHORIZED_CLIENT | 401 |
| INVALID_REQUEST / INVALID_CODE / AUDIENCE_MISMATCH / REDIRECT_MISMATCH / PKCE_FAILED | 400 |
| USED_CODE | 409 |
| EXPIRED_CODE | 410 |
| ACCOUNT_DISABLED | 403 |
| RATE_LIMITED | 429 |
| INTERNAL_ERROR | 500 |

## Rate limits (per minute, in-memory)

| Scope | Limit |
|-------|------:|
| authorize / IP | 30 |
| authorize / user | 10 |
| exchange / IP | 20 |
| exchange / client | 60 |
| failed exchange / IP | 15 |

## Audit actions

`SSO_CODE_ISSUED` · `SSO_CODE_ISSUE_FAILED` · `SSO_EXCHANGE_SUCCESS` · `SSO_EXCHANGE_FAILED` · `SSO_REPLAY_REJECTED` · `SSO_CLIENT_REJECTED`

## Claims (exchange success)

`iss`, `aud`, `centralUserId`, `email`, `emailVerified`, `displayName`, `image`, `accountStatus`, `issuedAt`  
Never: password hash, OAuth tokens, NextAuth session, marketplace private data.

## State

Opaque; carried through authorize response; Growth validates in I.3.

## Tests

`npm run test:phase-i2-sso`
