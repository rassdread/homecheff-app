# Discovery Phase 1 — Prerequisites Checklist

**Version:** V1 (Phase 0)  
**Last updated:** 2026-07-06

Checklist derived from completed foundation audits. Items must be resolved in priority order before Discovery Phase 1 consumes marketplace entities.

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Must resolve before Discovery Phase 1 starts |
| **P1** | Should resolve before trust-weighted discovery |
| **P2** | Can wait — does not block initial discovery |

---

## Foundation audit status

| Foundation | Audit status | Doc reference |
|------------|--------------|---------------|
| Marketplace Entity Architecture V1 | ✅ Complete | This doc set |
| Trust Stabilization & Social Signals V1 | ✅ Audited | Prior chat / trust docs |
| Identity, Roles & Profile Architecture V1 | ✅ Audited | `docs/PROFILE_V2_MIGRATION.md` |
| Recommendation & Discovery Blueprint V1 | ✅ Audited | `docs/HOMECHEFF_LOCAL_DISCOVERY.md` |
| Trust Foundation V1 (implementation) | ⚠️ Implemented, blending remains | `lib/trust/` |

---

## P0 — Must resolve before Discovery Phase 1

| # | Item | Current state | Risk | Impact | Dependency |
|---|------|---------------|------|--------|------------|
| P0-1 | **ListingKind specification signed off** | Spec doc created; not in code | Discovery filters built on wrong axis (price, legacy category) | Wrong sections, wrong hrefs, wrong SEO schema | [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md) |
| P0-2 | **`deriveListingKind()` implementation** | Not implemented | Feed continues classifying all offers as PRODUCT | Service/request/workshop chips unusable | LISTING_KIND_SPEC |
| P0-3 | **Feed taxonomy kind assignment** | `deriveFeedTaxonomy` → PRODUCT or INSPIRATION only | Service listings invisible to service discovery | Incomplete marketplace coverage | P0-2 |
| P0-4 | **REQUEST href placeholder** | REQUEST → `/inspiratie` | Broken UX, SEO confusion | Users land on wrong page | ROUTE_OWNERSHIP |
| P0-5 | **Props/Favorites deduplication on products** | Both buttons + same Favorite table | Inflated engagement signals | Discovery rank corruption | Social Signals V1 |
| P0-6 | **Stats API favorites/props fix** | Double-count products; dish favorites use wrong field | Wrong social proof on profiles | Profile tiles misleading | `/api/user/[userId]/stats` |
| P0-7 | **Entity boundary documentation frozen** | Phase 0 docs (this set) | Rework if teams build parallel models | Discovery + SEO divergence | ADR sign-off |
| P0-8 | **Legacy Listing feed merge decision** | Listings still in `/api/feed` | Duplicate items, split proposals | Inconsistent discovery pool | MARKETPLACE_CONFLICTS C1 |
| P0-9 | **Dish price sale leak** | Priced Dish → sale chip | Inspiration/commerce boundary blur | Wrong card type in Te koop | LISTING_KIND INSPIRATION |
| P0-10 | **Discovery reads taxonomy not sellerRoles alone** | Partial — products have specializations[] | Role-based matching misses services | Wrong recommendations | Identity audit |

---

## P1 — Should resolve before trust-weighted discovery

| # | Item | Current state | Risk | Impact | Dependency |
|---|------|---------------|------|--------|------------|
| P1-1 | **Split trust headline on profile** | Blended average in trust summary + stats | Users trust wrong signal | Bad matching decisions | REVIEW_ARCHITECTURE |
| P1-2 | **DishReview → Community Feedback** | Still named DishReview; in stats average | Inspiration affects trust | Service sellers penalized/boosted wrongly | Trust Stabilization |
| P1-3 | **Profile URL canonicalization** | `/seller`, `/bezorger` still live | Split SEO, split analytics | Duplicate profile discovery | ROUTE_OWNERSHIP |
| P1-4 | **Aanbod filters: services/tasks/workshops** | Defined but hidden | Profile discovery incomplete | Users can't browse service sellers | PROFILE_ENTITY_MAPPING |
| P1-5 | **Gezocht section for REQUEST** | Not a profile tab | Requests mixed in feed all-only | Matching UX gap | LISTING_KIND REQUEST |
| P1-6 | **Proposal fulfillment enum alignment** | Proposal PICKUP/DELIVERY vs CO 5 modes | Deal fulfillment mismatch | Delivery request failures | MARKETPLACE_CONFLICTS C6 |
| P1-7 | **Trust tier in discovery rank** | Trust-blind ranking today | Popular but untrusted surfacing | Marketplace safety | Trust Stabilization |
| P1-8 | **Accepted-value match index** | Schema fields exist; no index consumer | Barter discovery impossible | Incomplete value marketplace | Taxonomy foundation |
| P1-9 | **Orphan recommendations API** | `/api/recommendations/smart` unused + mock category | Dead code path confusion | Wasted integration effort | Deprecate or wire |
| P1-10 | **HCP excluded from discovery rank** | Documented; verify no leakage | Gamification distorts market | Unfair ranking | Identity audit |

