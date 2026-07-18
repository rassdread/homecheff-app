# HomeCheff — Filter Transition UX & Loading Integrity

| Field | Value |
| --- | --- |
| Branch | `fix/feed-filter-transition-ux` |
| Base | `e6434f8` / Production feature tip `2b66362` |
| Scope | Filter/scope transition UX + speed only |

## 1. Root cause

False zero-results flash during filter/category changes came from two races:

1. **Client refine on stale items:** `appliedCategory` (and related) updated immediately; `filteredSaleBase` re-filtered the *previous* API items by the *new* category → often `length === 0` while `/api/feed` was still in flight.
2. **Empty gates ignored refresh:** `emptySale` / `emptyAll` / etc. required `!loading` but **not** `!feedRefreshing`. Filter transitions set `feedRefreshing` (keep items) without `loading`, so empty UI rendered mid-request.
3. **Scope clear-before-load:** `handleScopeChange` called `setItems([])` before the fetch effect set refreshing → one or more frames of hydrated empty list.

User-facing copy matched messages like “Nog geen aanbiedingen…” / “Niets gevonden met deze filters” (paraphrased as “Niks gevonden op deze locatie”).

## 2. Timeline (before)

Filter tap → applied* updates → client filters empty list → empty UI flash → `feedRefreshing` → API returns → results replace.

## 3. New state model

`IDLE` → `FILTER_TRANSITION_STARTED` → `SEARCHING` → `RESULTS_READY` | `ZERO_RESULTS_CONFIRMED` | `ERROR` | `LOCATION_REQUIRED` | `STALE_RESPONSE_REJECTED`

## 4–6. UX / zero rules / cache

- Searching banner: “Resultaten zoeken…”
- Pause client category/price refine while API transition (SWR retain cards)
- Zero UI only via `isZeroResultsEligible`
- Nearby without GPS: unchanged “Locatie nodig”
- Bounded recent-filter first-batch cache (max 4, TTL 3m); silent revalidate

## Preview

| Field | Value |
| --- | --- |
| Commit | `e77e13f` |
| Deployment | `dpl_FdBq4C8mt7XNgd9XJZ2KBsT9w7v1` |
| Preview URL | https://homecheff-2i6xkv8g0-sergio-s-projects-f7b64ee1.vercel.app |
| Inspect | https://vercel.com/sergio-s-projects-f7b64ee1/homecheff-app/FdBq4C8mt7XNgd9XJZ2KBsT9w7v1 |

**Production:** not promoted — awaiting explicit approval after Preview soak + Android certification.
