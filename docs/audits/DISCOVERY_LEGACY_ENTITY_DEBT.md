# Discovery Legacy Entity Debt

**Version:** V1 (Phase 1B)  
**Last updated:** 2026-07-06

## Critical

| Entity / pattern | Issue | Discovery impact |
|------------------|-------|------------------|
| **Dual read APIs** | `/api/feed` vs `/api/products` | Different product pools |
| **Legacy Listing model** | Still merged in feed | Maps to PRODUCT; no V2 taxonomy |
| **`/api/recommendations/smart`** | Pre-discovery ranking API exists | Must not enable before ranking phase |

---

## High

| Entity / pattern | Issue |
|------------------|-------|
| **Product.category** (CHEFF/GROWN/DESIGNER) | Parallel to marketplaceCategory; used in Dorpsplein/profile filters |
| **MyDishesManager price filter** | Dish commerce leak on profile |
| **Reservation model** | Legacy; not in discovery read model |
| **Transaction model** | Legacy commerce; not mapped |

---

## Medium

| Entity / pattern | Issue |
|------------------|-------|
| `/seller/[sellerId]` route | Legacy seller URL |
| `/bezorger/[username]` route | Legacy courier URL |
| Admin product merge | Listing + Product combined |
| `feed-taxonomy` FeedKind | Parallel enum to ListingKind |

---

## Low

| Entity / pattern | Issue |
|------------------|-------|
| `Reservation` UI remnants | If any |
| Legacy `HOMECHEFF` category strings in feed | Mapped in transforms |
| Vercel export i18n duplicates | Terminology drift |

---

## Entity → DiscoveryReadModel mapping

| Source entity | entityType | listingKind source | Status |
|---------------|------------|-------------------|--------|
| Product | product | deriveListingKind | ✅ |
| Dish | dish | deriveListingKind → INSPIRATION | ✅ |
| Listing (legacy) | listing | deriveListingKind → PRODUCT default | ✅ |
| WorkspaceContent | workspace | Not in feed search yet | Deferred |
| User | — | Not a listing | N/A |
| DeliveryRequest | — | Operational, not listing | N/A by design |
