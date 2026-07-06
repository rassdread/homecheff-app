# Marketplace Discovery Card Rules

**Status:** Audit only — binding presentation rules for Discovery surfaces  
**Last updated:** 2026-07-06  
**Scope:** Feed, discovery sections, search, profile preview grids. **No** ranking, API, or section eligibility changes.

---

## 1. Purpose

Single rulebook for **what may appear on a discovery card** and **how sections interact with tiles**. Consumed by:

- `lib/marketplace/tiles/*` builders (T1)
- `MarketplaceTileRouter` (T1)
- QA checklists

---

## 2. Data contract

### 2.1 Required input

| Source | When |
|--------|------|
| `DiscoveryReadModel` | Preferred — trust channels, listing kind, person |
| `GeoFeedCardItem` + `discovery` block | Feed transport — mapped via `map-to-tile-model` |

### 2.2 Kind resolution

```text
deriveListingKind(product) → ListingKind
```

Never infer kind from legacy `category` (CHEFF/GROWN/DESIGNER) or price alone.

| Entity | Kind |
|--------|------|
| `Product` OFFER | PRODUCT / SERVICE / TASK / WORKSHOP / COACHING |
| `Product` REQUEST | REQUEST |
| `Dish` / inspiration entity | INSPIRATION |

### 2.3 Person row identity

| Kind | Person shown | Role label (i18n, optional) |
|------|--------------|------------------------------|
| PRODUCT, SERVICE, TASK, WORKSHOP, COACHING | Seller profile | — |
| REQUEST | **Requester** (buyer) | `Gezocht door` |
| INSPIRATION | Creator | — |

**Rule R-PERSON-1:** REQUEST cards must never show seller-style “aanbieder” copy for the requester row.

---

## 3. Universal tile rules

| ID | Rule |
|----|------|
| **R-UNIV-1** | One tap target — entire card navigates to detail |
| **R-UNIV-2** | No full-width CTA button on tile |
| **R-UNIV-3** | Favorite heart only as inline action (Standard: + share) |
| **R-UNIV-4** | Max badges: Compact 2, Standard 3, Mini 1 |
| **R-UNIV-5** | Max one trust **row** on Compact; two segments on Standard |
| **R-UNIV-6** | Media ≥ 60% visual weight on Compact |
| **R-UNIV-7** | No `UserStatsTile`, blended rating, views, fans, HCP on tile |
| **R-UNIV-8** | Trust from `DiscoveryReadModel.trust` channels only |
| **R-UNIV-9** | Price from `priceModel` + cents — never hardcoded |
| **R-UNIV-10** | i18n for all user-visible strings (NL + EN) |

---

## 4. Trust channel rules

### 4.1 Channel priority by kind

| Kind | Primary | Secondary | Forbidden on tile |
|------|---------|-----------|-------------------|
| PRODUCT | `trust.product` | `trust.deal` | Blended average |
| SERVICE | `trust.deal` | `trust.product` if checkout | Courier |
| TASK | `trust.deal` | tier | Product-only when deals exist |
| WORKSHOP | `trust.deal` | tier | — |
| COACHING | `trust.deal` | tier | — |
| REQUEST | requester `trust.deal` | tier | Product reviews as seller |
| INSPIRATION | **none** | — | All trust channels |

### 4.2 Trust badge

Show `betrouwbare-verkoper` (or equivalent) **only** when snapshot includes verified seller badge — same as today’s discovery trust bundle.

### 4.3 Tier cue

`✓ Ervaren maker` (tier ≥ 4) — fallback when review counts are zero. Never duplicate tier + full review line on Compact.

---

## 5. Price & payment rules

### 5.1 OFFER kinds

| priceModel | Display |
|------------|---------|
| `FIXED` | Formatted EUR |
| `FROM_PRICE` | `Vanaf €…` |
| `HOURLY` | `€…/uur` |
| `DAILY` | `€…/dag` |
| `ON_REQUEST` | `Prijs op aanvraag` |
| `VOLUNTARY` | `Vrijwillige bijdrage` |
| `BARTER_ONLY` | `Ruil` |
| `MONEY_AND_BARTER` | `€… + ruil` |
| `CONTACT` | `Prijs op aanvraag · Contact` |

