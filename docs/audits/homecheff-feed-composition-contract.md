# HomeCheff feed composition & endless scroll contract

## Geographic inspiration rules

| Scope | Marketplace | Inspiration |
|-------|-------------|-------------|
| Nearby (adequate local supply) | Local-first: in-radius first, then wider eligible tail | Items with trustworthy coords inside radius |
| Nearby (sparse local / no location) | Soft-national / progressive wider tail | National mainland eligibility (Inspiration must not vanish from Alles) |
| National | Mainland NL bbox / eligibility | Mainland contract; Caribbean place labels excluded |
| International | Worldwide | Worldwide |

`resolveInspirationCompositionScope` selects the Inspiration geo contract for the mixed Alles feed. Explicit Inspiration chip still shows Inspiration-only rows from the composed inspiration slots.

## Filter compatibility

See `FEED_FILTER_COMPATIBILITY` in `lib/feed/feed-composition-policy.ts`.

Summary:

- **Both:** scope, radius (Nearby), category/vertical, search text
- **Marketplace only:** price, accepted values, delivery/pickup, `feedChip=sale`
- **Inspiration only:** `feedChip=inspiration`
- **Ranking only:** sort / discovery scoring (does not hide inspiration)

Price filter never removes compatible inspiration unless the user is in explicit sale-only mode.

## Progressive discovery stages (product contract)

HomeCheff is an infinite scrolling marketplace. The goal is **not** to permanently
avoid duplicate cards. The goal is to avoid **accidental** duplication while unique
relevant content is still available.

| Stage | Behaviour |
|-------|-----------|
| **1 — Exact unique nearby** | Show all eligible unique nearby / in-radius content first. |
| **2 — Progressive widen** | When local supply is insufficient, widen with local-first philosophy (wider eligible marketplace tail). |
| **3 — Inspiration / discovery mix** | Interleave eligible Inspiration and approved discovery content per composition rules (stride). |
| **4 — Controlled recirculation** | Only after the eligible unique candidate pool has been reasonably exhausted (`marketplaceExhausted` / `exactExhausted`), recirculate previously shown items to keep the infinite feed alive. |

### Recirculation is intentional (not a bug)

Acceptable:

- previously viewed listings returning later;
- Inspiration appearing again later;
- popular marketplace items returning after long scrolling;
- controlled recycling once the unique pool is limited.

Still regressions:

- identical cards immediately after each other;
- duplicates from merge/pagination/cursor/API payload errors;
- duplicate candidate pools;
- recirculation replacing still-available unique content;
- Inspiration repeating excessively while unseen marketplace items still exist.

Runtime: `markMarketplacePageResult` activates `stage: 'recirculation'` only when the
marketplace page is exhausted; `buildRecirculationBatch` enforces spacing / no
consecutive identical id when alternatives exist.

## Composition

- Central stride: `FEED_SALE_INSPIRATION_STRIDE = 4` (~3–5 sales then 1 inspiration)
- Progressive Nearby sales: `composeProgressiveNearbySalePool` (local then wider)
- Sparse local threshold for Inspiration widen: `FEED_SPARSE_LOCAL_SALE_THRESHOLD`
- Stages: `exact` → `broadened` (reserved) → `recirculation`
- One exhausted source does **not** terminate the feed

## Recirculation inventory contract

`resolveInventoryContinuationMode`:

| Unique eligible | Behavior |
|-----------------|----------|
| **0** | Intentional empty state (`emptyTerminal`). No recirculation. No request loop. Suggest changing scope/filters. |
| **1** | Spaced single-seed recirculation: **1 card per load-more batch** (viewport spacing). Sentinel stays active. Never hard-stop merely because only one seed exists. |
| **2** | Alternating single-card batches (never consecutive; reduces A-B viewport bursts). |
| **3+** | Least-recent + min spacing (`FEED_RECIRC_MIN_SPACING`) + kind rotation. |

When marketplace `hasMore=false`:

- Client recirculation from accepted history (no server storm)
- Sentinel stays active for 1+ seeds
- Diagnostics note `stage=recirculation` or `stage=empty`

## Pagination state

`FeedCompositionState` tracks requestKey, marketplace/inspiration exhaustion, recirculation flags, displayed history, generation.
