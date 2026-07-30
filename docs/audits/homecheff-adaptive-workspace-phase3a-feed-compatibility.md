# HomeCheff — Phase 3A  
## Workspace Platform Consolidation & Feed Compatibility Audit

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Baseline | `f79103e` — Phase 2G Settings ON freeze |
| Platform Contract | `docs/architecture/homecheff-adaptive-workspace-platform-contract-v1.md` |
| Inventory | `docs/audits/homecheff-adaptive-workspace-phase3a-feed-inventory.json` |
| Decision | **READY FOR PHASE 3B WITH PRECONDITIONS** |

---

## 1. Scope

Consolidate Settings freeze → Platform Contract v1. Audit existing Feed/GeoFeed for sealed-widget SHADOW readiness. **No Feed UI change. No Feed Shadow Root. No Feed modeconfig. No Feed renderer.**

---

## 2–3. Baseline & Settings freeze summary

- Settings ON is the first frozen production Workspace surface.
- Universal contracts U1–U25 and Settings-specific S1–S8 are recorded in Platform Contract v1.
- Phase 2G Chromium + production build evidence remains valid; this phase does not re-freeze Settings.

---

## 4. Workspace Platform Contract v1

See dedicated document. Summary:

- **Universal:** mode fail-closed, single-writer, SSR-first, one RO, sealed child continuity, no Domain State, no global store.
- **Settings-specific:** `settings.hub` allowlist, Settings env, tab ownership.
- **Feed extensions:** sealed `feed.discovery`, continuity counters, non-regression — designed only, not implemented.

---

## 5. Feed topology

```
app/page.tsx (RSC shell + auth hint)
  → HomePageClient (client composition)
       → HomeGeoFeedDynamic (dynamic, ssr:false)
            → GeoFeed (~4290 lines)  ← Domain + layout orchestrator
                 → FeedSidebarFilters / FeedMobileToolbar / FeedMobileFilterSheet (controlled UI)
                 → tiles / displayRows / infinite-scroll sentinel
       → optional composed children: HomeDesktopLeftSidebar, FeedContent, HomeDesktopSidebar
```

- `/api/feed` — `app/api/feed/route.ts` (`force-dynamic`)
- `AppPageChrome` — bottom-nav clearance only; not a Feed layout writer

---

## 6. Current Feed layout writers

| Decision | Current writer |
| --- | --- |
| Composed vs single-column homepage | `HomePageClient` (`homeComposedLayout` prop) |
| Whether GeoFeed renders / which tree | **GeoFeed** (incl. `return null` when composed+mobile) |
| Filter sidebar vs sheet | GeoFeed (`isDesktopSplit`, mobile sheet state) |
| Desktop rail content | HomePageClient children + GeoFeed context |
| Feed width / grid classes | HomePageClient + GeoFeed fallback markup |
| Chrome clearance | AppPageChrome |
| Scroll owner | window (mobile) / `#homecheff-feed-desktop` (desktop) — restore in `AppResumeCoordinator` |

**Finding:** multiple writers; GeoFeed retains veto over render tree. Workspace must not become a competing writer in Phase 3B SHADOW.

---

## 7. Feed primary task

Discover and refine local listings: filter → scroll/compare → open a listing.

- **Primary-stage candidate:** sealed `feed.discovery` hosting GeoFeed as one child.
- Filters remain **inside** sealed GeoFeed for first shadow (not separate Workspace widgets).
- Desktop sidebars remain Feed/Home composition, not Workspace rails, until a later explicit contract.

---

## 8–10. GeoFeed Domain / Presentation / Workspace intent

### Domain State (must stay in GeoFeed)

items, pagination (`feedHasMore`, load-more), loading/refresh/hydrated flags, applied + draft filters, radius/place/coords/locationSource, discoveryFeed, ranking/mixed/display rows, `requestKey` / in-flight key, return-cache payload, inspiratie fetch keys.

### Presentation State (Feed-owned for now)

