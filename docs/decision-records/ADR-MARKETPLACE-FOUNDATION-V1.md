# ADR: Marketplace Foundation V1

**Status:** Proposed — awaiting sign-off  
**Date:** 2026-07-06  
**Deciders:** Product, Engineering  
**Supersedes:** Ad-hoc entity assumptions in feed/checkout/inspiratie code paths

---

## Context

HomeCheff supports physical products, food, services, workshops, requests, inspiration, and community delivery. Multiple parallel models (`Product`, `Listing`, `Dish`) and review types evolved before a unified discovery layer. Discovery Phase 1 must not amplify existing conflicts.

Foundation audits completed:

- Marketplace Entity Architecture Audit V1
- Trust / Reviews / Social Signals Audit V1
- Identity, Roles & Profile Architecture Audit V1
- Recommendation & Discovery Blueprint Audit V1

Phase 0 documentation validates these against the codebase ([marketplace-entity-validation.md](../audits/marketplace-entity-validation.md)).

---

## Decision

### 1. Canonical marketplace listing entity

**`Product` is the single write path for all marketplace listings.**

User-facing terminology: **Listing** (documentation and UI copy).

`listingIntent` discriminates:

- `OFFER` — seller/provider offers something
- `REQUEST` — buyer/community seeks help

Vertical/type discrimination uses **`marketplaceCategory` + `specializations[]` (taxonomy ids)**, not legacy `ProductCategory` alone.

### 2. Derived ListingKind layer

Introduce **`deriveListingKind()`** as specified in [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md).

No new DB table in Phase 1. Kind is computed at read time and cached optionally later.

Kinds: PRODUCT, SERVICE, TASK, WORKSHOP, COACHING, REQUEST (+ INSPIRATION and DELIVERY_OPERATION from non-Product entities).

### 3. Inspiration remains separate

**`Dish` and `WorkspaceContent` are not marketplace listings.**

- No checkout from Dish
- Priced dishes must not appear in sale discovery
- `DishReview` becomes **Community Feedback** (non-trust)

### 4. Community commerce path

```
Product → Conversation → Proposal → Agreement → CommunityOrder
  → (optional) DeliveryRequest → CourierAssignment
  → DealReview / DeliveryReview
```

Checkout path remains separate:

```
Product → Order (Stripe) → ProductReview → (optional) DeliveryOrder
```

### 5. Trust channels (never blend)

| Channel | Source |
|---------|--------|
| Product trust | ProductReview |
| Deal trust | DealReview |
| Courier trust | DeliveryReview |
| Community feedback | DishReview (renamed) — **not trust** |

Profile and discovery must expose channels separately. No headline blended star average.

### 6. Social signals

| Surface | Signal |
|---------|--------|
| Product/Listing | **Favoriet** (Favorite table) |
| WorkspaceContent | **Props** (WorkspaceContentProp) |
| Inspiration Dish | Favoriet + Community Feedback |

**Remove Props from product detail** — one save action only.

### 7. Profile canonical URL

**`/user/[username]`** is the only canonical public identity URL.

`/seller/[sellerId]` and `/bezorger/[username]` → redirect candidates.

### 8. Route ownership

| Entity | Canonical route |
|--------|-----------------|
| Product OFFER | `/product/[slug]` |
| Product REQUEST | `/request/[slug]` (future; noindex until stable) |
| Dish inspiration | `/recipe|garden|design/[id]` |
| User profile | `/user/[username]` |
| Private deals | `/profile/deals`, chat |

See [ROUTE_OWNERSHIP.md](../architecture/ROUTE_OWNERSHIP.md).

### 9. Delivery boundary

- **`DeliveryRequest`** — community operational; not a listing; not public SEO
- **`DeliveryOrder`** — checkout Stripe delivery only

---

## What is canonical

| Concept | Canonical implementation |
|---------|-------------------------|
| Marketplace listing | `Product` + V2/V3 fields |
| Listing type | `deriveListingKind()` from taxonomy |
| Taxonomy tags | `specializations[]`, `acceptedSpecializations[]` |
| Inspiration | `Dish`, `WorkspaceContent` |
| Community deal | `CommunityOrder` |
| Checkout | `Order` + `OrderItem` |
| Community delivery | `DeliveryRequest` + `CourierAssignment` |
| Public profile | `/user/[username]` Profile V2 |
| Maker capability | `SellerProfile` |
| Courier capability | `DeliveryProfile` |

---

## What is legacy

