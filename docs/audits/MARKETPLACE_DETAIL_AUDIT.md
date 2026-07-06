# Marketplace Detail Page Audit — Phase 4C

**Date:** 2026-07-06  
**Scope:** Current production detail pages vs Phase 4C contracts  
**Method:** Static code review — no UI changes in this phase

---

## Executive summary

Detail pages today are **kind-agnostic** on `/product/[id]` and use **legacy trust signals** (blended ratings, views, fans). Phase 4C defines the target architecture; wiring is deferred.

| Area | Current state | Target (4C contract) | Gap |
|------|---------------|----------------------|-----|
| Route per kind | All marketplace kinds → `/product/[id]` | REQUEST → `/request/[slug]` | High |
| Section order | Ad-hoc component order | `DETAIL_SECTION_IDS` canonical | Medium |
| Trust | Blended rating, views, fans | `DiscoveryTrustContract` only | High |
| Value exchange | Price line only | Phase 4A full block | Medium |
| Actions | Generic buy/contact | Per-kind `DETAIL_ACTION_MATRIX` | Medium |
| Mobile sticky bar | Partial | Contract-driven per kind | Low |
| Inspiration | Separate `InspiratieDetail.tsx` | `INSPIRATION` detail kind | Low (align later) |
| Courier | `/bezorger/[username]` | `DELIVERY` detail kind | Low (profile ≠ listing) |

---

## Findings by kind

### PRODUCT / SERVICE / TASK / WORKSHOP / COACHING

**File:** `app/product/[id]/page.tsx` (+ child components)

- Single layout for all marketplace listing kinds  
- Trust section likely shows seller rating aggregate (not channel-separated)  
- No barter acceptance strip from Phase 4A  
- Availability UI varies by product fields, not by `DetailKindBehavior.availabilityType`  
- Primary CTA is purchase-oriented even for service/task kinds  

**Risk:** Users see wrong primary action and misleading blended trust on service listings.

### REQUEST

**Planned route:** `/request/[slug]` — **not implemented**

- Currently rendered through product page  
- Desired exchange block (4A) not surfaced  
- Proposal CTA not distinguished from order flow  

**Risk:** Request listings look like offers; barter intent is hidden.

### INSPIRATION

**File:** `components/inspiratie/InspiratieDetail.tsx`

- Four route families (`/inspiratie`, `/recipe`, `/garden`, `/design`)  
- Dish reviews — separate from marketplace trust contract  
- No value exchange section (correct per 4C)  
- Print/save actions exist — aligns with inspiration action matrix  

**Risk:** Low for 4C; future work is unify under one inspiration detail contract.

### DELIVERY (courier profile)

**File:** `app/bezorger/[username]/page.tsx`

- Courier profile, not a `ListingKind`  
- Delivery reviews — should map to `trust.courier` channel  
- No marketplace value exchange (correct per 4C)  

**Risk:** Low; treat as profile detail, not product detail.

---

## Forbidden signals audit (current UI)

The following appear in legacy detail/profile components and **must not** appear in the Phase 4C trust block:

| Signal | Found in legacy UI | 4C contract |
|--------|-------------------|-------------|
| `blendedRating` / `averageRating` | Likely on product page | ❌ Forbidden |
| `viewCount` | Possible on listings | ❌ Forbidden |
| `followerCount` / `fansCount` | Profile sidebar | ❌ Forbidden |
| `hcpPoints` | Profile/economy surfaces | ❌ Forbidden |
| `workspacePropsCount` / `itemPropsCount` | Community props | ❌ Forbidden |

Validator: `detailTrustUsesForbiddenSignals()` + `DETAIL_FORBIDDEN_SIGNALS`.

---

## Value exchange audit

| Capability | 4A contract | Current detail UI |
|------------|-------------|-------------------|
| Payment method emoji + label | ✅ | Price text only |
| Accepted main categories | ✅ | ❌ |
| Accepted subcategories | ✅ | ❌ |
| Desired exchange (REQUEST) | ✅ | ❌ |

Builder ready: `buildDetailValueExchangeBlock()` — not wired.

---

## Recommended wiring order (post-4C)

1. Introduce `DetailPageKind` resolver at page load  
2. Replace trust strip with `buildDetailTrustBlock()`  
3. Insert value exchange block below person row  
4. Swap action block to `actionsForDetailKind()`  
5. Split REQUEST to dedicated route  
6. Apply mobile/desktop layout from `buildMobileDetailLayout` / `buildDesktopDetailLayout`

---

## References

- [MARKETPLACE_DETAIL_PAGE_SYSTEM.md](../architecture/MARKETPLACE_DETAIL_PAGE_SYSTEM.md)  
- [MARKETPLACE_DETAIL_KIND_MATRIX.md](./MARKETPLACE_DETAIL_KIND_MATRIX.md)  
- [MARKETPLACE_DETAIL_PHASE4C.md](../progress/MARKETPLACE_DETAIL_PHASE4C.md)
