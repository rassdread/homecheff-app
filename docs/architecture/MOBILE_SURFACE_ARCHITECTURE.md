# Mobile Surface Architecture

**Phase:** 3D — Architecture only  
**Last updated:** 2026-07-06

---

## Principles

Mobile has **one primary column**. Competing goals are separated by **resolver tier**, not by cramming everything into scroll.

1. **Feed = browse** — organic tiles + discovery sections  
2. **Inserts = timed nudges** — platform, activation, sponsored (fixed order)  
3. **Sheets = deep control** — filters, create flow, preview (T3 long-press)  
4. **Profile = persistent progress** — owner activations, partner status  
5. **Push = rare, high-intent** — workshop tomorrow, help urgent (future S8)

---

## Surface inventory (mobile)

| Surface | Component / pattern | Tier |
|---------|---------------------|------|
| Hero area | `HomeHeroSection` — chips, search | S7 |
| Feed grid/list | `GeoFeed` + `MarketplaceTileCompact` | S2 |
| Discovery section bands | `DiscoveryFeedSectionHeading` | S2 |
| Activity cards | `ActivityCardFeedBand` after rows 4, 12, 24 | S3 |
| Home mobile inserts | `HomeMobileFeedInserts` — verticals, pulse, promos | S7 |
| Filter sheet | `FeedMobileFilterSheet` | S1 |
| Tile long-press preview | `MarketplaceLongPressPreview` | S2/S3 boundary |
| Bottom navigation | `BottomNavigation` | S0 |
| User action center | `UserActionCenter` mobileCompact | S7 |
| Notifications (future) | Push + in-app inbox | S8 |

**No right sidebar on mobile** — right-column modules map to feed inserts, sheets, or profile.

---

## Feed insert resolution order

Fixed priority (never invert):

```
1. Discovery section header (organic)
2. Home platform inserts (verticals @1, pulse @3, promo @4, …)
3. Activity cards (logged-in @4, 12, 24)
4. Sponsored placements (offset @9, 16, 22 — when enabled)
5. Inspiration interleave (organic)
```

Activity cards **yield** to platform inserts at same index. Sponsored **yield** to both.

---

## What stays in feed

| Content | Mobile surface | Rationale |
|---------|----------------|-----------|
| Marketplace tiles | Feed grid | Core discovery |
| Section headers | Feed bands | Organic shelves |
| Activity cards (max 2/session) | Feed full-width band | High-intent nudge |
| Sponsored tiles (future, max 3) | Feed inline | Commercial — labeled |
| Platform promos | Feed inserts | HomeCheff CTAs |
| Inspiration slots | Interleaved | Separate chip mode |

---

## What becomes activity cards (not duplicate elsewhere)

| Activation | Mobile |
|------------|--------|
| Profile completion | Card @4 or 12 |
| Nearby help | Card when REQUEST pool |
| Share QR | Card — share sheet on tap |
| Become courier | Card or profile module if dismissed 2× |
| Invite friend | Card low priority |
| Workshop attend | `EventModule` → card if date &lt; 7d |

**Rule:** If shown in feed card this session, suppress same activation in push/profile banner.

---

## What becomes drawers / sheets

| Content | Surface |
|---------|---------|
| All filters | `FeedMobileFilterSheet` (existing) |
| Tile preview detail | Long-press bottom sheet (T3) |
| Create listing | `BottomNavigation` quick add sheet |
| Message compose | Chat modal |
| Partner onboarding | Full-screen flow from CTA — not feed scroll |
| Filter-adjacent sort | Sheet tab (future) |

---

## What becomes profile modules

| Content | Surface |
|---------|---------|
| Seller onboarding | Profile owner tab |
| Workspace photos | Profile edit |
| Stripe connect | Verkoper settings |
| Ambassador dashboard | Profile / welkom stats |
| Courier status | Delivery dashboard link |
| Completed activations history | Profile “Buurtacties” (future) |

Profile **visitor** view: no activation modules (3B rule).

---

## What becomes notifications (future S8)

| Trigger | Channel | Max frequency |
|---------|---------|---------------|
| Workshop in 24h | Push opt-in | 1/event |
| Request needed-by 48h | Push if user saved | 1 |
| Unread urgent message | In-app + optional push | existing comms |
| Partner application approved | In-app | 1 |
| New neighbour welcome | In-app digest | weekly |

**Never push:** generic “come back”, sponsored content, HCP nudges, ranking changes.

---

## Mobile module mapping (right sidebar → mobile)

| Desktop right module | Mobile equivalent |
|---------------------|-------------------|
| `CommunityPulseBar` | Feed insert `pulse` @3 |
| `HomeRecommendedPromotions` | Feed insert promo |
| `ActivityCardSidebarStack` | Feed activity cards |
| `SponsoredModule` spotlight | Feed inline or trailing card |
| `OpportunityModule` | Activity card or profile entry |
| `QuickActions` | Bottom nav + FAB |
| `UserActionCenter` | Top compact bar above feed |
| Reputation | Feed insert reputation |

---

## Short feed behavior

When organic listings &lt; 4:

- No sponsored inline
- Max 1 activity card after row 2 (if eligible)
- Platform trailing promo priority over sponsored
- Sidebar-equivalent modules **not** rendered — avoid empty-stack noise

---

## Thumb zone & density

| Zone | Content |
|------|---------|
| Top | Hero, action center — wayfinding |
| Mid | Feed browse — primary attention |
| Insert bands | Full-width cards — clear separation |
| Bottom | Nav — create, messages |

Max **1** full-width non-tile band per 4 tile rows (inserts + activations combined).

---

## References

- [SIDEBAR_ARCHITECTURE.md](./SIDEBAR_ARCHITECTURE.md)
- [../audits/SURFACE_OWNERSHIP_MATRIX.md](../audits/SURFACE_OWNERSHIP_MATRIX.md)
- [DISCOVERY_SPONSORED_PLACEMENTS.md](./DISCOVERY_SPONSORED_PLACEMENTS.md) § Mobile
