# ListingKind Mapping Audit

**Version:** V1 (Phase 1)  
**Last updated:** 2026-07-06  
**Implementation:** `lib/marketplace/listing-kind/derive-listing-kind.ts`

## Derivation precedence (implemented)

| Step | Condition | ListingKind |
|------|-----------|-------------|
| 0 | `entityType` dish/workspace OR `feedSource=DISH` | **INSPIRATION** |
| 1 | `listingIntent=REQUEST` | **REQUEST** |
| 2 | Workshop taxonomy ids in `specializations[]` | **WORKSHOP** |
| 3 | `knowledge.coaching` in `specializations[]` | **COACHING** |
| 4 | `marketplaceCategory=PRACTICAL_SERVICE` | **TASK** |
| 5 | Physical create ids under DESIGN/CREATE | **PRODUCT** (override) |
| 6 | `marketplaceCategory` ∈ ARTISTIC_SERVICE, PRACTICAL_SERVICE*, KNOWLEDGE, DESIGN | **SERVICE** |
| 7 | Default | **PRODUCT** |

\* PRACTICAL_SERVICE never reaches step 6 (caught at step 4).

---

## Taxonomy path matrix

### marketplaceCategory → default kind (without specializations)

| marketplaceCategory | Default ListingKind | Notes |
|---------------------|---------------------|-------|
| CREATE | PRODUCT | Physical/digital goods |
| GROW | PRODUCT | Produce, plants |
| DESIGN | SERVICE or PRODUCT | Physical create ids → PRODUCT |
| ARTISTIC_SERVICE | SERVICE | Tattoo, photography, etc. |
| PRACTICAL_SERVICE | TASK | Dog walking, handyman |
| KNOWLEDGE | SERVICE | Tutoring default; workshop/coaching ids override |

### specializations → kind overrides

| Taxonomy id | ListingKind |
|-------------|-------------|
| `knowledge.workshop` | WORKSHOP |
| `knowledge.cookingclass` | WORKSHOP |
| `knowledge.musicclass` | WORKSHOP |
| `knowledge.coaching` | COACHING |
| `create.meal`, `create.baking`, … | PRODUCT (when category DESIGN/CREATE) |
| `design.website` | SERVICE |
| `practical.dogwalking`, `practical.handyman`, … | TASK (via PRACTICAL_SERVICE category) |

### listingIntent

| Value | ListingKind |
|-------|-------------|
| OFFER (or null/legacy) | Derived from category + specs |
| REQUEST | REQUEST |

### Legacy Product.category (parallel — profile vertical filters only)

| Legacy category | Profile filter | ListingKind inference |
|-----------------|----------------|----------------------|
| CHEFF | chef | Uses marketplaceCategory if set, else CREATE → PRODUCT |
| GROWN | garden | GROW → PRODUCT |
| DESIGNER | designer | DESIGN → SERVICE or PRODUCT |

**Rule:** Legacy category alone must **not** determine ListingKind when V2 fields exist.

### feedSource / entity

| Source | ListingKind |
|--------|-------------|
| DISH | INSPIRATION (always) |
| PRODUCT | Derived from Product fields |
| LISTING (legacy) | PRODUCT (no V2 fields) |

---

## Ambiguous mappings

| Case | Current behavior | Confidence | Future requirement |
|------|------------------|------------|-------------------|
| DESIGN + `design.website` vs physical create | SERVICE vs PRODUCT via spec ids | Medium | ListingKind cache field optional |
| KNOWLEDGE + `knowledge.tutoring` | SERVICE (not COACHING) | Medium | Document tutoring as SERVICE |
| Music class vs 1:1 music lesson | Workshop id wins → WORKSHOP | Medium | Creator intent picker |
| "Who sells tomatoes?" REQUEST vs search | REQUEST when listingIntent set | Low | Search intent layer (Discovery) |
| Priced Dish in profile dorpsplein | INSPIRATION in feed; profile still filters by priceCents in MyDishesManager legacy paths | Medium | Migrate profile grids to Product-only for Aanbod |
| Legacy Listing in feed | PRODUCT | High | Deprecate Listing entity |
| barterOpenness trade filter | Separate from ListingKind (`trade` profile filter) | High | Keep orthogonal |

---

## Missing mappings (deferred)

| Gap | Impact | Phase |
|-----|--------|-------|
| `/request/[slug]` route | REQUEST uses `/product/[slug]` temporarily | Phase 2 routes |
| Gezocht profile tab | REQUEST mixed in Aanbod | Profile Phase 2 |
| WorkspaceContent ListingKind | INSPIRATION assumed | When studio in feed |
| fulfillmentOptions as kind hint | Not used in derivation | Optional supplementary |
| DELIVERY_OPERATION | Not a ListingKind (by design) | Courier job board |

---

## Consumer audit

| Consumer | Uses deriveListingKind? | Status |
|----------|-------------------------|--------|
| Feed API `/api/feed` | ✅ attachListingKindToRecord | Done |
| GeoFeed normalizeFeedItem | ✅ attachListingKind | Done |
| deriveFeedTaxonomy | ✅ via listingKind | Done |
| isMarketplaceSaleItem | ✅ excludes DISH/INSPIRATION | Done |
| resolveFeedItemHref | ✅ REQUEST → /product/[slug] | Done |
| Profile ProductManagement | ✅ matchesProfileAanbodFilter | Done |
| Search | ❌ | Discovery prerequisite |
| SEO schema | ❌ | Post-Discovery |
| Matching | ❌ | Post-Discovery |

---

## Dev audit tooling

Set `LISTING_KIND_AUDIT_VERBOSE=1` in development to log each derivation.  
Disable with `LISTING_KIND_AUDIT=0`.

Samples available via `getListingKindAuditSamples()` from `@/lib/marketplace/listing-kind`.