### 5.2 Kind suffix (compact price line)

| Kind | Suffix |
|------|--------|
| SERVICE | ` · Dienst` |
| TASK | ` · Taak` |
| WORKSHOP | ` · Workshop` (if date not redundant) |
| COACHING | ` · Coaching` |
| PRODUCT | none |
| REQUEST | see §5.3 |

### 5.3 REQUEST

| Case | Line |
|------|------|
| No budget | `Voorstel welkom` or `Gezocht` |
| Budget (future) | `Budget €…` |
| VOLUNTARY | `Tegen vrijwillige bijdrage` |

**R-PRICE-REQ-1:** No HOMECHEFF checkout price styling on REQUEST tiles.

### 5.4 INSPIRATION

**R-PRICE-INS-1:** No monetary display. Category label only (`Recept`, `Kweek`, `Design`).

### 5.5 Barter / accepted values

| Surface | Rule |
|---------|------|
| Tile | **Omit** accepted-values row (density) |
| Preview | Show up to 5 chips |
| Standard desktop | Optional single “+ ruil” hint if `MONEY_AND_BARTER` |

---

## 6. Badge rules

### 6.1 Global priority (first wins)

1. Sponsored *(reserved — not T1)*
2. **Gezocht** (REQUEST only)
3. **Workshop date** (WORKSHOP with `availabilityDate`)
4. ListingKind label (if not redundant)
5. Primary specialization
6. Accepted value chip (barter — defer to preview if slots full)
7. Trust badge

### 6.2 Kind-specific overrides

| Kind | Mandatory badge |
|------|-----------------|
| REQUEST | `Gezocht` slot 1 |
| WORKSHOP | Date badge when `availabilityDate` set |
| INSPIRATION | Vertical category when slots available |

### 6.3 Visual semantics

| Badge | Tone |
|-------|------|
| Gezocht | Amber / neutral — not “Te koop” green |
| Workshop date | Calendar icon + short date |
| ListingKind | Muted chip — not louder than spec |

---

## 7. Discovery section rules

### 7.1 Section inventory

| Section ID | Allowed kinds | Default limit |
|------------|---------------|---------------|
| `nearby` | MARKETPLACE_KINDS* | 20 |
| `trusted_makers` | MARKETPLACE_KINDS* | 15 |
| `top_rated` | MARKETPLACE_KINDS* | 15 |
| `trending` | MARKETPLACE_KINDS* | 15 |
| `new_creators` | MARKETPLACE_KINDS* | 12 |

\*PRODUCT, SERVICE, TASK, WORKSHOP, COACHING, REQUEST — **excludes INSPIRATION**

### 7.2 Presentation in sections

| ID | Rule |
|----|------|
| **R-SEC-1** | **Same tile component** for every section — no section-specific layouts |
| **R-SEC-2** | Section context = **heading + description only** (`DiscoveryFeedSectionHeading`) |
| **R-SEC-3** | Do not inject section id into badge or trust text |
| **R-SEC-4** | Item order = ranking engine output — tile does not re-sort |
| **R-SEC-5** | Empty section → hide band (existing behavior) |

### 7.3 Section × kind eligibility (presentation note)

Presentation is identical when eligible. Typical **eligibility** (unchanged — ranking layer):

| Section | Kinds often present |
|---------|---------------------|
| nearby | All marketplace kinds — geo weighted |
| trusted_makers | PRODUCT, SERVICE, WORKSHOP, COACHING |
| top_rated | PRODUCT-heavy |
| trending | All |
| new_creators | All — new seller signal |
| REQUEST | May appear in nearby / tail — rare in trusted/top |

**R-SEC-6:** Tile must not assume which section rendered it — no `if section === 'nearby'` field logic.

### 7.4 INSPIRATION in feed

| ID | Rule |
|----|------|
| **R-FEED-INS-1** | INSPIRATION interleaved in main feed — **not** in section bands |
| **R-FEED-INS-2** | `mode=inspiration` on router |
| **R-FEED-INS-3** | Inspiration chip filter shows inspiration-only stream — same tile rules |

---

