# Phase 3F.5 — Anonymous Session Fast-Path Implementation

**Branch:** `performance/phase3f-first-paint`  
**Status:** implemented (Wave 1, uncommitted)

---

## Problem

GeoFeed blocked first fetch on `sessionStatus === 'loading'` (~50–200 ms) even for visitors with no session.

---

## Solution

1. **`app/page.tsx`** — `getServerSession(authOptions)` derives `ssrAuthHint`:
   - `'anonymous'` when no user on server
   - `'authenticated'` when user present
   - `undefined` on SSR error (conservative fallback)

2. **`lib/feed/anonymous-session-fast-path.ts`** — gate helpers:
   - `shouldBypassSessionLoadingGate` — true only when loading + SSR anonymous
   - `isAwaitingSessionResolution` — replaces raw `sessionStatus === 'loading'` in feed gate

3. **`GeoFeed.tsx`** — updated `feedStartupBlocked`:

```typescript
const feedStartupBlocked =
  isAwaitingSessionResolution(sessionStatus, ssrAuthHint) ||
  (!!session?.user && bootstrapStatus === 'loading' && nearbyScopeAwaitingProfileCoords);
```

---

## Security

- Server `getServerSession` is source of truth for fast-path eligibility
- No client cookie sniffing (HttpOnly session tokens not readable in JS)
- Logged-in users (`ssrAuthHint === 'authenticated'`) remain gated until client session resolves
- Nearby scope bootstrap gate preserved for authenticated users
- Feed API still enforces auth server-side on every request

---

## Observability

When `NEXT_PUBLIC_FEED_PERF_BASELINE=1` or development:

- Milestone: `session:anon-fast-path`
- `window.__hcFeedPerfReport().sessionFastPath`:
  - `anonFastPathUsed`
  - `sessionGateBypassed`
  - `sessionResolvedBeforeFetch`
  - `feedFetchReason`

No sensitive values logged.

---

## Validator

`npx tsx scripts/validate-anonymous-session-fast-path-phase3f5.ts` — **10/10 pass**
