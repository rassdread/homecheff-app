# Exchange Surface Matrix — Audit

**Phase:** 4E  
**Date:** 2026-07-06  
**SSOT:** [MARKETPLACE_EXCHANGE_SUGGESTIONS.md](../architecture/MARKETPLACE_EXCHANGE_SUGGESTIONS.md)

---

## Legend

| Code | Surface |
|------|---------|
| T | Marketplace tile (feed grid) |
| P | Long-press preview sheet |
| D | Detail page |
| PR | Profile (owner) |
| PRv | Profile (visitor) |
| RS | Desktop right sidebar |
| FI | Mobile feed insert band |
| SH | Mobile bottom sheet |
| PU | Push / in-app notification |
| — | Not allowed |

**Density:** None · Teaser · Compact · Full  
**Ranking impact:** Always **None**

---

## Surface × suggestion type

| Type | T browse | T owner | P | D | PR | RS | FI | SH | PU |
|------|----------|---------|---|---|----|----|----|----|-----|
| `DIRECT_EXCHANGE` | — | Teaser | Compact | Full | Full | Compact | Compact | Full | Future |
| `REVERSE_EXCHANGE` | — | — | Compact | Full | Full | Compact | Compact | Full | Future |
| `MUTUAL_EXCHANGE` | — | Teaser | Compact | Full | Full | Compact | Compact | Full | **Primary** |
| `LOCAL_EXCHANGE` | — | — | Modifier | Chip | Chip | Chip | Chip | Chip | Modifier |
| `COMMUNITY_EXCHANGE` | — | — | — | Compact | Compact | Compact | — | Full | — |
| `MULTI_STEP_EXCHANGE` | — | — | — | Teaser | Compact | — | — | Full | Future 4H |

---

## Surface × viewer context

| Surface | Guest | Auth (no listings) | Auth (barter listings) | Viewing own detail | Viewing other detail |
|---------|-------|--------------------|------------------------|--------------------|----------------------|
| T browse | — | — | — | — | — |
| T owner dashboard | — | — | Teaser count | — | — |
| P | — | Locked teaser | 1 line | — | 1 line |
| D | — | — | — | Outbound top 3 | Inbound top 3 |
| PR owner | — | CTA “Create offer” | Module | — | — |
| PR visitor | — | — | — | — | — |
| RS | — | — | 2 cards | — | — |
| FI | — | — | Band @14/@28 | — | — |
| PU | — | — | Opt-in | — | — |

---

## Surface ownership vs discovery systems

| System | May host exchange suggestions? | Rule |
|--------|-------------------------------|------|
| `buildDiscoveryFeed` / section registry | **No** | Organic sections only |
| Tile sort / ranking engine | **No** | Suggestions never sort key |
| `resolveSponsored*` | **No** | Separate commercial lane |
| Activity cards (3C) | **No** | Different resolver; no merge |
| Growth surfaces (3M) | **Link only** | Footer link “See exchange opportunities” |
| `related_listings` (4C detail) | **No** | Same-maker listings ≠ exchange |
| `value_exchange` block (4A/4C) | **Adjacent** | Suggestions sit below, not inside |
| `OpportunityModule` (sidebar) | **Sibling** | Exchange module at 9.5, not inside opportunity |
| Messages | **Future 4I** | Thread context card |

---

## Per-surface specification

### Tile (browse feed) — forbidden

| Property | Value |
|----------|-------|
| Allowed | **No** |
| Reason | Any tile badge implies feed promotion |
| Alternative | Preview sheet on long-press |

### Tile (owner — my listings)

| Property | Value |
|----------|-------|
| Allowed | Teaser badge only |
| Max | “N ruilkansen” count |
| Tap | → Profile exchange module |
| Caps | Count refresh 1×/hour |

### Preview (long-press sheet)

| Property | Value |
|----------|-------|
| Allowed | Yes |
| Max | 1 teaser line + CTA |
| Min score | 65 |
| Required signal | Exact desired OR mutual |
| Ranking | None — sheet is user-initiated |

### Detail page

