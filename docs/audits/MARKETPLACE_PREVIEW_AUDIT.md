# Marketplace Preview Audit

**Status:** Complete  
**Last updated:** 2026-07-06  
**Phase:** T3 — preview layer foundation (hover + long press)

---

## Deliverables

| Requirement | Status |
|-------------|--------|
| `components/marketplace/previews/MarketplacePreviewCard` | ✅ |
| `components/marketplace/previews/MarketplaceHoverPreview` | ✅ |
| `components/marketplace/previews/MarketplaceLongPressPreview` | ✅ |
| `components/marketplace/previews/MarketplacePreviewShell` | ✅ |
| `lib/marketplace/previews/*` content builders | ✅ |
| Compact + Standard wired via preview shell | ✅ |
| No tile body size changes | ✅ |
| `validate-marketplace-previews.ts` | ✅ |

---

## Trigger behavior

| Surface | Trigger | Close |
|---------|---------|-------|
| Desktop (≥ lg) | Hover 300ms delay | Leave tile + preview; Escape |
| Mobile / narrow (< lg) | Long press 500ms | Swipe down, tap outside, close button, Escape |

**Excluded triggers:** favorite button (`data-preview-ignore`).

---

## Positioning (desktop)

- Floating portal panel via `computePreviewPosition`
- Max width 420px
- Flips horizontally when near viewport edge
- Clamps vertically — never off-screen
- No modal overlay; no page navigation on open

---

## Content matrix (from `DiscoveryReadModel` / `MarketplaceTileModel`)

| ListingKind | Sections shown |
|-------------|----------------|
| PRODUCT | description, fulfillment, accepted values, trust (+ seller badges) |
| SERVICE | description, availability, response expectation, accepted values, trust |
| TASK | description, availability note (place), accepted values, trust |
| WORKSHOP | description, date, location, capacity (when set), accepted values, trust |
| COACHING | description, online/offline, accepted values, trust |
| REQUEST | request summary, needed-by, compensation note, accepted values, requester trust |
| INSPIRATION | creator, description, category — **no trust** |

---

## Trust (preview expansion)

**Allowed:** product reviews, deal reviews, courier reviews, completed deals, completed deliveries, repeat customers, trust badges, established tier cue.

**Forbidden:** HCP, followers, views, workspace props, blended ratings (`PREVIEW_FORBIDDEN_SIGNALS`).

---

## Payment / value block

Compact explanation only — examples:

- €25 + “Vaste prijs”
- “Prijs op aanvraag” + “Contact aanbieder”
- “Ruil mogelijk” + “Andere waarde bespreekbaar”
- “Vrijwillige bijdrage” + “Jij bepaalt bedrag”
- “€50 + ruil” + “Combinatie mogelijk”

No checkout actions in preview.

---

## Accepted values

- First surface where accepted values are visible
- Max 6 chips + `+N` overflow
- Built from `acceptedSpecializations` via taxonomy badges

---

## Actions

| Action | Desktop | Mobile |
|--------|---------|--------|
| Bekijk aanbod | Link to `model.href` | Same |
| Bericht sturen | `StartChatButton` (no navigation on open) | Same |
| Favoriet | `TileFavoriteAction` | Same |

No checkout, proposals, or purchases.

---

## Performance

- Preview content built synchronously from `MarketplaceTileModel`
- No `fetch` on hover or long press
- No extra API calls

---

## Out of scope (T3)

- Activity cards
- Sponsored placements
- Recommendations
- Ranking changes
- Mini / Sidebar preview triggers

---

## Validation

```bash
npx tsx scripts/validate-marketplace-previews.ts
npm run lint
npm run build
```
