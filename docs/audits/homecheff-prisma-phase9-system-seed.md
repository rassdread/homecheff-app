# Phase 9 — System Seed Policy

**Bestand:** `prisma/baseline-staging/20260713_current_state/system_seed.sql`

---

## Lagen

| Laag | Inhoud | Greenfield default |
|------|--------|-------------------|
| **Schema baseline** | `schema_baseline.sql` — alleen DDL | ✅ Altijd |
| **System seed** | Idempotente systeemrecords | ❌ Standaard leeg |
| **Demo/test seed** | `prisma/seed.ts` | ❌ Nooit automatisch in prod |

---

## Onderzochte systeemdata

| Item | Nodig voor lege DB? | Bewijs | Besluit |
|------|---------------------|--------|---------|
| `system-unassigned-delivery` User | **Nee** | Phase 7: app gebruikt `deliveryProfileId = null`; 0 orders op sentinel | **Optioneel** — uitgecommentarieerd |
| `unassigned` DeliveryProfile | **Nee** | Zelfde | **Optioneel** |
| Admin permission defaults | **Nee** | Kolomdefaults in DDL (`DEFAULT true` / nullable) | Alleen schema |
| `UserRole` enum SUPERADMIN | **Nee** | Enum in DDL | Alleen schema |
| Badge rows | **Nee** | `unlock-badges.ts` doet `badge.upsert` on demand | Geen seed |
| HcpCarouselSlide | **Nee** | Admin-created content | Geen seed |
| PromoCode / taxonomy | **Nee** | Geen hardcoded FK in code naar vaste codes | Geen seed |
| Feature flags | **Nee** | Env-based / user prefs | Geen seed |
| `prisma/seed.ts` demo users | **Nee** | Demo data met Unsplash URLs | **Demo only** — `npm run db:seed` handmatig |

---

## Unassigned delivery — expliciet advies

| Optie | Wanneer |
|-------|---------|
| **Achterwege laten** (aanbevolen) | Nieuwe greenfield CI, lokale dev, disposable test |
| **Opnemen** (`--include-sentinel`) | Test historische compatibiliteit; migratie van legacy data |

Sentinel is **legacy** op shared Neon; geen codepad vereist sentinel-ID.

---

## System seed inhoud (huidig)

- Bestand bevat **uitsluitend uitgecommentarieerde** INSERTs
- Geen productie-emails, orders, producten, promo codes
- `ON CONFLICT DO NOTHING` patroon wanneer geactiveerd

---

## Productiedata — expliciet verboden in baseline

- Gebruikersaccounts (behalve optionele systeem-ID)
- Orders, Product, Dish content
- PromoCode redemption data
- PII / payment tokens
- Secrets in SQL

Validator controleert op `INSERT INTO "User"` in `schema_baseline.sql`.

---

## Demo/test seed

`prisma/seed.ts` blijft **apart**:

```bash
npm run db:seed   # alleen op dev/disposable, nooit prod pipeline
```

Niet koppelen aan greenfield bootstrap.
