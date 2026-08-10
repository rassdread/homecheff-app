# HomeCheff Production — Google Auth Incident (2026-08-10)

**Status:** Forensic + smallest safe fix shipped for certification  
**Verdict until HC-1…HC-8 GREEN:** **NO-GO** SP.2B / Unified Branding / SP.2C

## Production truth (before fix)

| Field | Value |
|---|---|
| Deployment | `dpl_F1nnyTfWpxTFiGrbwroDYkCWfvAX` |
| SHA | `efef883818bf` (SP.2B.5 merge) |
| Architecture | NextAuth JWT + Google + Credentials |
| Session cookie | `next-auth.session-token`, `Domain=.homecheff.eu`, `Secure`, `SameSite=Lax` |
| OAuth callback | `https://homecheff.eu/api/auth/callback/google` (verified) |
| NEXTAUTH_URL | `https://homecheff.eu` (verified via `/api/debug-session`) |

## Flow classification

| Step | Result |
|---|---|
| A Google authorization request | **PASS** (Playwright → accounts.google.com, correct `redirect_uri`) |
| B Google OAuth callback | **NOT REACHED** in automation (requires human Google account) |
| C User lookup/create/link | DB-dependent; vulnerable to P2024 |
| D Session creation | Depends on C + jwt callback DB |
| E Cookie persistence | Mixed Domain: csrf/callback `.homecheff.eu`; state/pkce were host-only `__Secure-*` |
| F Redirect callback | Forces `/auth/social-success` for Google |
| G Middleware | No auth wall on `/login`; www/.nl → eu canonicalize only |
| H Page auth detection | Login authenticated `useEffect` could re-`replace` on session object churn |
| I Client auth state | SessionProvider refetch 5m |
| J SSO/silent interaction | **PASS** — HC is IdP; silent without session → product `login_required` (not HC login loop) |

## Exact loop (observed pattern)

Not a clean A→B→C→A HTTP cycle in automation.

Closest Production-backed failure mode:

1. `/login` → Google authorize (**PASS**)
2. `/api/auth/callback/google` → `signIn` / `jwt` DB work
3. Concurrent Production load hits **Prisma P2024** (`connection_limit: 5` pool timeouts in logs)
4. Session mint fails or social-success cannot see session
5. User lands back on `/login` or spinning success page → retry → appears as reload/redirect loop

Secondary client loop risk:

`/login` (authenticated) → `router.replace(target)` re-fired on every `session` object identity change → replace churn.

## SP.2B regression

| Change | Causes HC Google loop? |
|---|---|
| SP.2B.5 silent `login_required` | **No** — product callback only |
| SP.2B.3 account selection / login prompt | **Unlikely alone** — only adds `prompt=select_account` for SSO entry |
| SP.2B.6 Growth env on HC | **No code change** to Google auth (env-only Growth client) |

HC is **not** treated as an SSO consumer for its own login.

## Root cause verdict

- **ROOT CAUSE:** Auth-critical Prisma work during Google callback under Production connection-pool pressure (P2024), so Google can authorize but HomeCheff fails to stably mint/read the session.
- **SECONDARY:** Mixed OAuth cookie Domain policy (state/pkce host-only vs session Domain=.homecheff.eu); login authenticated redirect effect depending on whole `session` object.
- **REGRESSION INTRODUCED BY:** Not uniquely SP.2B SSO issuer logic; pool pressure is pre-existing serverless/Neon posture, exposed during auth.
- **GOOGLE AUTH ITSELF:** Start/config PASS
- **ACCOUNT LINK:** Not mutated in forensics
- **SESSION CREATION / COOKIE:** Suspected fail-after-Google under P2024
- **SSO INTERACTION:** Not the HC self-login loop
- **DATABASE INTEGRITY / DATA LOSS:** None observed; no account writes during forensics
- **SECURITY IMPACT:** Low for this fix (retries + cookie align + pool param); no shared product session cookie introduced

## Smallest safe fix

1. Neon pooler URL normalization: `pgbouncer=true&connection_limit=1` when using `-pooler` host
2. `withPrismaRetry` on Google `signIn` sync + jwt user lookup
3. Align `state` / `pkceCodeVerifier` cookies with session Domain policy
4. Login authenticated redirect: once per user id; never replace onto `/login`
