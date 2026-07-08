# Homepage Sidebar & Filter — Phase 7G Audit

Date: 2026-07-08  
Scope: Sidebar CTA deduplication, legacy settlement fallback, filter perceived performance

## 1. Duplicate sidebar CTA findings

| Source | Module | CTA | Route |
|--------|--------|-----|-------|
| GrowthActionStack | `opportunity` slot | Start als bezorger | `/delivery/signup` |
| OpportunitySurfaceStack | economy desktop sidebar | Start als bezorger | `/delivery/signup` |
| Activity modules | `BECOME_COURIER` card | Bezorger worden | `/delivery/onboarding` |
| HomeRecommendedPromotions | `werken-bij` promo | Meer info (bezorgen) | `/werken-bij` |

**Root cause:** Phase 7F split growth (upstream) and activity-modules stack (downstream), but `OpportunitySurfaceStack` still rendered the same `opportunityEconomy.desktopSidebar` COURIER contract that `GrowthActionStack` already shows. Activity cards and promotions added further delivery messaging.

## 2. Sidebar CTA priority rules

Documented in `lib/home/sidebar-cta-priority.ts`:

1. Stripe Connect / payout profile (UserActionCenter)
2. Profile complete (HomeProfileProgressCard)
3. First offer / create flows (Growth current action)
4. First deal / workshop milestones
5. **Delivery signup** — single winner: Growth opportunity COURIER
6. Community / HCP / tips / promotions

Lower-priority delivery CTAs are suppressed when a higher-priority delivery surface is visible.

## 3. Right sidebar fixes

| Change | File |
|--------|------|
| Central suppression resolver | `lib/home/sidebar-cta-priority.ts` |
| Pass suppression to activity stack + promos | `HomeDesktopSidebar.tsx` |
| Hide economy COURIER duplicate | `OpportunitySurfaceStack.tsx` |
| Filter `BECOME_COURIER` activity cards | `DesktopRightSidebarSurfaceStack.tsx` |
| Hide `werken-bij` when delivery visible | `HomeRecommendedPromotions.tsx` |

## 4. Legacy settlement fallback

**Problem:** Dishes and legacy listings lacked `acceptHomeCheffPayment` / `acceptDirectContact` and Connect status in feed payloads, so tiles could render without settlement icons.

**Rule (Phase 7G):** When explicit booleans are absent, a priced OFFER with checkout-capable `orderMethod` and seller Connect ready may show HomeCheff Checkout (ShieldCheck). Explicit booleans always win. No checkout without Connect. No cash/barter unless explicitly known.

## 5. Settlement source of truth

| Layer | Uses `resolveSettlementOptions` |
|-------|--------------------------------|
| Canonical helper | `lib/marketplace/settlement/settlement-options.ts` (+ `isLegacyPricedCheckoutEligible`) |
| Tile row | `build-tile-settlement-row.ts` |
| Feed tile mapper | `map-to-tile-model.ts` |
| Feed API legacy rows | `app/api/feed/route.ts` (dish/listing null booleans + Connect) |

No per-tile ad-hoc fallback logic added.

## 6. Filter performance bottlenecks

| Issue | Location | Effect |
|-------|----------|--------|
| `loading` replaced entire feed with skeleton | `GeoFeed.tsx` `feedResultsBlock` | Visible flash on every filter-driven refetch |
| No warm-refresh state | fetch `useEffect` | Prior results hidden during network wait |
| Refine search waited for Apply only | `searchQuery` → `appliedSearchQuery` | Typing felt unresponsive for client filter |

**Not changed:** Category chip still triggers server refetch (required for vertical filter). View chip remains client-only. Sort remains client-only.

## 7. Filter speed improvements

| Fix | Behavior |
|-----|----------|
| `feedRefreshing` vs `loading` | Keep `displayRows` visible during warm refetch |
| `showFeedSkeleton` | Skeleton only when `!feedHydrated` |
| `feed.updating` status | Subtle spinner text while refreshing |
| `useDebouncedValue` (350ms) | Auto-apply client refine search without extra API calls |
| Existing AbortController | Unchanged — prior fetch aborted on new params |

## 8. Mobile tile spacing check

Re-verified Phase 7E guards:

- `h-auto self-start` on tile articles
- `shrink-0` on media + content blocks
- `align-self: start` in `app/globals.css` feed grid
- Trust row before settlement row

No additional layout regression found.

## 9. Data integrity

- Explicit settlement booleans unchanged for Product rows
- Legacy dish/listing rows emit `null` booleans (not `false`) so fallback applies
- `sellerStripeConnectReady` derived from user Stripe fields for legacy entities
- No ranking or payment-flow changes

## 10. Performance validation

Run:

```bash
npx tsx scripts/validate-homepage-sidebar-and-filter-phase7g.ts
npx tsx scripts/validate-discovery-filter-ui-phase7e.ts
npx tsx scripts/validate-marketplace-architecture-phase7d.ts
npx tsx scripts/validate-settlement-options-phase7c.ts
npx tsx scripts/validate-runtime-performance-phase4c.ts
npm run build
```

## 11. Deferred items

- Auto-apply debounce for location `q` / place (still requires Apply — avoids geocode spam)
- Server-side category filter without refetch (would need API contract change)
- Consolidate `/delivery/signup` vs `/delivery/onboarding` vs `/werken-bij` into one product surface (out of scope — dedup only)
