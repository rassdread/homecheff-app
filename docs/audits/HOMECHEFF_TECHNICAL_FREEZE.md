# HomeCheff Technical Freeze — Marketplace Core

**Status:** `TECHNICAL_FREEZE_ACTIVE`  
**Mode:** Launch / Observation (not build/repair)  
**Recorded:** 2026-08-10  

## Production baseline

| Field | Value |
|---|---|
| `origin/main` SHA | `173e64dd9804d801c9e1feda47171476feec1112` |
| Production deployment | `dpl_DwYUa6CYKQWHdYS4PRyMSyCpVSPX` |
| Alias | https://homecheff.eu (also homecheff.nl) |
| Deploy URL | https://homecheff-8vegawuel-sergio-s-projects-f7b64ee1.vercel.app |
| Geo contract doc | `docs/geo-location-distance-contract.md` |

### Certified verdicts (do not reopen without evidence)

- `HOMECHEFF_FINAL_LAUNCH_PRODUCTION_READY`
- `HOMECHEFF_AUTO_GEO_RESOLUTION_PRODUCTION_READY`
- `HOMECHEFF_DISTANCE_DATA_PRODUCTION_READY`
- `HOMECHEFF_SINT_MAARTEN_CARIBBEAN_GEO_READY`
- `HOMECHEFF_ENDLESS_FEED_PRODUCTION_READY`
- `HOMECHEFF_FILTER_DISTANCE_PRODUCTION_READY`
- `HOMECHEFF_CONTEXT_BAR_INLINE_CONTROLS_READY`
- `HOMECHEFF_MEDIA_PRODUCTION_READY`
- `HOMECHEFF_PUBLIC_PERFORMANCE_READY`
- `HOMECHEFF_PUBLIC_ROUTES_PRODUCTION_READY`
- `HOMECHEFF_WEBKIT_NAVIGATION_HEALTHY`

Historical evidence lives under `docs/audits/**` (do not rewrite those packs).

---

## Frozen surfaces

### Feed core

- GeoFeed composition
- exact → continuity → widened presentation
- progressive local-first composition
- inspiration interleaving
- endless scroll / `feedHasMore` contracts
- recirculation engine
- CTA cadence
- desktop nested-scroll observer behaviour
- 1-column default; optional 2-column mode

### Geo / location

- automatic place → coordinates (write-time only)
- location precedence & coordinate persistence
- radius semantics & exact-radius membership
- distance calculation / display
- null-distance & `0 km` handling
- Sint Maarten SX (Caribbean) vs Noord-Holland disambiguation
- **zero feed-time listing geocoding**

### Sorting / filters

- Newest, Price, Views/Popular, Distance
- null-distance-last
- desktop filter portal; mobile filter sheet
- context-bar inline controls (location / radius / sort)

### Public routes

- feed → listing → profile chains
- canonical product / request / recipe routes
- legacy redirects & seller/user compatibility
- ON_REQUEST taxonomy/routing

### Listing & profile performance

- server-first listing & public profile
- cached canonical product read; deferred extras
- no old critical `/api/products` waterfall on listing first paint
- public aanbod without seller-products first-paint refetch

### Media

- listing multi-image lifecycle (upload/preview/reorder/replace/delete rules)
- profile-photo upload/replace & public avatar
- MIME/size validation & broken-media fallbacks

### Seller lifecycle

- login / session / create / edit / publish / public visibility / logout

---

## Freeze rule

Do **not** modify frozen surfaces merely because another task touches a nearby file.

A frozen surface may change **only** if one of these is true:

1. Proven production bug  
2. Security issue  
3. Legal / compliance requirement  
4. Payment-critical issue  
5. Separately approved roadmap phase that **explicitly** requires that surface  

**Not sufficient:** performance curiosity, cleanup, refactoring, “could be nicer”.

---

## No opportunistic refactoring

Future tasks must **not**:

- rewrite GeoFeed or invent another feed state machine / recirculation / location state / geocoder
- replace working routing helpers or consolidate certified code “for cleanliness”
- mass-rewrite production data
- alter taxonomy while solving unrelated issues