`sidebarRefineOpen`, `mobileFilterSheetOpen`, `showFilters`, `feedLayoutMode`, `desktopFeedColumns`, `isMobileFeedUi` / `isDesktopSplit`, skeleton/empty branches, mobile filter collapse/pin.

### Workspace-eligible intent (later only)

surface eligibility, primary placement metadata, presentation mode labels, preservation intent — **never** Domain State fields above.

---

## 11–12. Sealed widget assessment & first boundary

**Stance:** GeoFeed **can** be treated as a sealed widget for Phase 3B **SHADOW** if and only if the Shadow Root:

1. mounts GeoFeed exactly once (no remount keys);
2. does not change DOM wrappers in ways that break `#homecheff-feed-desktop` scroll or IntersectionObserver root;
3. does not take layout decisions from `homeComposedLayout`;
4. never sets `renderActivation` / never renders Workspace panels for Feed.

**Chosen first boundary:** **A — one sealed `feed.discovery` widget** wrapping GeoFeed.

Rejected for Phase 3B:

- B (`feed.filters` + `feed.results`) — requires Domainsplit and HOOG filter extraction.
- C (supporting metadata widgets) — premature; would invite rails.

**Why A:** request identity, filters, IO, and scroll are deeply coupled inside GeoFeed; Settings proved sealed hosting works; splitting first would maximize remount/fetch risk.

---

## 13. homeComposedLayout assessment

- **What:** boolean prop on GeoFeed (not a separate module), set by HomePageClient, interpreted by GeoFeed.
- **Ownership:** split — HomePageClient decides to pass children; GeoFeed decides tree / `return null`.
- **Classification for Phase 3B:** **A — retain inside sealed Feed path** (legacy writer). Do not migrate to Workspace. Do not remove.
- Later: may become adapter/expiry after Feed ON design — not Phase 3B.

---

## 14. FeedFilters assessment

- UI components are controlled/presentational (`FeedSidebarFilters` has no domain `useState`).
- All filter Domain State lives in GeoFeed.
- **Classification:** UI = compatible with sealed host; state = Domain — must not move to Workspace.
- Phase 3B: no filter extraction.

---

## 15–17. requestKey / nativePaintKey / prepared batches

| Concept | Reality | Isolation |
| --- | --- | --- |
| `requestKey` | Built in GeoFeed from `buildGeoFeedApiParams` → `params.toString()`; used for dedupe + return-cache | No adaptive-workspace imports; must never include profile/region/slot/panel |
| `nativePaintKey` | **Not implemented** in Feed runtime; exists as Workspace denylist vocabulary | Boundary tests must keep denylist + ensure Feed never imports Workspace to invent it |
| prepared batches | Denylist term; closest real analogues: `displayRows` / `mixedRows` / `rankingResult` | Workspace must not read/serialize these |

---

## 18. Effect & request map

| Kind | Owner | Trigger | Remount risk |
| --- | --- | --- | --- |
| Initial / filter fetch | GeoFeed effect ~1705 | applied* filters + coords + location source | High if GeoFeed remounts |
| Location/profile | GeoFeed | session + profile geocode | Medium |
| Pagination load-more | `loadMoreFeed` + IntersectionObserver | sentinel intersect | Observer recreated when callback identity changes |
| Inspiratie | separate effect | category/q after hydrate | Parallel network |
| Perf mount counter | `[]` on mount | every GeoFeed mount | Instrumentation for Phase 3B |

**Invariant today (perf docs):** `geoFeedMounts = 1`, `feedFetches = 1` on happy path.

---

## 19. Cache & dedupe

- Client: `lib/feed/home-feed-return-cache.ts` keyed by `requestKey` (8 min memory).
- Server: anonymous national origin cache (~45s) + CDN SWC.
- In-flight dedupe via `feedRequestKeyInFlightRef`.
- Workspace must not invalidate or key these caches.

---

## 20–21. Scroll & observers