---

## P2 — Can wait

| # | Item | Current state | Risk | Impact | Dependency |
|---|------|---------------|------|--------|------------|
| P2-1 | **REQUEST fields: expiresAt, urgency, budget** | Not on Product | Stale requests in index | Matching quality | Phase 2 requests |
| P2-2 | **Workshop event datetime fields** | availabilityDate only | Weak date discovery | Workshop filter limited | Phase 3 |
| P2-3 | **Service calendar / duration** | Not on Product | No slot-based discovery | Coaching matching manual | Phase 4 |
| P2-4 | **Courier job board discovery** | DeliveryRequest private | Couriers manually assigned | Delivery scale | Delivery V2 |
| P2-5 | **Legacy Listing migration** | Data may exist | Rare duplicates | One-time cleanup | Phase 1 normalization |
| P2-6 | **Reservation/Transaction deprecation** | Schema remains | Confusion for new devs | Low if unused | Phase 1 |
| P2-7 | **Category × location SEO landing automation** | Manual SEO pages exist | Manual SEO scale | Growth, not core discovery | Phase 6 |
| P2-8 | **`/request/[slug]` route** | Not built | REQUEST SEO policy blocked | Search traffic | Phase 2 |
| P2-9 | **Digital product file metadata** | fulfillment.digital only | Weak digital discovery | Niche | Phase 1+ |
| P2-10 | **CommunityOrder cancel API** | Missing | Ops gap | Trust edge cases | Trust V1 follow-up |

---

## Discovery Phase 1 — allowed assumptions

When P0 items are signed off, Discovery Phase 1 **may assume**:

- All marketplace listings live on `Product` with V2/V3 fields
- `listingIntent` distinguishes OFFER vs REQUEST
- Taxonomy ids in `specializations[]` are canonical for matching
- GeoFeed (`/api/feed` + Dorpsplein) is the primary discovery surface
- Inspiration is `Dish` with separate chip — not Product
- Trust has three channels (product, deal, courier) — even if UI not split yet
- Product detail SEO URLs are stable at `/product/[slug]`

---

## Discovery Phase 1 — must NOT assume

- `ListingKind` exists in code (until P0-2 implemented)
- SERVICE/TASK/REQUEST feed chips work
- `/request/[slug]` exists
- Trust-weighted ranking is live
- Props and Favorites are distinct on products
- Profile services filter works
- Smart recommendations API is wired
- Legacy Listing model is gone
- Courier jobs are discoverable
- Workshop date filtering is accurate

---

## Sign-off checklist (human)

- [ ] ADR-MARKETPLACE-FOUNDATION-V1 approved
- [ ] LISTING_KIND_SPEC derivation rules approved
- [ ] P0 items assigned to phases with owners
- [ ] Trust blending fix prioritized before trust-weighted discovery
- [ ] Gezocht profile section approved as separate from Aanbod
- [ ] REQUEST SEO policy (noindex until stable) approved

---

## Related documents

- [ADR-MARKETPLACE-FOUNDATION-V1.md](../decision-records/ADR-MARKETPLACE-FOUNDATION-V1.md)
- [MARKETPLACE_CONFLICTS.md](../audits/MARKETPLACE_CONFLICTS.md)
- [marketplace-entity-validation.md](../audits/marketplace-entity-validation.md)
