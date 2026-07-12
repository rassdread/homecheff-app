# Phase 3C — Linked Legacy Media

**Datum:** 2026-07-12

---

## Probleem

`dbLinkedMediaMs` stabiel **~557–558 ms** ondanks slechts 7 producten.

### Oude query

```typescript
prisma.dish.findMany({
  where: { id: { in: linkedProductIds }, status: 'PUBLISHED' },
  select: {
    id: true,
    photos: { select: { url: true } },  // ← base64 bytes
    videos: { ... },
  },
})
```

- **Alle** stripe-filtered product IDs (inclusief products mét eigen Image)
- Volledige `DishPhoto.url` bytes geladen
- Veel IDs hoefden geen dish-donor (Product heeft eigen legacy Image → proxy)

---

## 3C strategie

### 1. Alleen donor-query wanneer nodig

```typescript
productNeedsLinkedDishMedia(product.Image.length) // true alleen bij 0 Image rows
```

Products met legacy inline Image (Sacco/Marilyn) gebruiken `/api/feed/media?type=product` — **geen** dish-donor nodig.

### 2. Geen photo bytes in linked query

Linked query haalt alleen `id` + `videos` (http blob URLs, klein).

Photos via `loadDishPhotoMetadata(linkedIds)` — raw SQL met legacy sentinel.

### 3. Metadata helper

`linkedDishMediaFromPhotoMetadata()` bouwt dezelfde feed fields als vóór 3C.

---

## Sacco / Marilyn compatibiliteit

| Case | Pad |
|------|-----|
| Product Image = data: URL | `buildFeedMediaProxyUrl('product', id, i)` |
| Product Image = leeg, Dish photos | linked donor + dish metadata proxy |
| Dish standalone | dish metadata proxy |
| Vercel Blob http URL | direct in metadata query (LEFT 1024) |

Visibility/MIME/size gates ongewijzigd op `/api/feed/media`.

---

## Verwachte impact

| Metriek | Vóór | Verwacht |
|---------|------|----------|
| linked query IDs | alle linked (~7) | **subset (0–2)** |
| photo bytes in feed path | ja | **nee** |
| dbLinkedMediaMs | ~558 ms | **<200 ms** (preview hermeting) |

---

## Validatie

`scripts/validate-feed-legacy-media-phase3c.ts` — **7/7**
