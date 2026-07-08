# Homepage Sidebar IA Audit — Phase 7F

Date: 2026-07-08
Scope: Desktop homepage Information Architecture consolidation. No redesign, no new
backend, no new business logic, no mobile layout changes.

---

## Component migration table

| Component | Previous location | New location | Reason | Risk |
|-----------|-------------------|--------------|--------|------|
| `RoleQuickLinksSection` | Right sidebar | Left — Quick Actions | Workspace actions belong left | Low |
| Quick Actions card (create/messages/browse) | Right sidebar | Removed / merged | Duplicate of RoleQuickLinks + env nav | Low |
| `MessagesUrgentSidebarCard` | Right sidebar | Removed from right | Messages in Mijn omgeving (left) | Low — urgent still in action center |
| Environment nav links | — | Left — Mijn omgeving | Personal navigation column | Low |
| Marketplace deep links | Mobile strip only | Left — Marketplace | Desktop parity with 7E canonical links | Low |
| `FeedFiltersPanel` / `FeedSidebarFilters` | Left column (only) | Left — bottom, collapsible | Filters under navigation; same state | Low |
| Welcome card | Right | Right (first) | Personal dashboard entry | None |
| `HomeReputationCompactCard` | Right | Right (#2) | Trust after welcome | None |
| `GrowthActionStack` | Inside surface stack | Right (#3) | HCP / growth progress before community | Low |
| `CommunityPulseBar` | Right | Right (#4) | Buurtmomenten | None |
| Community tips card | Right | Right (#5) | Education / tips | None |
| `CreatorMomentumCard` | Right | Right (tips block) | Momentum tips | None |
| `UserActionCenter` | Right (top) | Right (growth block) | Growth tasks, not navigation | Low |
| `HomeProfileProgressCard` | Right | Right (growth block) | Profile completion | None |
| `ReturnBelongingStrip` | Right | Right (growth block) | Belonging nudge | None |
| `DesktopRightSidebarSurfaceStack` | Right (full) | Right — `activity-modules` mode | Activity without duplicating growth | Low |
| `HomeRecommendedPromotions` | Right (mid) | Right (last) | Promotions after personal story | None |
| Gezocht spotlight link | Right | Removed | Duplicate of marketplace Wanted link | Low |
| View/category chips | Center feed header | Center (unchanged) | Discovery axis stays with results | None |
| `HomeMobileEcosystemStrip` | Mobile only | Mobile (unchanged) | Desktop IA does not touch mobile | None |

---

## 1. New left sidebar (workspace)

`HomeDesktopLeftSidebar` order:

1. **Quick Actions** — `RoleQuickLinksSection` (logged in) or guest create CTA
2. **Mijn omgeving** — static links to profile, deals, orders, messages, favorites
3. **Marketplace** — canonical category + inspiration + wanted deep links
4. **Discovery filters** — `FeedFiltersPanel` in collapsible section (default open)

Config: `lib/home/home-desktop-sidebar-ia.ts`

---

## 2. New right sidebar (community cockpit)

`HomeDesktopSidebar` reordered as personal dashboard:

Welcome → Reputation → HCP progress (`GrowthActionStack`) → Community pulse →
Tips → Growth tasks (`UserActionCenter`, profile progress) → Activity modules →
Promotions

---

## 3. Component migrations

See table above. No components deleted — only relocated or deduplicated.

---

## 4. Duplicate information removed

- Second "Snelle acties" card on right
- `RoleQuickLinksSection` on right
- Gezocht spotlight card (left marketplace has Wanted)
- `GrowthActionStack` inside activity stack when rendered in cockpit mode

---

## 5. Discovery filters

- Same `FeedSidebarFilters` state wiring via `GeoFeed` context
- Collapsible wrapper on left (desktop only)
- Category select aligned with Phase 7E (`DISCOVERY_CATEGORY_CHIP_OPTIONS`, includes Services)
- `hideHeading` when embedded in collapsible parent (no double title)

---

## 6. Community cockpit

Right column tells a story: who you are → trust → progress → neighbourhood →
tips → what to do next → what's happening → promos.

---

## 7. Growth & onboarding

`GrowthActionStack`, `UserActionCenter`, `HomeProfileProgressCard`,
`ReturnBelongingStrip`, `CreatorMomentumCard` — all on right, none on left.

---

## 8. Desktop IA

```
[Left workspace]     [Center discovery]        [Right cockpit]
Quick actions        Hero (full width above)
Mijn omgeving        View chips
Marketplace          Category chips
Filters (collapse)   Results + feed
```

---

## 9. Mobile regression

- `HomePageClient` mobile branch unchanged
- `HomeMobileEcosystemStrip` still `md:hidden`
- No changes to `FeedMobileToolbar` or mobile filter sheet

---

## 10. Performance

- No new fetch, provider, or GeoFeed state
- Same `FeedFiltersPanel` context slot
- Static link config only in `home-desktop-sidebar-ia.ts`

---

## 11. Deferred items

- Dedicated `MessagesUrgentSidebarCard` on left when unread (could revisit for visibility)
- Rename category slugs in URLs (`cheff` → `food`) — same as 7E deferral
- Further collapse of `FeedSidebarFilters` sections into accordion groups
