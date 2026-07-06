# Marketplace Tile Preview Architecture — Hover & Long Press

**Status:** Architecture specification (T2 design, T3 implementation)  
**Last updated:** 2026-07-06  
**Parent:** [MARKETPLACE_TILE_ARCHITECTURE.md](./MARKETPLACE_TILE_ARCHITECTURE.md)

---

## 1. Purpose

Tiles intentionally hide detail to preserve scanability. **Preview** surfaces secondary information on intent (desktop hover, mobile long-press) without replacing the product/detail page.

**Principle:** Preview = *expand context*, not *complete the transaction*.

---

## 2. Preview vs detail page

| Concern | Tile | Preview | Detail page |
|---------|------|---------|-------------|
| Title + cover | ✓ | ✓ | ✓ |
| Price / value | one line | expanded payment options | full breakdown |
| Accepted values | — | ✓ list (max 5) | full + search |
| Trust evidence | one cue | 2–3 cues + badges | full trust sections |
| Checkout / proposal | — | — | ✓ |
| Reviews list | — | — | ✓ |
| Description | — | 2-line snippet | full |
| Delivery / fulfillment | — | ✓ icons | full map + radius |
| Workshop date/time | badge only | ✓ formatted | full calendar |
| Share | standard only | ✓ quick share | ✓ |
| Seller profile | person row | mini stats strip | `UserStatsTile` OK |

---

## 3. Desktop hover preview

### 3.1 Trigger

- **Pointer enter** on `MarketplaceTileStandard` / `MarketplaceTileCompact` (desktop breakpoint only, `lg+`)
- Delay: **300ms** show, **150ms** hide (prevent flicker on grid scroll)
- **Keyboard:** focus-within opens preview; `Escape` closes
- **Touch desktop:** no hover — fall through to tap → detail

### 3.2 Presentation options (recommend **B**)

| Option | Description | Verdict |
|--------|-------------|---------|
| A. Popover anchored to card | Floating panel below card | Good for grid |
| B. **Expanded card shell** | Same card grows `max-height` with preview block | **Recommended** — less layout shift in masonry |
| C. Side peek panel | Fixed right drawer | Too heavy for feed |

### 3.3 Hover preview content (`MarketplaceTilePreviewPanel`)

Max height **~200px** additional below compact body. Scroll if needed.

**Section order:**

1. **Description snippet** — 2 lines, `text-xs text-gray-600`
2. **Fulfillment row** — pickup / delivery / digital icons + labels
3. **Accepted values** — up to 5 chips + `+N` (from `acceptedSpecializations`)
4. **Payment options** — barter openness label if not obvious from price line
5. **Workshop / availability** — formatted `availabilityDate` + time if present
6. **Trust expansion** — up to 2 extra cues (channels not shown on tile)
7. **Trust badges** — up to 2 pills (if not on tile overlay)
8. **Footer hint** — `Enter voor details` / subtle link styling

**Explicitly excluded:**

- View counts, fans, HCP
- Blended rating
- Primary CTA button
- Checkout

### 3.4 Wireframe (desktop hover)

```
┌────────────────────────────┐
│ [WORKSHOP]            [♥][↗]│
│        [  IMAGE 4:3  ]      │
├────────────────────────────┤
│ ○ Lisa · Rotterdam 3 km     │
│ Sourdough workshop          │
│ €45,00 · Workshop           │
│ 🤝 8 afspraken              │
├ ─ ─ hover expand ─ ─ ─ ─ ─ ┤
│ Leer zelf desem brood...    │
│ 🚗 Afhalen · Bezorgen       │
│ Accepteert: 🍅 Groente +2   │
│ Za 12 jul 2026 · 10:00      │
│ ⭐ 12 productreviews         │
│ Tik voor volledig aanbod →  │
└────────────────────────────┘
```

### 3.5 Performance

- Preview data **already on tile model** — no extra fetch T2
- Optional T3: prefetch detail route on hover intent (`router.prefetch`)
- `pointer-events: none` on preview during scroll velocity > threshold

---

## 4. Mobile long-press preview

### 4.1 Trigger

- **Long press** **500ms** on card body (not on favorite button)
- Haptic light feedback (Capacitor `Haptics.impactLight` when native)
- **Short tap** → navigate to detail (unchanged)
- **Favorite** → immediate, does not trigger preview

### 4.2 Presentation

**Bottom sheet** (`MarketplaceTilePreviewSheet`):

- Rounded top, `max-h-[45vh]`, drag to dismiss
- Backdrop dim 40%
- Same content sections as desktop preview
- **Actions row at bottom (preview-only):**
  - `Bekijk aanbod` → detail (primary text button)
  - `Deel` → share sheet
  - `Annuleer` → dismiss

**No** checkout, **no** message, **no** proposal in preview (detail only).

### 4.3 Wireframe (mobile sheet)

```
        ┌─────────────────────┐
        │ ─── drag handle ─── │
        │ [thumb] Title       │
        │ €45 · Workshop      │
        │ Afhalen · Bezorgen    │
        │ Accepteert: 🍅 +2   │
        │ Za 12 jul · 10:00    │
        │ 🤝 8 afspraken       │
        │─────────────────────│
        │ [ Bekijk aanbod ]     │
        │ [ Deel ]  [ Sluit ]   │
        └─────────────────────┘
```

### 4.4 Accessibility

- Long-press alternative: **⋯** overflow button on standard tiles (T3) for users who cannot long-press
- Sheet: focus trap, `aria-modal`, return focus to card on close

---

## 5. Data requirements

All fields from `MarketplaceTileModel` — **no new API fields** for T2 preview design.

| Preview section | Model fields |
|-----------------|--------------|
| Description | `description` (add to tile model from discovery) |
| Fulfillment | `fulfillmentMode` + delivery flags |
| Accepted values | `acceptedSpecializations` |
| Barter | `barterOpenness`, `priceCents`, `priceModel` |
| Workshop date | `availabilityDate` |
| Trust expand | `trust.*` channels |
| Share | `href`, `title`, `coverImage` |

**Tile model extension (T2):** add `description: string | null` from `discovery.description`.

---

## 6. Component structure (T3 implementation)

```
components/marketplace/tiles/preview/
  MarketplaceTilePreviewPanel.tsx      # desktop inline expand
  MarketplaceTilePreviewSheet.tsx      # mobile bottom sheet
  MarketplaceTilePreviewContent.tsx    # shared sections
  useTilePreviewTrigger.ts             # hover delay / long-press hook
```

**T1–T2:** Spec only — components not built. Tile variants ship without preview.

---

## 7. Phase alignment

| Phase | Preview work |
|-------|--------------|
| **T1** | None — compact/standard tiles only |
| **T2** | Architecture (this doc); add `description` to tile model |
| **T3** | Implement hover panel + long-press sheet |
| **T4** | Prefetch on hover; overflow ⋯ fallback |

---

## 8. Anti-patterns

- Do not show `UserStatsTile` in preview
- Do not duplicate entire detail page in sheet
- Do not auto-open preview on scroll-settle
- Do not block tap navigation with preview on short press
- Do not fetch `/api/user/stats` for preview

---

## 9. Open decisions (product)

1. **Inspiration tiles:** preview shows tags + prep time? → **Yes**, 2-line description + tags only
2. **REQUEST listings:** preview shows requester intent snippet? → **Yes**, `listingIntent` copy
3. **Desktop share in preview:** icon in hover footer? → **Yes** for Standard variant only
