# Formal code review (independent)

## Root-cause fixes verified in merge tree

1. www OAuth cannot create non-canonical callback/PKCE split — middleware forces www/.nl → apex.
2. Middleware `getToken` uses `NEXTAUTH_SESSION_COOKIE_NAME` (`next-auth.session-token`).
3. Intended return URLs survive via social-success / sanitize relative-only paths.
4. Public native client uses static `process.env.NEXT_PUBLIC_*` reads.
5. Production UI no longer surfaces raw env-var errors (dev-only string may remain in bundle text; not shown on login HTML).
6. Native missing-config uses system-browser OAuth fallback.
7. Web NextAuth client vs Capgo serverClientId remain separated in code roles.
8. Native sessions minted only via `POST /api/auth/native/google` server path.

## Scope discipline

Auth-only promotion. No Workspace / GeoFeed / commerce / SEO / schema edits in merge parents beyond prior auth branch contents.
