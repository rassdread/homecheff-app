# Marketplace Exchange — Phase 4G

**Status:** Complete  
**Scope:** Feed inserts, mobile surfaces, sidebar caps, category icons, analytics, i18n

## Delivered

### 4G-A — Feed inserts (`exchange_feed_insert`)

- Surface `exchange_feed_insert` added to contract
- `ExchangeSuggestionsFeedInsert` — compact band with category emoji, title, match summary, CTA
- `lib/feed/exchange-suggestion-feed-rows.ts` — interleave after every 20th sale row
- `useExchangeFeedInsertCards` — batch fetch via existing API (`feedBatch=1`)
- Wired in `GeoFeed.tsx` (desktop + mobile sale feed)

**Caps**

| Rule | Value |
|------|-------|
| Per viewport insert | 1 card |
| Per session | 3 inserts max |
| Listing interval | every 20 sales |
| Ranking impact | none |

### 4G-B — Mobile module (`mobile`)

- `ExchangeSuggestionsMobileModule` — max 2 compact cards
- Locations: profile (mobile), product detail (mobile), discovery feed header (mobile)
- Surface `mobile`; optional `listingId` on detail

### 4G-C — Sidebar extension

- Desktop sidebar: max **3** suggestions (`perPageSidebar`)
- Mobile sidebar variant: max **2** (`perPageSidebarMobile`)
- `sidebarVariant` query param on API

### 4G-D — Category awareness

- `mainCategory` on `ExchangeSuggestionCard` (derived from counterparty listing taxonomy)
- `mainCategoryEmoji()` uses `MAIN_CATEGORY_REGISTRY` — no new category source
- All surfaces show main-category emoji

### 4G-E — Analytics

Events via `trackEvent` (GA4):

- `exchange_suggestion_impression`
- `exchange_suggestion_open`
- `exchange_suggestion_cta_click`

Properties: `surface`, `listing_id`, `suggested_listing_id`, `category`, `position`

### 4G-F — i18n

Namespaces:

- `marketplace.exchangeSuggestions.feed`
- `marketplace.exchangeSuggestions.mobile`

Full en/nl parity in `EXCHANGE_SUGGESTION_I18N_KEYS`.

## Validation

```bash
npx tsx scripts/validate-exchange-feed.ts
npx tsx scripts/validate-exchange-suggestions.ts
```

## Out of scope (later phases)

Notifications, push, ranking changes, auto proposals, acceptance flow, multi-step chains, sponsored placements.

## References

- `docs/architecture/MARKETPLACE_EXCHANGE_SUGGESTIONS.md`
- `docs/audits/EXCHANGE_SUGGESTIONS_FEED_AUDIT.md`
- `docs/progress/MARKETPLACE_EXCHANGE_PHASE4F.md`
