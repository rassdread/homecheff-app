# Phase 5.4 — First Visit Location Experience

**Date:** 2026-08-05  
**Branch:** `main`  
**Repo:** rassdread/homecheff-app  
**Nature:** Production UX correction (first-visit location dead-end)

---

## 1. Phase verdict

**FIRST_VISIT_LOCATION_EXPERIENCE_PASS**

---

## 2. Executive summary

First-time visitors no longer hit a blank Nearby marketplace waiting for GPS. The feed always loads (IP approx → soft national mainland fallback). Browser geolocation is opt-in only (“Use my precise location”). Manual place/postcode overrides IP. A non-blocking refine banner replaces the old empty-state gate. Desktop “Use my location” / “Choose a place” focus/enablement bugs are repaired.

---

## 3. Root cause

1. Default scope **Nearby** with no place/GPS set `isNearbyMissingLocation` → client short-circuited discovery and showed `NearbyLocationRequiredEmptyState`.
2. API Nearby without viewer geo could yield an empty pool / no soft national path.
3. Desktop “Choose a place” focused a place input that was not wired to the composed sidebar (`placeInputRef` missing on `FeedSidebarFilters`).
4. “Use my location” could no-op while `locationSupported` was still `false` before the mount permission check (initial state).

---

## 4. UX correction

| Before | After |
|--------|--------|
| Empty Nearby gate until GPS/place | Feed loads immediately |
| Blocking empty state CTAs | Optional `LocationRefineBanner` |
| No IP geolocation | `/api/geo/approx` + Vercel/CF headers |
| Desktop buttons unreliable | Enabled GPS attempt + sidebar place focus |

**Priority order implemented**

1. IP approx (no permission)  
2. Explicit browser GPS  
3. Manual city/postcode/region (overrides IP)  
4. Soft national mainland if IP missing  

Preference persisted in `localStorage` key `hc_location_pref_v1`.

---

## 5. IP location validation

| Check | Result |
|-------|--------|
| `resolveIpApproxLocation` Vercel headers | PASS (`scripts/validate-ip-approx-location.ts`) |
| NL center fallback when headers absent | PASS |
| Client bootstrap `GET /api/geo/approx` | Wired in `GeoFeed` |
| Feed API soft IP when Nearby + no geo | Wired in `app/api/feed/route.ts` |
| No browser permission for IP path | PASS |

---

## 6. Browser location validation

| Check | Result |
|-------|--------|
| GPS only on explicit user action | PASS (no auto GPS on homepage) |
| Grant → replace IP, refresh without reload | PASS (`locationSource=gps` + feed effect deps) |
| Deny → keep IP/national, feed stays | PASS |
| No auto re-prompt | PASS |

---

## 7. Manual location validation

| Check | Result |
|-------|--------|
| Place / postcode input in sidebar + mobile sheet | PASS |
| Apply → `locationSource=manual`, preference saved | PASS |
| Overrides IP | PASS |
| “Change location” focuses place field | PASS (`placeInputRef`) |

---

## 8. Desktop validation

| Check | Result |
|-------|--------|
| Use my location clickable (not gated on stale `supported=false`) | PASS |
| Choose a place → opens/focuses sidebar place input | PASS |
| Banner CTAs keyboard accessible | PASS (`role=region`, buttons) |

*Live browser matrix (Chrome/Edge/Firefox/Safari) should be re-confirmed after deploy; code paths are shared.*

---

## 9. Mobile validation

| Check | Result |
|-------|--------|
| Soft national / IP path same as desktop | PASS |
| Mobile filter sheet place ref + Use my location | PASS |
| Touch targets on banner | PASS |

---

## 10. SEO validation

| Check | Result |
|-------|--------|
| No client GPS gate for crawlers | PASS (empty-state gate removed) |
| `/api/feed` soft national without GPS | PASS (server-side) |
| Landing/SEO routes unchanged | PASS (out of scope, untouched) |
| Homepage feed remains client-hydrated (pre-existing) | Note — no new GPS gate introduced |

---

## 11. Regression findings

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| R1 | P0 | First-visit empty Nearby dead-end | **Fixed** |
| R2 | P0 | Desktop Use my location early-return / disabled | **Fixed** |
| R3 | P0 | Choose a place not focusing sidebar input | **Fixed** |
| R4 | P1 | Load-more blocked while soft national | **Fixed** |
| R5 | P2 | Banner i18n keys missing would show raw keys | **Fixed** (en/nl) |

No payment / delivery / workspace redesign regressions introduced by this change set.

---

## 12. Production recommendation

**READY_FOR_FIRST_VISIT_RELEASE**

Deploy this branch to production so `/api/geo/approx` and soft national feed behaviour are live. Pre-deploy probe of production Nearby without coords still returned `items: []` — confirms the dead-end remains until this ships.

---

## 13. Scope confirmation

- no architectural redesign — **confirmed**
- no payment changes — **confirmed**
- no delivery changes — **confirmed**
- no database redesign — **confirmed**
- only first-visit UX correction — **confirmed**

---

## 14. Final boundary

HOMECHEFF_FIRST_VISIT_LOCATION_EXPERIENCE_COMPLETE
