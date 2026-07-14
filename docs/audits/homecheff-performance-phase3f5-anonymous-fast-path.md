# Phase 3F.5 — Anonymous Fast Path

**Branch:** `performance/phase3f-first-paint`  
**Baseline:** main @ `5fa92ed` (3F live, feed CDN ~111 ms warm)  
**Modus:** ~~read-only~~ → **Wave 1 implemented** (see `homecheff-performance-phase3f5-anonymous-fast-path-implementation.md`)

---

## Doel

Anonieme homepage-bezoekers mogen **niet wachten** op auth, profile, bootstrap of achtergrondproviders vóór de eerste feed-fetch en eerste tile.

---

## Huidige request-graph (anonymous)

```text
HTML download (4,25 MB, ~777 ms TTFB prod)
  → hydrate SessionProvider + 12 nested providers
  → HomePageClient: viewport unresolved → skeleton (geen GeoFeed)
  → useLayoutEffect: viewport resolved → GeoFeed mount
  → sessionStatus === 'loading' → feedStartupBlocked (GEEN fetch)
  → /api/auth/session resolves → fetch /api/feed
  → feedHydrated → eerste tile
```

**API-feed is klaar in ~111 ms (CDN HIT).** De vertraging zit vóór en na de fetch in client/SSR.

---

## Session & auth

| Component | Path | Anonymous impact | Fast-path actie |
|-----------|------|------------------|-----------------|
| `SessionProvider` | `components/Providers.tsx` L43–46 | **Blokkeert** — GeoFeed wacht op `sessionStatus !== 'loading'` | Treat `unauthenticated` as resolved immediately when no session cookie hint |
| `getServerSession` | **Niet op homepage** | Geen SSR-session | ✅ al goed |
| `/api/auth/session` | next-auth client | ~50–200 ms extra vóór feed fetch | Parallel start feed fetch voor anonymous |
| `SessionGuard` | `components/SessionGuard.tsx` | Geen render block | Geen wijziging |
| Auth gates (SoftAuth, AuthCompletion, …) | Suspense overlays | Geen block | Geen wijziging |

**GeoFeed gate** (`components/feed/GeoFeed.tsx` L1211–1215):

```typescript
const feedStartupBlocked =
  sessionStatus === "loading" ||
  (!!session?.user && bootstrapStatus === "loading" && nearbyScopeAwaitingProfileCoords);
```

Voor **anonymous national**: alleen `sessionStatus === 'loading'` is relevant.

---

## Bootstrap & profile

| Provider | Path | Anonymous impact | Fast-path actie |
|----------|------|------------------|-----------------|
| `UserBootstrapProvider` | `components/user/UserBootstrapProvider.tsx` | **Geen** voor anonymous | Geen wijziging |
| Profile location idle fetch | GeoFeed L1472–1492 | **Geen** — geen user | Geen wijziging |
| `HcpRewardProvider` | `components/gamification/HcpRewardProvider.tsx` | **Geen** — geen gamification fetch | Defer voor logged-in only |
| `CommsUnreadProvider` | `components/communication/CommsUnreadProvider.tsx` | **Geen** | Defer voor logged-in only |

---

## Viewport & geo

| Hook | Path | Anonymous impact | Fast-path actie |
|------|------|------------------|-----------------|
| `useNarrowViewportResolved` | `hooks/useNarrowViewport.ts` | **Blokkeert GeoFeed mount** tot `useLayoutEffect` | SSR default breakpoint of CSS-only layout zonder JS gate |
| `useGeolocation` | GeoFeed L1517–1520 | **Geen** — auto-GPS uit op homepage | ✅ al goed |
| `readNativeFeedPrefs` / localStorage | GeoFeed L1262+ | Sync na session; geen block | OK |

**HomePageClient** (`components/home/HomePageClient.tsx` L153–166): toont `HomeFeedViewportShell` skeleton tot `viewportResolved`.

---

## Preferences, cookies, flags

| Mechanism | Impact anonymous | Actie |
|-----------|------------------|-------|
| Feed surface localStorage | Post-session sync | Defer |
| Native feed prefs | Capacitor only | Geen homepage web impact |
| `FEED_PERF_TIMING` / perfProbe | Dev only | Geen prod impact |
| Capacitor push/update gates | Suspense, geen feed block | OK |
| ISR `revalidate=60` | SSR cache shell | Behouden |

---

## Voorgestelde anonymous fast-path (implementatie)

### Tier 1 — GO (laag risico)

1. **Optimistic anonymous session** — als geen `next-auth.session-token` cookie: behandel als `unauthenticated` zonder `/api/auth/session` wait voor feed start.
2. **Parallel fetch** — start `/api/feed?scope=national&…` tegelijk met session check wanneer cookie absent.
3. **Viewport SSR default** — mount GeoFeed direct met server-guess (`mobile` via UA of CSS grid zonder JS gate).

### Tier 2 — GO met parity check

4. **Logged-in path unchanged** — session + bootstrap blijven blocking voor nearby-without-coords.
5. **Return-tab cache** — `peekFreshHomeFeedReturnCache()` al aanwezig (GeoFeed L1705+); versterk voor anonymous cold.

### Tier 3 — defer (geen block)

6. Lazy-load `HcpRewardProvider`, `CommsUnreadProvider` subtree voor logged-in only.
7. Defer onboarding tours, community pulse, sidebar widgets (already mostly deferred).

---

## Verwachte winst (anonymous)

| Optimalisatie | FP / first tile | Risico |
|---------------|-----------------|--------|
| Skip session wait | **50–200 ms** | Laag — parity met Tier A anon feed |
| Viewport gate removal | **100–300 ms** | Medium — layout flash |
| Parallel feed + session | **50–150 ms** | Laag |
| **Totaal fast-path** | **~200–500 ms** vóór feed fetch start | — |

---

## GO/HOLD

| Onderdeel | Besluit |
|-----------|---------|
| Optimistic anonymous session | **GO** |
| Parallel feed fetch | **GO** |
| Viewport SSR default | **GO** (met CSS fallback) |
| Provider defer (logged-in only) | **GO** |
| Wijzig auth security model | **HOLD** |

---

## Validators na implementatie

- `validate-feed-cache-safety-phase3b.ts` — anonymous blijft Tier A
- `validate-feed-contract-phase3a.ts` — single initial fetch guard
- Nieuwe validator: anonymous fast-path mag geen extra feed fetch veroorzaken
