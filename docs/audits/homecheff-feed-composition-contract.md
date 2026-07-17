# HomeCheff feed composition & endless scroll contract

## Geographic inspiration rules

| Scope | Marketplace | Inspiration |
|-------|-------------|-------------|
| Nearby | Radius + coords required | Only items with trustworthy coords inside radius. **No coords → excluded.** |
| National | Mainland NL bbox / eligibility | Mainland contract; Caribbean place labels excluded |
| International | Worldwide | Worldwide |

Nearby without location: dedicated empty state — no inspiration, no recirculation.

## Filter compatibility

See `FEED_FILTER_COMPATIBILITY` in `lib/feed/feed-composition-policy.ts`.

Summary:

- **Both:** scope, radius (Nearby), category/vertical, search text
- **Marketplace only:** price, accepted values, delivery/pickup, `feedChip=sale`
- **Inspiration only:** `feedChip=inspiration`
- **Ranking only:** sort / discovery scoring (does not hide inspiration)

Price filter never removes compatible inspiration unless the user is in explicit sale-only mode.

## Composition

- Central stride: `FEED_SALE_INSPIRATION_STRIDE = 4` (~3–5 sales then 1 inspiration)
- Stages: `exact` → `broadened` (reserved) → `recirculation`
- One exhausted source does **not** terminate the feed

## Recirculation

When unique eligible inventory is exhausted (`marketplaceExhausted` and seed ≥ `FEED_RECIRC_MIN_SEED`):

- Client-side recirculation from accepted history
- No consecutive duplicate
- Prefer least-recent + min spacing
- No server request storm
- Sentinel stays active

## Pagination state

`FeedCompositionState` tracks requestKey, marketplace/inspiration exhaustion, recirculation flags, displayed history, generation.
