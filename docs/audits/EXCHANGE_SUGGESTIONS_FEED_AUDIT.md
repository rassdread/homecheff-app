# Exchange Suggestions Feed Audit — Phase 4G

**Date:** 2026-07-06  
**Phase:** 4G — Feed + mobile surface wiring  
**Resolver / matching:** unchanged

## Summary

Exchange suggestions are now visible on feed inserts, mobile discovery/profile/detail, and an expanded desktop sidebar — without modifying discovery ranking, notifications, or the 4D matching resolver.

## Surface matrix (post-4G)

| Surface | Component | Max visible | Auth | Ranking impact |
|---------|-----------|-------------|------|----------------|
| `detail` | `ExchangeSuggestionsDetailBlock` | 3 | yes | none |
| `profile_owner` | `ExchangeSuggestionsProfileModule` | 5/tab | owner | none |
| `sidebar` (desktop) | `ExchangeSuggestionsSidebarModule` | 3 | yes | none |
| `sidebar` (mobile) | `ExchangeSuggestionsSidebarModule` | 2 | yes | none |
| `exchange_feed_insert` | `ExchangeSuggestionsFeedInsert` | 1/slot, 3/session | yes | none |
| `mobile` | `ExchangeSuggestionsMobileModule` | 2 | yes | none |

## Feed insert rules — verified

| Rule | Implementation | Status |
|------|----------------|--------|
| 1 per 20 listings | `EXCHANGE_FEED_INSERT_INTERVAL = 20` | ✓ |
| Max 3 per session | `perSessionFeedInserts` + `feedInsertSessionCount` in client storage | ✓ |
| Max 1 per viewport slot | `perPageFeedInsert = 1` | ✓ |
| No ranking change | Timed insert via `interleaveExchangeFeedInserts`, not `buildDiscoveryFeed` | ✓ |
| No placeholders | Components return `null` when empty | ✓ |

## Mobile limits — verified

| Rule | Status |
|------|--------|
| Max 2 visible (`perPageMobile`) | ✓ |
| Compact cards | ✓ |
| Profile / detail / discovery wired | ✓ |

## Sidebar caps — verified

| Variant | Limit | Status |
|---------|-------|--------|
| Desktop | 3 | ✓ |
| Mobile | 2 | ✓ |

## Duplicate prevention

- Resolver dedupes by suggestion `id` in `collectMatches`
- Feed interleaving skips duplicate card ids in `interleaveExchangeFeedInserts`
- Per-page seller cap (`perSellerPerPage: 1`) unchanged

## Category icons

Mapped via `MAIN_CATEGORY_REGISTRY` / `marketplaceCategoryToMainCategory`:

| Category | Icon |
|----------|------|
| HomeCheff | 🍳 |
| HomeGarden | 🌱 |
| HomeDesigner | 🎨 |
| Diensten | 🔧 |
| Workshops | 📚 |
| Coaching | 🎓 |
| Bezorging | 🚚 |
| Hulp / Verzoek | 🙋 |

## Analytics

| Event | Trigger |
|-------|---------|
| `exchange_suggestion_impression` | Card/insert enters DOM (once) |
| `exchange_suggestion_open` | Listing link click |
| `exchange_suggestion_cta_click` | CTA click with `cta` param |

## i18n parity

| Namespace | en | nl |
|-----------|----|----|
| `marketplace.exchangeSuggestions.feed` | ✓ | ✓ |
| `marketplace.exchangeSuggestions.mobile` | ✓ | ✓ |

## Files added / changed

**New**

- `components/marketplace/exchange-suggestions/ExchangeSuggestionsFeedInsert.tsx`
- `components/marketplace/exchange-suggestions/ExchangeSuggestionsMobileModule.tsx`
- `components/marketplace/exchange-suggestions/useExchangeFeedInsertCards.ts`
- `lib/feed/exchange-suggestion-feed-rows.ts`
- `lib/marketplace/exchange-suggestions/exchange-suggestion-analytics.ts`
- `lib/marketplace/exchange-suggestions/exchange-suggestion-category-icon.ts`
- `scripts/validate-exchange-feed.ts`

**Modified**

- Contract, caps, surface, copy, resolver (mainCategory + mobile detail routing)
- API route (`sidebarVariant`, `feedBatch`)
- `GeoFeed.tsx`, product page, profile panels
- `ExchangeSuggestionCard`, sidebar module
- `public/i18n/en.json`, `public/i18n/nl.json`

## Known limitations (unchanged from 4F)

- No geo distance in API candidate query (distance from profile when present)
- Feed batch fetch records impressions on load; feed insert session count on render
- Mobile discovery module is an additional surface, not a replacement for feed inserts

## Validation commands

```bash
npx tsx scripts/validate-exchange-feed.ts
npx tsx scripts/validate-exchange-suggestions.ts
```
