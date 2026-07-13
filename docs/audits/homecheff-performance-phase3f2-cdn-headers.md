# Phase 3F.2 — CDN Cache Headers

**Branch:** `performance/phase3f-anonymous-cache`

## Policy (Tier A)

| Header | Value |
|--------|-------|
| `Cache-Control` | `public, max-age=0, must-revalidate` |
| `CDN-Cache-Control` | `public, s-maxage=45, stale-while-revalidate=90` |
| `Vercel-CDN-Cache-Control` | same as CDN-Cache-Control |
| `Vary` | `Origin` (no Cookie) |
| `X-Feed-Cache-Tier` | `A` |

## Non-Tier-A

- **B** — `private, max-age=0, must-revalidate`; no CDN headers
- **C** — `private, no-store`; `Vary: Cookie` when session
- **D** — `private, no-store, no-cache`

## Set-Cookie

Feed route does not set cookies on Tier A responses. Session resolution runs but anonymous requests remain Tier A.

## Validator

`npx tsx scripts/validate-feed-cdn-headers-phase3f.ts`
