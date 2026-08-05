# Authentication Architecture

## Ownership (SSOT)

| Concern | Owner |
|---------|--------|
| Web OAuth + credentials | `lib/auth.ts` (`authOptions`) + `app/api/auth/[...nextauth]/route.ts` |
| Google user upsert / Account link | `lib/auth/google-account-sync.ts` + `link-google-oauth-account.ts` |
| Origin / cookie domain / safe redirect | `lib/auth-origin.ts` |
| Web vs native Google clients | `lib/auth/google-oauth-clients.ts` |
| Session cookie name | `lib/auth/session-cookie-name.ts` |
| Post-auth landing | `app/auth/social-success/*` + `lib/auth/post-auth-redirect.ts` |
| Pending intents (Create/chat) | `lib/onboarding/pending-intent.ts` |

## Stack

- next-auth **4.24.x** (JWT strategy, no PrismaAdapter)
- GoogleProvider when web client resolved
- Credentials provider for email/username
- `trustHost: true`
- Production session cookie domain: `.homecheff.eu` (Growth SSO intent); Preview/dev: host-only

## No split-brain with growth_session / studio_session

Those cookies are **not** implemented in this HomeCheff codebase (Phase 30 sibling-product docs only). HC auth SSOT remains NextAuth JWT cookie `next-auth.session-token`.

## Middleware

Not a login gate. Handles host canonicalisation, CORS, language, suspended mutation block (now with correct cookie name).
