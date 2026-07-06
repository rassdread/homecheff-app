# Discovery Feed Integration — Phase 2E

**Status:** Complete

---

## Delivered

### Part 1 — Feed section integration
- [x] `/api/feed` builds all 5 sections via `buildDiscoveryFeed`
- [x] Response includes `discovery` contract with sections + ordered listing ids

### Part 2 — Legacy sort replacement
- [x] `local-discovery.ts` — distance-based local bucket (removed `computeSaleScore`)
- [x] `GeoFeed` — server discovery order when payload present
- [x] `feedSaleRanking.ts` — deprecated; fallback for missing discovery payload
- [x] `feed-client-sort.ts` — `isDiscoverySmartFeedSort` helper

### Part 3 — Insertion rules
- [x] `discovery-section-insertion.ts` — desktop/mobile plans, spacing, section order

### Part 4 — Dedup strategy
- [x] `discovery-section-dedup.ts` — listing, seller, cross-section, adjacent-seller rules

### Part 5 — Feed contract
- [x] `discovery-feed-contract.ts` — sections, ordered ids, insertion, dedup, future slots

### Part 6 — Performance audit
- [x] `docs/audits/DISCOVERY_FEED_PERFORMANCE.md`

### Part 7 — Readiness report
- [x] `docs/audits/DISCOVERY_FEED_READINESS.md`

---

## Key files

| File | Role |
|------|------|
| `lib/feed/build-discovery-feed.ts` | Server section orchestration |
| `lib/feed/discovery-feed-contract.ts` | Canonical API shape |
| `lib/feed/discovery-feed-client.ts` | Client order + row builders |
| `app/api/feed/route.ts` | Discovery pool enrich + response |
| `components/feed/GeoFeed.tsx` | Section rendering |
| `components/feed/DiscoveryFeedSectionHeading.tsx` | Section title band |

---

## API shape

```json
{
  "items": [...],
  "discovery": {
    "version": 1,
    "sections": [{ "sectionId": "nearby", "titleKey": "...", "listingIds": [...] }],
    "orderedListingIds": [...],
    "insertion": { "surface": "desktop", "sectionOrder": [...] },
    "dedup": { ... },
    "futureSlots": [{ "kind": "activity_cards", "enabled": false }]
  }
}
```
