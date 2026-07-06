# Sidebar Architecture

**Phase:** 3D — Architecture only  
**Last updated:** 2026-07-06

---

## Philosophy

| Column | Width | Purpose | Tone |
|--------|-------|---------|------|
| **Left** | 280px | Navigation · filters · feed controls | Neutral, utilitarian |
| **Right** | 320px | Opportunities · activation · community · growth | Warm, action-oriented |

**Left answers:** “What am I looking at?”  
**Right answers:** “What can I do next in the real world?”

Center column remains **discovery browse** — neither sidebar duplicates the feed grid.

---

## Left sidebar — allowed content (S1)

### Current (`FeedFiltersPanel`)

- Feed chip context (sale / inspiration — via hero)
- Place / radius / scope
- Category & subcategory
- Sort (when not discovery-smart)
- Price range, search query
- Layout toggle (grid density)
- Saved searches (future)

### Future left modules (optional, low priority)

| Module | Rationale |
|--------|-----------|
| `NavigationModule` | Primary wayfinding links (Discover, Messages, Sell) — if moved from bottom nav on desktop |
| `FeedScopeModule` | Nearby vs national pill — already filter-adjacent |
| `MapToggleModule` | Switch center to map view (future) |

### Forbidden on left

- Sponsored placements
- Activity / activation cards (except filter-related onboarding tooltip)
- Partner invite flows
- Community challenges
- Recommendation carousels
- Reputation / HCP gamification (belongs right or profile)

---

## Right sidebar — stack order (top → bottom)

Proposed **canonical stack** for `HomeDesktopSidebar` refactor (3E). Existing components mapped.

| Order | Module type | Current component | Tier |
|-------|-------------|-------------------|------|
| 1 | `WelcomeModule` | Welcome line card | S7 |
| 2 | `ActionCenterModule` | `UserActionCenter` | S7 |
| 3 | `UrgentCommsModule` | `MessagesUrgentSidebarCard` | S8 |
| 4 | `RoleLinksModule` | `RoleQuickLinksSection` | S1/S7 |
| 5 | `ReputationModule` | `HomeReputationCompactCard` | S4 |
| 6 | `CommunityModule` | `CommunityPulseBar` | S4 |
| 7 | `SponsoredModule` | `sidebar_spotlight` (future) | S6 |
| 8 | `ActivationModule` | `ActivityCardSidebarStack` (future) | S3 |
| 9 | `OpportunityModule` | Partner / ambassador / courier | S5 |
| 10 | `EventModule` | Workshop nearby / local event | S5 |
| 11 | `PlatformPromoModule` | `HomeRecommendedPromotions` | S7 |
| 12 | `QuickActionsModule` | Create / messages / fans | S7 |
| 13 | `GrowthModule` | `CreatorMomentumCard`, `ReturnBelongingStrip` | S4/S5 |
| 14 | `ProfileProgressModule` | `HomeProfileProgressCard` | S3 |

**Collapse rule:** When stack height &gt; viewport, modules 8–14 collapse into accordion **“Meer in je buurt”** — activations and opportunities stay above fold when eligible.

---

## Module type system

### Base: `SidebarModule`

```typescript
type SidebarModuleKind =
  | 'navigation'
  | 'filter_adjacent'
  | 'activation'
  | 'opportunity'
  | 'sponsored'
  | 'community'
  | 'event'
  | 'partner'
  | 'platform'
  | 'lifecycle';

type SidebarModule = {
  id: string;
  kind: SidebarModuleKind;
  priority: number;           // stack sort
  size: 'compact' | 'standard' | 'hero';
  collapsible: boolean;
  dismissible: boolean;
  cooldownDays?: number;
  guestVisible: boolean | 'teaser';
  dataSource: 'activation_engine' | 'sponsored_slot' | 'editorial' | 'static';
};
```

### `ActivationModule` (S3)

- Source: `futureSlots.activity_cards` filtered to `desktop_sidebar` surface
- Max **3** stacked; **1** expanded at a time when `collapseThreshold` exceeded
- Maps 3B `ActivityCardContract` — same dismiss/cooldown as feed
- Examples: profile completion, share QR, nearby help

### `OpportunityModule` (S5)

- Source: activation library PARTNER + BUSINESS + EARN categories
- Not paid — distinct from `SponsoredModule`
- Examples: become courier, invite sports club, support starter
- Rotation: max 1 per session per sub-type; 14-day dismiss cooldown

### `SponsoredModule` (S6)

- Source: `futureSlots.sponsored_placements` sidebar slots only
- Slots: `sidebar_spotlight` (hero), `sidebar_compact` ×2
- **Mandatory** “Gesponsord” label
- Dedup with feed sponsored (same `campaignId` hidden)

### `CommunityModule` (S4)

- Source: editorial + pulse API — **not** ranking
- `CommunityPulseBar`, optional `CommunitySpotlight` (weekly story)
- No challenge leaderboards in sidebar (avoid spam)

### `EventModule` (S5)

- Source: WORKSHOP listings + future event entity
- “Workshop nearby” — geo + date window
- Max 1; expires when date passes → `expired` lifecycle

### `PartnerModule` (S5)

- Subtype of Opportunity — institutional invites
- Municipality, school, sports club, business
- Always voluntary share / link — no address book scraping

---

## Sizes

| Size | Height budget | Use |
|------|---------------|-----|
| `compact` | ~72–96px | Pulse row, compact promo, single-line CTA |
| `standard` | ~120–180px | Activity card, opportunity card |
| `hero` | ~200–280px | Sponsored spotlight, featured workshop |

---

## Rotation rules

| Module kind | Rotation |
|-------------|----------|
| Activation | Priority sort from engine; rotate on dismiss |
| Opportunity | Round-robin within eligible pool per 7d |
| Sponsored | Campaign schedule + impression cap |
| Community spotlight | Weekly editorial pick |
| Event | Nearest date first; auto-expire |
| Platform promo | Existing `HomeRecommendedPromotions` schedule |

**No rotation** for: filters (left), urgent messages, welcome.

---

## Collapse behavior

```
expandedCount = modules with size hero or standard visible
if (expandedCount > 2 && viewport < threshold) {
  collapse modules priority < 70 into accordion
}
```

Activation modules with `priority >= 90` never collapse (verify email, urgent help).

---

## Sticky & scroll

- Left and right columns: independent scroll (`overflow-y: auto`)
- Sponsored spotlight: may use `position: sticky; top: 0` within right column **only when** no urgent comms module
- Filters on left: sticky subsection headers inside panel

---

## Integration points

| System | Sidebar touchpoint |
|--------|-------------------|
| Activity cards 3B | `ACTIVITY_CARD_SIDEBAR_PLACEMENT` → right stack slot 8 |
| Sponsored 3A-EXT | Slots 7, 11 — separate component |
| Discovery sections | **None** — sections stay center only |
| Activation library 3C | Feeds `OpportunityModule` + `ActivationModule` |
| HomePromotion | `PlatformPromoModule` — do not merge with sponsored |

---

## References

- [SURFACE_SYSTEM_VISION.md](./SURFACE_SYSTEM_VISION.md)
- [../audits/SURFACE_OWNERSHIP_MATRIX.md](../audits/SURFACE_OWNERSHIP_MATRIX.md)
- [DISCOVERY_SPONSORED_PLACEMENTS.md](./DISCOVERY_SPONSORED_PLACEMENTS.md) § Desktop sidebar