| Owner | Mechanism |
| --- | --- |
| Mobile scroll | `window` |
| Desktop composed scroll | `#homecheff-feed-desktop` overflow container |
| Restore | `AppResumeCoordinator` (third matchMedia) |
| Infinite scroll | One IntersectionObserver on load-more sentinel (`rootMargin: 480px`) |
| Workspace RO | Must not replace Feed IO; must not add Feed-owned RO |

**Phase 3B constraint:** wrappers must not create a new containing block that breaks sticky rails or changes IO root without explicit Feed ownership.

---

## 22. SSR / hydration

- Page RSC: shell + auth hint only; **no feed payload**.
- GeoFeed: `dynamic(..., { ssr: false })` — client-only feed body.
- Skeleton: `HomeFeedViewportShell` then in-GeoFeed skeleton.
- Narrow viewport seeds `false` then corrects — known paint lag; CSS `lg:` masks most cases.
- Phase 3B Shadow Root: measurement-only; must not gate GeoFeed mount on RO.

---

## 23. Responsive decision matrix

| Decision | Class |
| --- | --- |
| Tailwind `lg:` visual layout | A — CSS may stay internal |
| `useNarrowViewport` / `homeComposedLayout` JS tree | B/D — structural; legacy writer in 3B |
| Mobile filter sheet | A/C — presentation inside sealed GeoFeed |
| Desktop sidebars | B — later possible Workspace rails; deferred |
| AppPageChrome bottom pad | A — chrome path unchanged |
| MatchMedia in AppResumeCoordinator | A — scroll restore; do not duplicate in Workspace |

---

## 24. Single-writer transition matrix (conceptual)

| Decision | Today | Phase 3B SHADOW | Future ON (not now) |
| --- | --- | --- | --- |
| Primary feed placement | HomePageClient + GeoFeed | **Legacy** | TBD sealed host |
| Filter placement | GeoFeed | **Legacy** | TBD |
| Workspace diagnostics | n/a | Workspace (non-writer) | — |
| requestKey | GeoFeed | **GeoFeed only** | GeoFeed only |
| Scroll owner | App/CSS/GeoFeed | unchanged | unchanged |

---

## 25. Compatibility classification

| Subsystem | Class |
| --- | --- |
| GeoFeed (whole) | **3 REQUIRES SHADOW CONTRACT** (+ sealed hosting with constraints) |
| FeedFilters UI | **2 COMPATIBLE WITH READ-ONLY ADAPTER** (state stays in GeoFeed) |
| Result grid / tiles | **1 DIRECTLY COMPATIBLE** |
| Infinite scroll | **2** (Feed-owned IO) |
| Return cache / requestKey | **5 BLOCKED** from Workspace |
| Prepared/display rows | **5 BLOCKED** from Workspace |
| Empty/loading UI | **1 / 2** |
| Search/radius Domain | **5 BLOCKED** from Workspace |
| Desktop sidebars | **6 DEFERRED** as Workspace widgets |
| Mobile filter sheet | **2** inside sealed |
| homeComposedLayout | **3** retain legacy; do not migrate in 3B |
| `/api/feed` | **1** opaque data source |
| Performance instrumentation | **2** read-only counters for 3B |

---

## 26–27. Performance baseline & non-regression

### Documented baselines (verify before claiming “current”)

| Source | Notes |
| --- | --- |
| Charter historical | LCP ~3844 / FCP ~2976 / first tile ~7364 / fetch ~7092 / shell-usable ~8213 — **stale vs Wave 2** |
| Wave 2 local (`docs/audits/homecheff-performance-phase3fw2-before-after.md`) | Desktop cold first tile **~2103 ms**; mobile cold **~1589 ms**; HTML ~26 KB; invariants feedFetches=1, geoFeedMounts=1 |
| Phase 3F.7 | Feed API CDN HIT ~111 ms warm p50; homepage render was bottleneck |

**Re-measure before Feed SHADOW merge:** cold/warm first tile, feed fetch count, GeoFeed mounts, console errors on `/`.

### Non-regression (hard rules for 3B+)