If unrelated debt is discovered: **report it — do not auto-fix**.

---

## Change safety (when reopening is approved)

1. Inspect history & canonical implementation  
2. Identify blast radius  
3. Smallest possible change  
4. Focused regression test  
5. Browser/device paths affected  
6. Branch → PR → merge → production deploy → production verification  

**No direct push to `main` for product work.**

---

## Data safety

Production data changes require:

READ-ONLY inventory → dry-run → exact candidate list → explicit scope → **exact-ID** mutation → verification → report  

Never mass-rewrite listings. Never infer Product/Dish/Request semantics from missing/zero price, place, distance, or missing media. Taxonomy remains explicit.

---

## Performance guardrail

Preserve:

- server-first listing/profile  
- no unnecessary critical waterfalls  
- no feed-time listing geocoding  
- local UI sort where intended  
- local context-popover opening without fetch  
- persisted coordinates for feed distance  
- cached/deduped write-time location resolution  

Do not trade meaningful UX for synthetic benchmarks. Do not strip useful content merely to improve timing.

---

## Launch / observation mode

Engineering responds primarily to:

- real user bugs, production errors  
- onboarding / conversion / seller-create / buyer-interaction friction  
- payment & security issues  
- **verified** performance bottlenecks  

Do **not** keep redesigning certified marketplace foundations.

### Observation priorities

1. Homepage/feed loads  
2. Location/radius understood  
3. Listing interaction  
4. Listing & profile open  
5. Account creation  
6. Seller create / upload / publish  
7. Buyer contact/interact  
8. Distance & sort feel logical  
9. No Application errors / auth loops / broken-media patterns  
10. No abnormal latency spikes  

Turn observation into engineering **only with evidence**.

---

## Known non-blocking risks (do not “fix” under freeze)

| Risk | Assessment | Action |
|---|---|---|
| REQUEST inventory (`listingIntent=REQUEST`) | **0** active/public records | Inventory gap, not a software defect |
| Sparse marketplace inventory | Few active products; ON_REQUEST sample exists (e.g. Design Studio) | Growth / seller activation |
| Owner `User.country=NL` with Caribbean place | Profile country may remain NL while dish coords are SX | Report if UX confusion appears |
| Orphan Vercel Blob objects after DB Image delete | Possible leftovers from upload/delete cycles; **not quantified as growing** | Separate maintenance ticket later — **no GC in freeze** |
| Uncommitted local audit probes / scripts | Working tree may contain untracked `docs/audits/*` probe artifacts | Do not treat as production-critical |

---

## Approved reasons to reopen a frozen surface

Document the reason as A–E above, then follow Change safety. Examples:

- Production feed crash or incorrect distance for real users  
- Auth bypass / upload security regression  
- Payment capture or settlement breakage  
- Explicit Growth/marketplace roadmap phase that names the surface  

---

## Regression requirements (minimum, if reopening)

- Affected frozen contract still holds (especially: **0 feed-time listing geocode**, distance `>= 0` valid, nulls-last, exact radius needs usable distance)  
- Smoke: homepage, feed growth, listing, profile, media  
- No opportunistic scope expansion  

---

## Related references

- `docs/geo-location-distance-contract.md`  
- `docs/audits/sint-maarten-caribbean-geo/`  
- `docs/audits/endless-feed-cert-latest.json`  
- `docs/audits/media-cert/report.json`  
- `docs/audits/technical-freeze/smoke-latest.json`  

### Freeze smoke snapshot (2026-08-10)

Read-only Playwright matrix against https://homecheff.eu:

- Chromium desktop/mobile homepage: **200**
- WebKit desktop/mobile homepage: **200**
- Feed growth observed; **0** `/api/geocoding` requests during feed scroll
- Product / inspiratie / profile HTTP routes: **200**
- Locator flakiness on some click chains does **not** reopen freeze (HTTP + prior cert packs remain authoritative)

---

**Engineering mode going forward:** Launch / Observation.  
**Next product/business phase:** users, sellers, local activation, Growth, measurable marketplace activity — not another foundation rewrite.
