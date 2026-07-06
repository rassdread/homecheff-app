# Marketplace Detail Page System — Phase 4C

**Status:** Architecture + contracts (no UI wiring)  
**Last updated:** 2026-07-06  
**Builds on:** Phase 4A Value Exchange, `DiscoveryTrustContract`, ListingKind spec, Tile T1–T3

---

## North star

Every marketplace listing kind must have a **canonical detail page contract**: section order, trust signals, value exchange block, actions, and responsive layout — without changing discovery ranking, exchange matching, or sponsored surfaces.

```
ListingKind  →  DetailPageKind  →  Section plan  →  Layout tier (mobile/desktop)
      ↓                ↓                  ↓                    ↓
DiscoveryTrust   Value exchange      Action matrix      Sticky bar rules
```

**Code contracts:** `lib/marketplace/detail/`  
**Value exchange (4A):** `lib/marketplace/value-exchange/`  
**Trust SSOT:** `lib/discovery/contracts/discovery-trust-contract.ts`

---

## 1. Detail page kinds

| DetailPageKind | ListingKind source | Route (target) | Current implementation |
|----------------|-------------------|----------------|------------------------|
| `PRODUCT` | `PRODUCT` | `/product/[id]` | `app/product/[id]/page.tsx` |
| `SERVICE` | `SERVICE` | `/product/[id]` | shared product page |
| `TASK` | `TASK` | `/product/[id]` | shared product page |
| `WORKSHOP` | `WORKSHOP` | `/product/[id]` | shared product page |
| `COACHING` | `COACHING` | `/product/[id]` | shared product page |
| `REQUEST` | `REQUEST` | `/request/[slug]` (planned) | incorrectly on product page |
| `INSPIRATION` | `INSPIRATION` | `/inspiratie/*`, `/recipe/*`, etc. | `InspiratieDetail.tsx` |
| `DELIVERY` | courier profile (not ListingKind) | `/bezorger/[username]` | `app/bezorger/[username]/page.tsx` |

Mapper: `listingKindToDetailKind(kind)`.

---

## 2. Canonical section order

All kinds share the same **section id sequence** (`DETAIL_SECTION_IDS`):

1. `hero_media` — photos, video, gallery  
2. `person_row` — seller / provider / host / coach / requester / creator / courier  
3. `value_exchange` — payment + barter acceptance + desired exchange (Phase 4A)  
4. `trust_block` — `DiscoveryTrustContract` lines only  
5. `description` — long-form body  
6. `availability` — stock, calendar, event date, needed-by, or meta  
7. `reviews` — channel-appropriate review list  
8. `related_listings` — same-maker suggestions  
9. `action_block` — primary + secondary CTAs  

Per-kind **visibility** overrides live in `detail-kind-matrix.ts` — order never changes.

---

## 3. Value exchange block

Builder: `buildDetailValueExchangeBlock()`.

| Input | Source |
|-------|--------|
| Payment method | `resolvePaymentMethod()` + `PAYMENT_METHOD_REGISTRY` |
| Barter acceptance | `buildBarterAcceptanceModel()` |
| Accepted subcategories | `getMarketplaceTaxonomyItem()` per taxonomy id |
| Desired exchanges | `DesiredExchangeDetail[]` (4A contract) |

**Hidden** for `INSPIRATION` and `DELIVERY` detail kinds.  
**Full** (including desired exchanges) for `REQUEST`.

i18n: `marketplace.detail.valueExchange.title` + reused `marketplace.valueExchange.*` keys.

---

## 4. Trust block

Builder: `buildDetailTrustBlock(trust, kind)`.

Allowed lines (max 5):

| Line kind | Source field | Emoji (display) |
|-----------|--------------|-----------------|
| `product_reviews` | `trust.product.reviewCount` | ⭐ |
| `deal_reviews` | `trust.deal.reviewCount` | 🤝 |
| `completed_deals` | `trust.completedDeals` | 🤝 |
| `deliveries` | `trust.completedDeliveries` | 🚚 |
| `repeat_customers` | `trust.repeatCustomers` | 🔁 |
| `trust_badge` | `trust.trustBadges[]` | badge icon |
| `seller_tier` | `trust.sellerTier >= 4` | established maker |

**Forbidden on detail trust** (`DETAIL_FORBIDDEN_SIGNALS`):

- blended / average rating  
- HCP points  
- view counts  
- workspace props / item props  
- follower / fan counts  
- dish review count as a blended signal  

Primary channel per kind: `primaryTrustChannelForKind()` — product for `PRODUCT`, deal for service-like kinds.

---

## 5. Action block

Matrix: `DETAIL_ACTION_MATRIX` in `detail-action-matrix.ts`.

| Kind | Primary CTA | Sticky mobile |
|------|-------------|---------------|
| PRODUCT | Order | order |
| SERVICE, TASK, COACHING | Send proposal | contact + proposal |
| WORKSHOP | Order | order + contact |
| REQUEST | Send proposal | proposal |
| DELIVERY | — | message + contact |
| INSPIRATION | — | none (no sticky bar) |

---

## 6. Layout tiers

### Mobile (`buildMobileDetailLayout`)

- Single column, canonical section order  
- `value_exchange` collapsible for marketplace kinds (not inspiration/delivery)  
- Sticky action bar for all kinds except `INSPIRATION`

### Desktop (`buildDesktopDetailLayout`)

Grid: `DESKTOP_DETAIL_GRID` — 3fr main + 2fr sidebar.

**Sidebar (above fold):** person_row, value_exchange, trust_block, action_block  
**Main column:** description, availability, reviews, related_listings

---

## 7. Module map

| File | Responsibility |
|------|----------------|
| `detail-page-contract.ts` | Section ids, kinds, forbidden signals, action ids |
| `detail-kind-matrix.ts` | Per-kind behavior + section visibility |
| `detail-trust-block.ts` | Trust contract → display lines |
| `detail-value-exchange-block.ts` | 4A wiring for detail tier |
| `detail-action-matrix.ts` | CTA sets per kind |
| `detail-layout-contract.ts` | Mobile/desktop plans + grid |
| `index.ts` | Public exports |

---

## 8. Out of scope (4C)

- UI wiring to `app/product/[id]` or `InspiratieDetail.tsx`  
- Discovery ranking or feed changes  
- Exchange matching (Phase 4D)  
- Sponsored placements  
- Automated barter suggestions  

---

## References

- [MARKETPLACE_DETAIL_AUDIT.md](../audits/MARKETPLACE_DETAIL_AUDIT.md)  
- [MARKETPLACE_DETAIL_KIND_MATRIX.md](../audits/MARKETPLACE_DETAIL_KIND_MATRIX.md)  
- [MARKETPLACE_DETAIL_PHASE4C.md](../progress/MARKETPLACE_DETAIL_PHASE4C.md)  
- [MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md](./MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md)  
- [TRUST_TIER_SPEC.md](./TRUST_TIER_SPEC.md)