Workspace must not cause: extra Feed API/Prisma call; extra GeoFeed mount/unmount; extra FeedFilters instance; extra Feed IO/RO; extra geolocation; filter re-init; pagination/batch/cache/scroll reset; measurement-gated delay; new hydration mismatch.

---

## 28–30. Blockers, hardening, widget boundary

### Direct blockers for Feed **ON**

1. GeoFeed is still the layout orchestrator (`return null`, context host).
2. Multiple viewport writers.
3. Filter Domain State extraction risk.

### Not blockers for Feed **SHADOW** (diagnostics-only)

If preconditions below are enforced.

### Required hardening before / in early 3B

1. Stable child host pattern (Settings-proven) around GeoFeed.
2. Continuity counters (mounts, fetches, requestKey transitions).
3. Wrapper CSS neutrality review (`min-h-0` / overflow) before any ON.
4. Explicit documentation that `homeComposedLayout` stays legacy.

---

## 31–33. Phase 3B design, tests, acceptance

### Proposed Phase 3B — FEED SEALED WIDGET SHADOW ROOT

- Local Feed Shadow Root on homepage Feed path only
- Legacy writer unchanged; `renderActivation = false`
- GeoFeed mount count = 1
- One Workspace container RO; Feed IO unchanged
- `feed.discovery` manifest metadata / fixture diagnostics
- No UI change; no request identity change; no filter extraction
- OFF/SHADOW only; ON fail-closed for Feed

### Preconditions (must hold)

1. Shadow wrapper does not remount GeoFeed on profile/size.
2. No Feed modeconfig enabling ON.
3. No Workspace fields in requestKey/cache keys.
4. Observer ownership documented and verified (1 Workspace RO, 1 Feed IO).
5. Baseline counters recorded before/after SHADOW.
6. Settings freeze suites remain green.

### Phase 3B acceptance (preview)

- Visual parity with pre-SHADOW
- geoFeedMounts=1, feedFetches unchanged on idle
- requestKey stable across measurement
- No hydration warnings
- Settings freeze intact

---

## 34. Rollback assumptions

SHADOW removal = remove wrapper / set Feed mode off (when introduced) → redeploy. No DB. No cache migration. GeoFeed state is session/client — no Workspace persistence.

---

## 35–36. Risks & open questions

**Risks:** wrapper breaks desktop scroll container; IO root change; accidental remount via React tree; duplicate viewport logic disagreement blank column.

**Open questions:**

1. Exact mount point for Shadow Root: around `HomeGeoFeedDynamic` vs inside `HomePageClient`?
2. Will `nativePaintKey` ever be implemented in Feed, or remain denylist-only?
3. Expiry plan for `homeComposedLayout` after sealed hosting exists?
4. Production RUM LCP/FCP still not in-repo — need Preview re-measure.

---

## 37. Repository hygiene

Only Phase 3A docs/tests/validator/scripts touched. Unrelated dirty/untracked files left alone. No Feed production code changes. Phase 2G freeze record unchanged.

---

## 38. Architecture health (Phase 3A)

| Dimension | Score |
| --- | --- |
| Platform Contract | 9 |
| Settings Freeze Integrity | 10 |
| Feed State Isolation | 9 |
| Sealed Widget Compatibility | 7 |
| Request Identity Safety | 9 |
| Scroll Continuity Readiness | 7 |
| Observer Ownership | 8 |
| SSR/Hydration Readiness | 8 |
| Performance Readiness | 7 |
| Single Writer Readiness | 7 |
| Test Coverage | 8 |
| Architectural Drift | 9 |
| Rollback Readiness | 9 |

**Feed Shadow Root readiness: ~70%** (preconditions close the gap).

---

## Final readiness decision

# READY FOR PHASE 3B WITH PRECONDITIONS

Preconditions listed in §31–32. Not READY without those. Not “unconditional READY” because GeoFeed remains an active layout orchestrator and wrapper risks are real until proven in 3B instrumentation.