## 8. Feed chip & filter interaction

| User filter | Effect on cards |
|-------------|-----------------|
| `feedChip=sale` | OFFER kinds only — REQUEST hidden |
| `feedChip=request` | REQUEST emphasis (future) |
| `feedChip=inspiration` | INSPIRATION only |
| Category / kind filters | Pool filter only — tile unchanged |

**R-FILTER-1:** Presentation matrix applies to **visible** items only; filters do not change tile shape.

---

## 9. Viewport rules

### 9.1 Mobile (`< md`)

- Variant: **Compact**
- Discover grid: `mediaRatio="1:1"`
- Main feed list: `4:5`
- No share on tile
- 1 trust segment

### 9.2 Desktop (`≥ md`)

- Variant: **Standard**
- `4:3` media
- Share on Standard
- 2 trust segments allowed
- Optional fulfillment icon row

### 9.3 Breakpoint

Match existing GeoFeed: `md` (768px) unless migration plan specifies hook — **no new breakpoint**.

---

## 10. Preview rules (T3 — reference only)

Hover (desktop) / long-press (mobile) per [MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md](./MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md).

| ID | Rule |
|----|------|
| **R-PREV-1** | Preview supplements tile — never contradicts |
| **R-PREV-2** | REQUEST: show scope + location — no proposal button |
| **R-PREV-3** | INSPIRATION: description + tags — no trust |
| **R-PREV-4** | Accepted values **preview-only** for OFFER kinds |

T1–T2: preview **not implemented** — rules reserved.

---

## 11. Sidebar & profile rules

| Surface | Variant | When |
|---------|---------|------|
| Feed main column | Compact / Standard | T1 |
| Feed sidebar | None T1–T2 | — |
| Sponsored sidebar | Sidebar | Future |
| Profile aanbod | Mini | T2 |
| Profile inspiratie | Mini inspiration mode | T2 |
| Profile gezocht | Mini REQUEST rules | T2 |

**R-SIDE-1:** Sidebar tiles are **strip** layout — image left, 2 text lines max.

---

## 12. Accessibility & interaction

| ID | Rule |
|----|------|
| **R-A11Y-1** | Card `aria-label` = title + price/category + person name |
| **R-A11Y-2** | Favorite button `aria-pressed` |
| **R-A11Y-3** | Badge text must be readable (contrast) — no icon-only badges without label |

---

## 13. Forbidden patterns (regression guard)

| Pattern | Source | Action |
|---------|--------|--------|
| `UserStatsTile` in feed | `GeoFeedCards.tsx` | Remove T1 |
| Duplicate seller row | FeedSaleCard | Single `PersonRow` |
| `text-2xl` price on mobile compact | FeedSaleCard | Cap `text-lg` |
| Accepted values row on tile | FeedSaleCard | Preview only |
| Blended star rating | Legacy stats | Use trust channels |
| Section-specific card component | — | Forbidden |
| CTA “Bekijk” / “Bestellen” on tile | — | Forbidden |

---

## 14. Validation checklist (pre-ship T1)

- [ ] Each ListingKind sample renders with correct person (requester vs seller)
- [ ] PRODUCT shows product trust before deal when both exist
- [ ] REQUEST never shows seller product reviews
- [ ] WORKSHOP shows date badge when date present
- [ ] INSPIRATION shows no € and no trust row
- [ ] Compact media ≥ 60% on 390px viewport
- [ ] Section row uses Standard — same card as desktop feed
- [ ] Discover grid uses Compact 1:1
- [ ] No `UserStatsTile` in bundle for feed route

---

## 15. Related documents

- [MARKETPLACE_PRESENTATION_MATRIX.md](./MARKETPLACE_PRESENTATION_MATRIX.md)
- [MARKETPLACE_TILE_VARIANT_MATRIX.md](./MARKETPLACE_TILE_VARIANT_MATRIX.md)
- [MARKETPLACE_TILE_ARCHITECTURE.md](./MARKETPLACE_TILE_ARCHITECTURE.md)
- [DISCOVERY_SECTION_REGISTRY.md](../architecture/DISCOVERY_SECTION_REGISTRY.md)
- [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md)
