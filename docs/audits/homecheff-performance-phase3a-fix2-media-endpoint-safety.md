# Phase 3A-Fix2 — `/api/feed/media` Pre-Preview Safety Review

**Datum:** 2026-07-12  
**Status:** hardening toegepast lokaal · **niet gecommit**

---

## Verdict

| Domein | Status | Notities |
|--------|--------|----------|
| Toegangscontrole | **GROEN** (na hardening) | Visibility-check vóór media-load |
| Inputvalidatie | **GROEN** | Allowlist type, ID-regex, index 0–19 |
| MIME / bytes | **GROEN** | Allowlist + 8 MB cap + nosniff |
| Cache | **GROEN** | `max-age=86400, s-maxage=604800, stale-while-revalidate=86400` |

**Vóór review:** endpoint laadde media op UUID zonder visibility-gate → concept/private media kon lekken.

---

## 1. Toegangscontrole en zichtbaarheid

`lib/feed/feed-media-access.ts` → `isFeedMediaEntityVisible()` spiegelt feed-queries:

| Type | Feed-semantiek | Media-gate |
|------|----------------|------------|
| **product** | `isActive: true` OR inactive met betaalde `orderItems` | Zelfde `OR`-clause |
| **dish** | `status: PUBLISHED` | Zelfde |
| **listing** | `isPublic: true` | Zelfde |

- Geen clientvelden voor autorisatie
- Onzichtbaar record → **404** (niet 403, geen onderscheid lekken)
- `loadVisibleFeedMediaUrl()` checkt visibility **vóór** Prisma media-query

**Niet afgedekt (bewust buiten feed-scope):** admin-only drafts die nooit in feed pool zaten blijven 404.

---

## 2. Inputvalidatie

| Parameter | Regel | Fout |
|-----------|-------|------|
| `type` | allowlist: `product` \| `dish` \| `listing` | 400 |
| `id` | `^[a-zA-Z0-9_-]{8,128}$` | 400 |
| `i` | integer 0–`FEED_MEDIA_MAX_INDEX` (19), strikt numeriek | 400 |
| ontbrekend `i` | default `0` | — |
| onbekende media / leeg | na visibility + DB | 404 |
| malformed data URL | parse fail | 404 |

Geen stack traces of interne details in responses. `X-Content-Type-Options: nosniff` op alle responses.

---

## 3. MIME-type en bytes

**Toegestaan:** `image/jpeg` (incl. `image/jpg`), `image/png`, `image/webp`, `image/gif`

**Geblokkeerd:** `text/html`, `image/svg+xml`, `application/javascript`, `application/octet-stream`, overige types

| Controle | Waarde |
|----------|--------|
| Max decoded bytes | **8 MB** (`FEED_MEDIA_MAX_DECODED_BYTES`) |
| Base64 | try/catch; malformed → 404 |
| Headers inline | `Content-Type` (genormaliseerd), `nosniff` |

### Gemeten legacy records (productie-probe)

| Item | Decoded ~size |
|------|----------------|
| Marilyn Monroe (`1823cae9…`) | ~337 KB |
| Kunstschilderijen Sacco (`4f822286…`) | ~155 KB |

Beide ruim onder 8 MB cap. Geen oversize records in steekproef.

---

## 4. Cachebeleid

Inline bytes (immutable per `id`+`i`):

```http
Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400
X-Content-Type-Options: nosniff
```

Externe HTTPS URLs → **302 redirect** naar blob host (zelfde als vóór sanitize). Redirect krijgt `nosniff`; CDN cache op doel-URL.

---

## 5. Gewijzigde bestanden (review)

| Bestand | Wijziging |
|---------|-----------|
| `lib/feed/feed-media-access.ts` | **nieuw** — validation, parse, limits (geen DB) |
| `lib/feed/feed-media-access.server.ts` | **nieuw** — visibility + load (Prisma) |
| `app/api/feed/media/route.ts` | gebruikt access + server modules |
| `scripts/validate-feed-contract-phase3a.ts` | +15 safety unit tests |

---

## 6. Validatie

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | pass |
| `npm run build` | pass |
| Contract validator (incl. 15 media safety tests) | **68/68 pass** |

---

## 7. Git

**Geen commit. Geen push. Geen deploy.**
