# Discovery Experience Audit — UX-FIN Phase 5

**Date:** 2026-07-07  
**Scope:** Homepage, feed, filters, chips, onboarding, information hierarchy, first impression. Read-only audit + one safe hygiene fix. No new marketplace functionality; no ranking/search/economy/payment/backend changes.

Builds on Phase 1–3B (navigation, journey polish) and Phase 4/4B/4C (performance preserved).

---

## Executive summary

HomeCheff’s **discovery mechanics are strong** (local framing, vertical chips, tailored empty states, request-card differentiation, performance architecture). The biggest gaps are **first-impression education** (sell/earn, Gezocht, differentiation vs generic marketplaces) and **filter UX consistency** (dual search fields, fragmented reset, three parallel filter surfaces). Community proof exists but is **desktop-heavy and login-gated**, so guests see little social proof.

---

## 1. Homepage audit (5.1 + 5.2)

### What works
- Warm local framing: “dichtbij”, “in jouw buurt”, live label (`homeDorpsplein.heroLiveLabel`).
- Three verticals communicated on desktop: chips + orbit + platform strip (`HomeHeroSection.tsx`).
- Clear discover CTA; guest CTAs open explanation panels instead of dead-ends.
- Information hierarchy desktop: hero → feed (center) → sidebar (actions + community). Mobile: feed-first compact hero.

### Frictions
| Issue | Severity | Detail |
|---|---|---|
| Sell/earn invisible | High | `ctaShare` = “Deel wat je maakt” reads as social share, not sell/get paid |
| No marketplace differentiation | High | “Digitaal dorpsplein” buried in sidebar/schema, not hero |
| Gezocht absent from hero | High | Requests only visible as feed chip |
| Mobile hero thin | High | Chips, orbit, platform strip hidden (`lg:` / `hidden sm:`) — title + 2 CTAs only |
| Community economy unexplained | Medium | Klusjes/Ruilhandel chips without “why” |
| Stale `home.*` copy block | Medium | Legacy hero/howItWorks/categories unused (`nl.json` ~6064–6095) |
| Duplicate schema strings | Low | `schemaWebsiteDescription` in `home` and `homePhase1` |
| Sidebar “Binnenkort” placeholder | Low | Permanent coming-soon spotlight for logged-in desktop users |

### Information hierarchy notes
- **Duplicate/overlap:** three “what’s alive nearby” strings (heroLiveLabel, communityPulse.heading, heroVisualCaption).
- **Missing for guests:** sidebar community modules mostly behind `session?.user`; mobile has no sidebar at all.
- **Balance:** desktop hero is rich; mobile sacrifices education for feed-first speed.

---

## 2. Feed audit (5.3)

### Card information order (consistent)
Media (+ badges, favorite) → person row (avatar, name, distance) → title → value/price + accepted-values → trust cue.

### Distinctness
| Mode | Distinct? | How |
|---|---|---|
| Gezocht (request) | **Yes** | Amber badge 🙋, “requested by” eyebrow, amber person row |
| Sale | Partial | Same shell as inspiration; category/kind badges only |
| Inspiration | Partial | Lightbulb specialization badge; otherwise identical to sale |

### Minor issues
- Trust appears twice (media badge + bottom cue) — possible redundancy.
- Standard vs Compact: different media ratio (4:3 vs 4:5), Compact omits share button in title row.

### Strength
- Primitives are well factored (`MarketplaceTileStandard/Compact`, shared `TileMedia`, `TilePersonRow`, etc.).

---

## 3. Filter audit (5.4)

### Present filters
Scope (nearby/national/international) · place/postcode + GPS · radius km · search `q` · category select (cheff/garden/designer) · sort · refine `searchQuery` · price min/max (behind nested toggle).

### Issues
| Issue | Impact |
|---|---|
| **Two search fields** (`q` + `searchQuery`) | Users cannot tell them apart — highest filter friction |
| **Three filter surfaces** (sidebar, mobile toolbar+sheet, inline panel) | Drift risk; radius presets mobile-only |
| **Fragmented reset** | `resetDraftFilters`, `clearFilters`, two-call empty-state reset |
| **Draft/apply vs instant** | Text filters deferred; chips/scope/sort instant — inconsistent mental model |
| **No applied-filter summary on desktop** | Mobile has active location chip; desktop does not |
| **Price behind nested `showFilters`** | Toggle inside an already-expanded panel |
| **Category select vs vertical chips** | Mode = chips; vertical = dropdown — split “what am I browsing” axis |

### What works
- Scope/radius interplay (radius disabled when not nearby).
- Sort hides distance without coords; auto-fallback to newest.
- Empty states with contextual recovery (widen radius, switch chip, inspiration fallback).

---

## 4. Chips audit (5.5)

**Order:** Alles → Te koop → Inspiratie → Gezocht  
**Styling:** Active = primary brand white text; inactive = cream + border. Consistent desktop/mobile.

**Overlap:** `feed.chipSale` reused in empty-state CTAs (acceptable). Verticals not chips — only in category `<select>`.

---

## 5. Discovery flow audit (5.7)