| Item | Treatment |
|------|-----------|
| `Listing` model | Read/migrate — no new creates |
| `Reservation`, `Transaction` (listing) | Deprecate |
| `Product.category` (CHEFF/GROWN/DESIGNER) | Compatibility alias — derive from V2 |
| `subcategory` string | Migrate to taxonomy ids |
| `/seller/[sellerId]` | Redirect to user profile |
| `/bezorger/[username]` | Redirect to user profile |
| Priced `Dish` as sale | Remove from sale pool |
| `/api/recommendations/smart` mock | Deprecate or rebuild on section registry |

---

## What should be deprecated

1. `Listing` table (after migration)
2. `Reservation` / listing `Transaction` flow
3. Props button on product pages
4. Blended trust average in profile APIs
5. DishReview in trust/stats averages
6. Feed merge of legacy listings (after migration)
7. `sellerRoles[]` as primary discovery matcher (use taxonomy)

---

## What Discovery Phase 1 MAY assume

After P0 prerequisites ([DISCOVERY_PREREQUISITES.md](../discovery/DISCOVERY_PREREQUISITES.md)):

- Single listing table (`Product`) with taxonomy fields
- GeoFeed as primary discovery surface
- `/product/[slug]` stable for OFFER SEO
- Inspiration separate chip (Dish)
- Three trust channels exist in data (even if UI not split)
- `listingIntent` OFFER/REQUEST exists in schema

---

## What Discovery Phase 1 may NOT assume

- ListingKind implemented in code
- SERVICE/TASK/REQUEST/workshop filters working
- Trust-weighted ranking live
- Props/Favorites fixed on products
- `/request/[slug]` route exists
- Legacy Listing absent from feed
- Smart recommendations API integrated
- Profile services/gezocht tabs exist
- Courier job discovery public

---

## What future systems must consume

### Trust

- [REVIEW_ARCHITECTURE.md](../architecture/REVIEW_ARCHITECTURE.md) — channel separation
- `getProfileTrustSummary()` split metrics (not blended average)
- HCP/badges excluded from rank

### Discovery

- [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md) — `deriveListingKind()`
- Taxonomy ids for matching — not legacy category alone
- [ROUTE_OWNERSHIP.md](../architecture/ROUTE_OWNERSHIP.md) — href generation
- Section registry: sale, request, services, inspiration, barter (future chips)

### SEO

- Product OFFER: index `/product/[slug]`
- REQUEST: noindex until UX stable
- Inspiration: vertical routes
- Private entities: noindex
- Profile: canonical `/user/[username]`

### Matching

- REQUEST: taxonomy + geo + urgency (when fields exist)
- SERVICE/TASK: taxonomy + deal trust + distance
- Accepted-value: `acceptedSpecializations[]` index
- Courier: `CourierAvailability` + geo — not Product listing

### Recommendations

- Rebuild on discovery section registry — not orphaned smart API
- Trust tier weighting only after P1 trust stabilization
- Never recommend from blended trust average

### Profiles

- [PROFILE_ENTITY_MAPPING.md](../architecture/PROFILE_ENTITY_MAPPING.md)
- Aanbod = OFFER; Gezocht = REQUEST
- Inspiratie = Dish/Workspace only
- Vertrouwen = split trust channels

---

## Consequences

### Positive

- Single mental model for all offer types
- Discovery built on stable taxonomy + kind derivation
- Trust and social signals usable for matching
- SEO URLs stable and entity-aligned

### Negative / cost

- Migration effort for legacy Listing rows
- Short-term dual category fields until legacy removed
- Profile and stats API refactors before trust-weighted discovery
- REQUEST route and fields require Phase 2 work

---

## Implementation phases (reference)

| Phase | Focus |
|-------|-------|
| **0** | Documentation (this ADR + architecture docs) ✅ |
| **1** | Listing normalization, ListingKind impl, feed fixes |
| **2** | REQUEST fields + route + Gezocht profile |
| **3** | Workshop capacity + event dates |
| **4** | Service availability |
| **5** | Discovery integration |
| **6** | SEO landing automation |

---

## Sign-off required

| Decision | Approver | Status |
|----------|----------|--------|
| Product as unified listing table | | ☐ |
| ListingKind derivation rules | | ☐ |
| Inspiration separate from commerce | | ☐ |
| Trust channel separation | | ☐ |
| Props/Favorites split | | ☐ |
| Profile URL canonicalization | | ☐ |
| REQUEST noindex until stable | | ☐ |
| P0 prerequisites before Discovery Phase 1 | | ☐ |

---

## Related documents

- [MARKETPLACE_ENTITY_ARCHITECTURE.md](../architecture/MARKETPLACE_ENTITY_ARCHITECTURE.md)
- [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md)
- [MARKETPLACE_CONFLICTS.md](../audits/MARKETPLACE_CONFLICTS.md)
- [DISCOVERY_PREREQUISITES.md](../discovery/DISCOVERY_PREREQUISITES.md)
