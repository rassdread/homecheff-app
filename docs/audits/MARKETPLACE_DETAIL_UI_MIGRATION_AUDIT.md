# Marketplace Detail UI Migration Audit — Phase 4C-UI

## 1. Legacy parts replaced

| Legacy | Replacement |
|--------|-------------|
| `ProductSaleCommerceTrustLine` (props, fans, smart trust) | `ProductDetailTrustBlock` + `DiscoveryTrustContract` |
| `ProductMakerTrustStrip` (fans, blended stats) | Removed from detail |
| Inline stats strip (`averageRating`, `viewCount`, `orderCount`) | Removed — forbidden signals |
| `ProductDetailTrustNote` (Stripe copy + star average) | Contract trust block + existing checkout hints |
| `ProductOfferedBadgesSection` (duplicate taxonomy) | Dropped from detail flow — offer context in description |
| `ProductAcceptedBadgesSection` | `ProductDetailAcceptedValuesSection` (grouped) |
| `ProductDetailLocality` + `ProductDetailDelivery` in sidebar | `ProductDetailConditionsSection` |
| Accepted chips inside `ProductValueExchangeSection` | Split: payment in value exchange, accepted in own section |
| `resolveProductCommerceActions` only for CTAs | `resolveDetailPageActions` (kind matrix + barter) |

## 2. Active detail contracts

| Contract | Usage |
|----------|--------|
| `DETAIL_UI_SECTION_IDS` / `buildDetailUiSectionPlan` | `ProductDetailMainSections` |
| `DESKTOP_DETAIL_GRID` | `app/product/[id]/page.tsx` layout |
| `buildDetailValueExchangeBlock` | `ProductValueExchangeSection` |
| `buildDetailAcceptedValuesPresentation` | `ProductDetailAcceptedValuesSection` |
| `buildDetailConditionsBlock` | `ProductDetailConditionsSection` |
| `buildDetailTrustBlock` | `ProductDetailTrustBlock` |
| `resolveDetailPageActions` | Primary + sticky CTAs |
| `buildDiscoveryTrust` | `GET /api/products/[id]` → `discoveryTrust` |

## 3. Visible trust signals

Allowed (from `DiscoveryTrustContract`):

- Product review count
- Deal review count
- Completed deals
- Completed deliveries
- Repeat customers
- Trust badges
- Established maker tier (seller tier ≥ 4)

Forbidden (removed from detail UI):

- Blended/average star rating as trust proxy
- View counts
- HCP / props / followers / fans

## 4. Accepted values display

- Grouped by main category (`HOME_CHEFF`, `HOME_GARDEN`, etc.) with emoji + label
- Subcategories as taxonomy-resolved items with Lucide icons
- Optional note line only when `note` present in source data (no placeholders)
- REQUEST “seeks” remain in value exchange section with description when non-empty

## 5. ListingKind migration status

| Kind | Detail route | Section plan | Trust channel | Primary CTA |
|------|--------------|--------------|---------------|-------------|
| PRODUCT | `/product/[id]` | Full UI plan | product | order (+ proposal if hybrid) |
| SERVICE | shared | Full | deal | request_proposal |
| TASK | shared | Full | deal | request_proposal |
| WORKSHOP | shared | Full | deal | order + contact |
| COACHING | shared | Full | deal | request_proposal |
| REQUEST | shared | Full + seeks | deal | request_proposal |
| DELIVERY | `/bezorger/[username]` | Not in this migration | courier | N/A |
| INSPIRATION | inspiratie routes | Not in this migration | none | N/A |

All marketplace listing kinds sharing `/product/[id]` use the same `ProductDetailMainSections` architecture with per-kind overrides from `buildDetailUiSectionPlan`.

## Section read order (mobile / main column)

1. Hero media  
2. Person / title / price (sidebar)  
3. Description  
4. Value exchange (payment + seeks)  
5. Accepted counter-values  
6. Conditions & logistics  
7. Trust  
8. Exchange suggestions  
9. Reviews  

Actions: desktop sidebar + mobile inline + sticky bar (proposal-first when kind requires).
