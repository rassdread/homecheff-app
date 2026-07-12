# HomeCheff Performance Phase 3A-Fix2 — Broken Feed Image Sources

**Datum:** 2026-07-12  
**Status:** lokaal gefixt, **niet gecommit**

---

## 1. Symptoom (preview na Fix1)

- `feedFetches: 1` ✓ (dubbele fetch opgelost)
- Meerdere tegels tonen nog **browser broken-image icoon**
- Sommige tegels werken wél (bijv. Camila Rijs — *Spiegel van de ziel* met Vercel Blob URL)

---

## 2. Trace per concrete tegel (productie-API + `/api/products`)

### Kunstschilderijen — Sacco Van munster

| Veld | Waarde |
|------|--------|
| id | `4f822286-6043-417d-8be5-1bae8342d3a9` / `33392889-a509-4598-a379-c0671b2c37e0` |
| feedSource | PRODUCT |
| Product.Image[0].fileUrl | `data:image/jpeg;base64,...` (~159 KB) |
| Dish.photos | `[]` (geen linked dish-media) |
| API `image` (pre-fix) | `null` |
| discovery.coverImage | `null` |
| discovery.imageCount | **1** (mismatch) |
| tile `coverImage` | `null` → placeholder/broken |

### Marilyn Monroe — Camila Rijs

| Veld | Waarde |
|------|--------|
| id | `1823cae9-2aae-400f-9a28-eadbdcded3bc` |
| feedSource | PRODUCT |
| Product.Image[0].fileUrl | `data:image/jpeg;base64,...` (~345 KB) |
| Dish.photos | `[]` |
| API `image` (pre-fix) | `null` |
| discovery.imageCount | 1, coverImage null |

### Werkend voorbeeld — Spiegel van de ziel

| Veld | Waarde |
|------|--------|
| id | `646126bf-236b-4866-ba39-254b77067dbd` |
| Product.Image | `https://...vercel-storage.com/...jpeg` |
| API image + discovery.coverImage | zelfde HTTPS URL ✓ |

---

## 3. Root cause (niet linked-dish merge)

Fix1 loste **linked Product↔Dish** media op. Deze items hebben **geen** dish-photos; media staat als **inline `data:image/jpeg;base64`** in `Product.Image.fileUrl`.

**Phase 13L** `sanitizeFeedMediaUrl` verwijdert data-URLs uit `/api/feed` JSON (payload-reductie). Gevolg:

1. Transform zet `image` = data-URL
2. Enrichment zet `discovery.imageCount: 1`
3. Sanitize nullt `image` en `coverImage`
4. Client krijgt `imageCount: 1` maar geen loadbare `src`
5. Tegel probeert lege/placeholder URL → broken icon

Dit is **geen** `[object Object]` of verkeerde normalisatie — het is **bewuste stripping** zonder HTTP-fallback.

---

## 4. Fix2 (geïmplementeerd)

### Server

| Onderdeel | Wijziging |
|-----------|-----------|
| `lib/feed/resolve-feed-media-url.ts` | `data:` → `/api/feed/media?type=…&id=…&i=…` |
| `app/api/feed/media/route.ts` | Serveert DB inline bytes of 302 naar externe URL |
| `app/api/feed/route.ts` | Product/Dish/Listing transform gebruikt resolver |
| `sanitize-feed-response-media.ts` | Sync `discovery.coverImage` met resolved `cover` |
| `feed-candidate-window.ts` | Linked dish media via resolver |
| `map-to-tile-model.ts` | Alleen **bruikbare** cover/photo URLs |

### Debug (opt-in)

| Flag | Output |
|------|--------|
| `FEED_PERF_TIMING=1` | `debug.imageTrace[]` in feed API |
| `NEXT_PUBLIC_FEED_PERF_BASELINE=1` | `[HC-PERF] feed:image-trace` in console |

Trace shape:

```ts
{
  id, feedSource, rawProductImage, rawProductImageKind,
  linkedDishPhoto, mappedImage, discoveryCoverImage,
  discoveryImageCount, tileResolvedSrc
}
```

### Client

- `lib/feed/feed-image-trace-client.ts` — client trace
- `feedMedia.tsx` — `onError` op deferred video-poster `<img>`

---

## 5. Verwachting na Fix2

| Item | Vóór | Na |
|------|------|-----|
| Marilyn Monroe | `image: null` | `image: /api/feed/media?type=product&id=…&i=0` |
| Kunstschilderijen Sacco | `image: null` | proxy URL |
| Blob-producten | ongewijzigd HTTPS URL | ongewijzigd |

Browser laadt cover via feed media proxy; geen multi-honderd-KB base64 in JSON.

---

## 6. Validatie

- `npm run lint`
- `npm run build`
- `npx tsx scripts/validate-feed-contract-phase3a.ts` (incl. proxy tests)

---

## 7. Git

**Geen commit. Geen push.**

Langere termijn (buiten scope): migreer legacy `data:` images naar Vercel Blob bij upload/sync.
