# Marketplace tile Share — Production certification

## FINAL_DECISION

`HOMECHEFF_MARKETPLACE_TILE_SHARE_PRODUCTION_CERTIFIED`

## Production

| Field | Value |
|-------|-------|
| PRODUCTION_SHA | `54032c56656ef870b15b02e159e7b7a88b59d68f` |
| PRODUCTION_DEPLOYMENT_ID | `6287172680` |
| Status | success |

## Audit

| Field | Value |
|-------|-------|
| ACTIVE_CARD_COMPONENTS | MarketplaceTileRouter → Compact / Standard / Mini (+ ProfilePublicAanbodTileGrid) |
| SHARED_BASE_CARD_COMPONENT | TileMedia action cluster |
| DETAIL_SHARE_COMPONENT | ShareButton (ProductSaleCommerceZone) |
| DETAIL_SHARE_HELPER | ShareButton + useAffiliateLink |
| SHARE_HELPER_REUSED | YES — TileShareAction uses same affiliate URL policy + absolute public listing href |
| CANONICAL_PUBLIC_URL_USED | YES — `model.href` via `buildListingDetailHref` / feed href (`/product|request/...-hcid-...`) |

## Gates

| Gate | Result |
|------|--------|
| TILE_SHARE_BUTTON_VISIBLE | YES (top-right cluster with favorite) |
| FEED_SHARE | YES (Compact + Standard) |
| SEARCH_SHARE | YES (same GeoFeed tiles) |
| CATEGORY_SHARE | YES (same GeoFeed tiles) |
| PROFILE_SHARE | YES (Mini / ProfilePublicAanbodTileGrid) |
| OWNER_PUBLIC_LISTING_SHARE | YES |
| PRIVATE_LISTING_SHARE_EXPOSED | NO (tiles only render public discovery items) |
| WEB_SHARE_API | YES (preferred) |
| CLIPBOARD_FALLBACK | YES (“Link gekopieerd”) |
| EVENT_PROPAGATION_SAFE | YES (`cardActionBoundaryProps` + preventDefault) |
| SHARE_CLICK_OPENS_LISTING | NO |
| DETAIL_SHARE_STILL_WORKS | YES (ShareButton unchanged on detail) |
| TESTS | listing-share helpers 5/5 PASS |

## Regressions

LISTING_CARD_NAVIGATION_REGRESSION = NO  
FAVORITE_SAVE_REGRESSION = NO  
DETAIL_SHARE_REGRESSION = NO  
SEARCH_ARCHITECTURE_CHANGED = NO  
AFFILIATE / HC / DELIVERY unchanged.