| Property | Value |
|----------|-------|
| Slot | After `value_exchange`, before `trust_block` |
| Max cards | 3 |
| Kinds | All except `INSPIRATION`, `DELIVERY` |
| REQUEST | Inbound `REVERSE_EXCHANGE` priority |
| PRODUCT/SERVICE barter | Outbound + inbound |
| CTA | From 4C `DETAIL_ACTION_MATRIX` |

### Profile (owner)

| Property | Value |
|----------|-------|
| Module id | `ExchangeSuggestionsProfileModule` |
| Max shown | 3 per tab (outbound / inbound) |
| Visitor | Hidden |
| Position | Below growth progress, above listings grid |

### Sidebar (desktop right)

| Property | Value |
|----------|-------|
| Module id | `ExchangeSuggestionModule` |
| Stack order | 9.5 (after Opportunity) |
| Size | `compact` |
| Max cards | 2 |
| Dismiss | 7-day cooldown |
| Guest | Hidden |

### Mobile feed insert

| Property | Value |
|----------|-------|
| Band id | `ExchangeSuggestionFeedBand` |
| Indices | @14, @28 |
| Max / session | 2 |
| Priority | Below activity cards (@4,12,24), above sponsored (@9,16,22) |
| Short feed (&lt;4 tiles) | Suppressed |
| Label | “Ruilkans” — never “Aanbevolen” |

### Bottom sheet

| Property | Value |
|----------|-------|
| Triggers | Preview CTA, detail “see all”, feed band tap |
| Max list | 10 items, paginated |
| Actions | View listing, message, dismiss |

### Notifications

| Property | Value |
|----------|-------|
| Status | Architecture only — see notification audit |
| Surfaces | PU + in-app inbox |
| Never | Email blast, SMS default-on |

---

## Visual distinction matrix

Exchange suggestions must be visually distinct from sponsored and discovery content.

| Element | Exchange suggestion | Sponsored | Discovery section |
|---------|--------------------|-----------|--------------------|
| Label | “Ruilkans” / “Exchange opportunity” | “Gesponsord” | Section title (e.g. “Nieuw”) |
| Slot type | `exchange_suggestion` | `sponsored` | `discovery_section` |
| Resolver | `resolveExchangeSuggestions` | `resolveSponsored*` | `buildDiscoveryFeed` |
| Paid | Never | Yes | Never |
| Affects tile order | Never | Never (insert only) | Section band only |

---

## Caps summary (all surfaces)

| Scope | Limit |
|-------|-------|
| Per page (detail) | 3 |
| Per page (sidebar) | 2 |
| Per session impressions | 8 |
| Per session feed inserts | 2 |
| Per seller / day | 3 |
| Per seller / page | 1 |
| Pair dismiss cooldown | 14 days |
| Global snooze after 3 dismissals | 24 hours |

---

## Forbidden placements

| Placement | Reason |
|-----------|--------|
| Organic tile sort key | Ranking change |
| Discovery section header | Section impersonation |
| Sponsored slot IDs | Commercial lane |
| Left sidebar | Filter column purity |
| Inspiration detail | Out of scope |
| Visitor profile | Privacy |
| Guest feed insert | No personal exchange context |
| HCP / reputation cards | Wrong mental model |

---

## Future i18n (not in 4E implementation)

| Namespace | Purpose |
|-----------|---------|
| `marketplace.exchange.signals.*` | 4D signal chips (existing) |
| `marketplace.exchange.suggestions.*` | 4F+ card titles, CTAs, types |
| `marketplace.exchange.notifications.*` | 4H push copy |

---

## References

- [MARKETPLACE_EXCHANGE_SUGGESTIONS.md](../architecture/MARKETPLACE_EXCHANGE_SUGGESTIONS.md)
- [EXCHANGE_NOTIFICATION_READINESS.md](./EXCHANGE_NOTIFICATION_READINESS.md)
- [SURFACE_OWNERSHIP_MATRIX.md](./SURFACE_OWNERSHIP_MATRIX.md)
- [MOBILE_SURFACE_ARCHITECTURE.md](../architecture/MOBILE_SURFACE_ARCHITECTURE.md)
- [SIDEBAR_ARCHITECTURE.md](../architecture/SIDEBAR_ARCHITECTURE.md)
