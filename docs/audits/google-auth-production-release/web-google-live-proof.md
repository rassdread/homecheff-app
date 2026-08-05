# Web Google login proof

## Automated / infra (PASS)

- Providers: Google + credentials on apex.
- POST `/api/auth/signin/google` → `accounts.google.com` with:
  - `redirect_uri` = apex callback
  - `state` present
  - PKCE `code_challenge` + S256
  - scopes `openid email profile`
- PKCE/state cookies: `__Secure-next-auth.state`, `__Secure-next-auth.pkce.code_verifier` (HttpOnly, Secure, host-scoped); callback-url cookie set.
- www cannot start OAuth on www host (307 to apex first).
- Login page: Google affordance present; raw `NEXT_PUBLIC_*` warning absent.

## Interactive operator matrix (NOT PERFORMED this session)

Gate 12 items 1–10 (first-time/returning/email-collision/Create/Messages/Profile/listing/chat/logout) require an operator-approved Google account in a real browser. Not executed here. Do not claim `WEB_GOOGLE_LOGIN_PASS` until completed.

## Evidence policy

No emails, tokens, cookie values, or client IDs stored.
