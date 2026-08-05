# Security Review

| Control | Status |
|---------|--------|
| OAuth state | Present (NextAuth) |
| PKCE S256 | Present |
| CSRF | next-auth.csrf-token |
| Callback allowlisting | resolveSafeAuthRedirect + production origin allowlist |
| Secure cookies (prod) | Secure + HttpOnly + SameSite=Lax |
| Open redirect | sanitize + resolveSafeAuthRedirect; absolute URLs rejected in sanitize |
| Account linking | Custom email sync; no silent reassignment of Google sub across users |
| Secrets in logs | Client id preview only; no tokens/secrets |
| Scopes | openid email profile (least privilege for profile) |
| No auth ownership by Workspace/GeoFeed | Confirmed |

Did **not** loosen cookie security for Preview. Preview remains host-only.