| Step | Assessment |
|---|---|
| Homepage → feed | Smooth (scroll CTA, `#homecheff-feed`) |
| Feed → preview/detail | Card → detail via `FeedMarketplaceCard` / tile router |
| Detail → chat/proposal | Exists; request flow distinct on cards |
| Back → feed | **Instant** (Phase 4 return cache + scroll restore) |
| Continue exploring | Filters/chips preserved in session state |

**Friction:** guest may not discover Gezocht or sell path before leaving.

---

## 6. Mobile vs desktop (5.8 + 5.9)

| Aspect | Mobile | Desktop |
|---|---|---|
| Hero | Compact strip; no vertical chips/orbit | Full hero + orbit + platform strip |
| Filters | Toolbar + bottom sheet; radius presets | Sidebar or inline panel; no radius presets |
| Feed density | Default 1 column | Default 2 columns (1/2/3 via external store) |
| Community | UserActionCenter compact; no sidebar | Rich sidebar (login-gated modules) |
| Thumb reach | Filter sheet good; hero CTAs reachable | Mouse hover on feed media (desktop-only) |

**Density:** defaults verified — desktop 2, mobile 1; switch instant, no refetch (Phase 4/5.13).

---

## 7. Community visibility (5.10)

| Signal | Visibility |
|---|---|
| Community (general) | Subtle — sidebar card + tiny hero strip (desktop) |
| Local economy | Subtle — chips; OpportunityEconomyCard login-gated |
| Reviews | Data-dependent pulse line |
| Fans/Follows | Pulse moments; “Fans” not named on homepage |
| Vertrouwen | Reputation card; guests see “Jouw reputatie” incorrectly |
| Afspraken | **Absent** on homepage |
| Props | **Absent** |
| Collaboration | Community card copy; “Help mee” only in feed/request context |

---

## 8. Copy audit (5.11)

- **NL/EN parity:** `homePhase1`, `homeDorpsplein`, `home` — **100% key parity** (validator 32/32, 19/19, 221/221).
- **Jargon:** “Buurtmomenten”, “Dorpsplein” undefined for newcomers.
- **Ambiguity:** “Deel” = list-for-sale vs affiliate “Deel je link”.
- **Stale keys:** entire unused `home.*` homepage block; unused `heroStrip*Hint` keys.
- **Implemented hygiene:** removed hero orbit `console.log` on mount.

---

## 9. Consistency (5.12)

- Chips: consistent active styling across breakpoints.
- Filters: **inconsistent** — three implementations, dual search, mode chips vs category select.
- Cards: strong primitive sharing; sale/inspiration need stronger mode tint.
- Hero vs feed: hero educates verticals; feed educates Gezocht — **split responsibility**, hero incomplete on mobile.

---

## 10. UX quick wins (safe, no backend)

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Clarify `homePhase1.ctaShare` (sell/earn, not “delen”) | i18n only | High |
| 2 | One-line hero/subtitle mention of Gezocht or community economy | i18n only | High |
| 3 | Mobile: show 2–3 hero chips (not full set) | Small UI | Medium |
| 4 | Guest reputation card: “Ontdek vertrouwen” not “Jouw reputatie” | i18n + guard | Medium |
| 5 | Merge `q` + `searchQuery` into one field | Filter refactor | High |
| 6 | Single “Reset all filters” (filters + chip) | GeoFeed | Medium |
| 7 | Applied-filter chips on desktop | GeoFeed | Medium |
| 8 | Sale vs inspiration tile accent (badge/tint) | Tile badges | Medium |
| 9 | Remove or repurpose sidebar “Binnenkort” placeholder | Copy | Low |
| 10 | Archive/document stale `home.*` keys (no runtime change) | Docs/cleanup | Low |

**Done this phase:** hero debug log removed; discovery validator added.

---

## 11. Larger improvements (deferred)

- Hero differentiation paragraph vs Marktplaats/Etsy/FB.
- Unified filter component (one surface, responsive layout).
- Promote verticals to chips alongside mode chips.
- Guest-visible community proof module (not login-gated).
- Mobile hero education panel (reuse `GuestSalesInfoPanel` patterns).
- Stale `home.*` copy deprecation in i18n.
- List virtualization / design-system migration (out of scope).

---

## 12. Performance regression (5.13)

All Phase 4/4B/4C architecture **preserved**. Validator `scripts/validate-discovery-experience.ts`: **23/23**.

Verified: density external store (default 2/1), density not in fetch deps, homepage return cache + SWR, single GeoFeed mount, prior guards present, no hero debug logging.

---

## Recommended implementation order

1. **Copy quick wins** — ctaShare, Gezocht mention, guest reputation label (i18n, zero perf risk).
2. **Filter consolidation** — merge dual search; global reset; applied chips.
3. **Mobile hero chips** — lightweight vertical education without full hero height.
4. **Tile mode differentiation** — inspiration vs sale visual accent.
5. **Filter surface unification** — reduce three-way drift (larger refactor).
6. **Guest community module** — visible social proof without login.
7. **i18n cleanup** — deprecate stale `home.*` block.

---

## Validation

```
npx tsx scripts/validate-discovery-experience.ts   # 23/23
npx tsx scripts/validate-runtime-performance-phase4c.ts  # 26/26 (regression)
npm run build                                      # pass
```
