# Phase 7 — `add_unassigned_delivery_profile` Investigation

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Migratie:** `20260210120000_add_unassigned_delivery_profile`  
**Methode:** uitsluitend read-only

---

## Executive summary

De migratie was **geen schemawijziging** op `DeliveryProfile.userId` en **geen** herhaling van `make_delivery_profile_optional`. Ze voerde een **datamigratie** uit die exact op het migratiemoment (`2026-02-11T22:24:18.595Z`) aanmaakte:

| Object | Vaste ID | Doel |
|--------|----------|------|
| `User` | `system-unassigned-delivery` | Intern systeemaccount (`system+unassigned@homecheff.internal`) |
| `DeliveryProfile` | `unassigned` | Inactief sentinel-profiel (`age=0`, `isActive=false`, `isVerified=false`) |

**Huidige applicatie** gebruikt **`deliveryProfileId: null`** voor ongeassigneerde `DeliveryOrder`-records (webhook, dashboard, API). **Geen enkele** `DeliveryOrder` verwijst naar `deliveryProfileId = 'unassigned'` (0 records). Het sentinel-profiel is **legacy / ongebruikt** in code.

**Classificatie:** **E** (data-effect) + **B** (functioneel reconstrueerbaar). Blokkade **D** opgeheven.

---

## Deel 1 — Databasehistorie

### Record `_prisma_migrations`

| Veld | Waarde |
|------|--------|
| `migration_name` | `20260210120000_add_unassigned_delivery_profile` |
| `checksum` | `66bb04f0e0ac9c09cfcd3a6712b0a7a0d1ad59463c55e1ba2a032e7d08830f00` |
| `started_at` | `2026-02-11T22:24:18.499Z` |
| `finished_at` | `2026-02-11T22:24:18.619Z` |
| `rolled_back_at` | `null` |
| `applied_steps_count` | `1` |
| `logs` | `null` |

### Uitvoeringsvolgorde (omgeving)

| # | Migratie | `started_at` (UTC) |
|---|----------|------------------|
| 1 | `20260208220000_add_user_password_hash` | 2026-02-09T21:09:29 |
| 2 | `20260210000000_affiliate_business_subscription_admin_roles` | 2026-02-10T22:43:05 |
| 3 | `20260211000000_add_superadmin_role` | 2026-02-10T22:43:05 |
| **4** | **`20260210120000_add_unassigned_delivery_profile`** | **2026-02-11T22:24:18** |
| 5 | `20260212000000_promo_code_admin_optional_affiliate` | 2026-02-11T22:24:18 (+162ms) |
| 6 | `20260212000000_promo_code_affiliate_optional` | 2026-02-14T14:42:50 |
| 7 | `20260212100000_promo_code_seller_id` | 2026-02-14T14:42:50 |
| 8 | `20260212120000_add_product_weight_dimensions` | 2026-02-14T14:42:51 |

Promo-migraties #5–8 liepen in dezelfde deploy-batch als deze migratie (feb 11 resp. feb 14).

### Eerdere delivery-migraties op deze DB

| Migratie | Applied | Relevant effect |
|----------|---------|-----------------|
| `20250921112416_add_delivery_profile_system` | 2025-09-24 | Tabellen + `deliveryProfileId` NOT NULL |
| `20251113120000_make_delivery_profile_optional` | 2025-11-13 | **`DeliveryOrder.deliveryProfileId` nullable** (lokaal bestand in repo) |

De nullable kolom bestond **ruim vóór** feb 2026; deze migratie voegde die wijziging niet opnieuw toe.

---

## Deel 2 — Git- en repositoryzoektocht

| Zoekterm / bron | Resultaat |
|-----------------|-----------|
| `add_unassigned_delivery_profile` pad | **Geen** bestand in `HEAD`, branches, `git log --all` |
| `system-unassigned-delivery` | **Geen** hits in Git-history |
| `id: 'unassigned'` / `"unassigned"` in code | **Geen** (alleen Phase 7 probe-output) |
| `unassigned` in app | Comments/docs: **null** `deliveryProfileId`, niet sentinel-ID |
| stash | Geen matches |
| `20260210120000` in migratiemappen | **Ontbreekt** |

**Conclusie:** migratie-SQL is **nooit gecommit**; reconstructie alleen via database-artefacten + timestamp-correlatie.

---

## Deel 3 — Schema-inspectie

Volledige inventory: [`homecheff-prisma-phase7-delivery-schema-inventory.json`](./homecheff-prisma-phase7-delivery-schema-inventory.json)

### Verdachte objecten — beoordeling

| Object | Huidige staat | Toeschrijving aan deze migratie? | Alternatieve oorsprong |
|--------|---------------|----------------------------------|------------------------|
| `DeliveryOrder.deliveryProfileId` nullable | YES | **Nee** — al sinds nov 2025 | `20251113120000_make_delivery_profile_optional` |
| `DeliveryProfile` id=`unassigned` | Bestaat | **Ja** — `createdAt` = migratietimestamp | — |
| `User` id=`system-unassigned-delivery` | Bestaat | **Ja** — zelfde timestamp | — |
| `DeliveryProfile.userId` nullable | NO | **Nee** | Nooit gewijzigd |
| `DeliveryOrder` FK `ON DELETE SET NULL` | Live DB | **Onzeker** | Niet in deze migratie bewezen; init had RESTRICT |
| `DeliveryRequest`, `CourierAssignment` | Leeg (0 rows) | **Nee** | Latere marketplace-migraties |

### `prisma/schema.prisma` vs live DB

- `DeliveryOrder.deliveryProfileId String?` — **match**
- `DeliveryProfile.userId String @unique` — **match** (geen systeem-null user)
- Sentinel records **niet** gemodelleerd in Prisma (normale rijen; geen enum/special type)

---

## Deel 4 — Data-inspectie

### Sentinel-records (structureel, geen PII)

| Tabel | ID | `createdAt` | Opmerking |
|-------|-----|-------------|-----------|
| `User` | `system-unassigned-delivery` | `2026-02-11T22:24:18.595Z` | Email: `system+unassigned@homecheff.internal` |
| `DeliveryProfile` | `unassigned` | `2026-02-11T22:24:18.595Z` | `userId` → system user; inactief |

**Timestamp-bewijs:** `createdAt` van beide records valt **binnen 100ms** van `started_at`/`finished_at` van de migratie → sterk bewijs dat de migratie deze inserts uitvoerde.

### Overige tellingen

| Metriek | Waarde |
|---------|--------|
| `DeliveryProfile` totaal | 2 |
| Profielen met `userId IS NULL` | 0 |
| Profielen met bio/address “unassigned” | 0 |
| `DeliveryOrder` totaal | 0 |
| Orders met `deliveryProfileId IS NULL` | 0 |
| Orders met `deliveryProfileId = 'unassigned'` | 0 |
| Orphan FK op `DeliveryOrder` | 0 |
| Users met system/unassigned naam-patroon | 1 (sentinel user) |

Geen persoonsgegevens van echte gebruikers gerapporteerd.

---

## Deel 5 — Applicatiegedrag

### Ongeassigneerde orders: **null, niet sentinel**

| Pad | Gedrag |
|-----|--------|
| `app/api/stripe/webhook/route.ts` | `deliveryProfileId: null` bij create |
| `app/api/delivery/orders/route.ts` | POST create met `deliveryProfileId: null` |
| `app/api/delivery/dashboard/route.ts` | Pool: `where: { status: 'PENDING', deliveryProfileId: null }` |
| `docs/HOMECHEFF_DELIVERY_FOUNDATION.md` | PENDING unassigned → accept-flow |

### Geen codepad verwacht sentinel `unassigned`

- Geen seed-script met deze IDs in repo
- Geen admin/courier route die `deliveryProfileId: 'unassigned'` zet
- `assertDelivererCanAccept` werkt op echte bezorgerprofielen
- Annulering → PENDING pool via **null**, niet sentinel (statusflow doc)

### Verwijderen gebruiker

`DeliveryProfile.userId` CASCADE naar User — sentinel user verwijderen zou sentinel profiel meenemen; **geen app-impact** zolang orders niet naar sentinel verwijzen.

---

## Deel 6 — Reconstructieclassificatie

| Code | Toepassing |
|------|------------|
| **E** | **Primair** — migratie = INSERT system user + sentinel profile |
| **B** | Idempotente reconstructie mogelijk |
| **F** | Effect is nu volledig achterhaald (was D) |

**Niet A** — geen origineel bestand; checksum `66bb04f0…` niet reproduceerbaar zonder byte-identieke SQL.

### Voorgestelde SQL (niet uitgevoerd)

```sql
-- 20260210120000_add_unassigned_delivery_profile (reconstructie)
-- Idempotent: veilig op DB waar records al bestaan.

INSERT INTO "User" ("id", "email", "createdAt", "updatedAt", "role")
VALUES (
  'system-unassigned-delivery',
  'system+unassigned@homecheff.internal',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'USER'::"UserRole"
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "DeliveryProfile" (
  "id", "userId", "age", "isActive", "isVerified",
  "maxDistance", "totalDeliveries", "totalEarnings",
  "deliveryMode", "gpsTrackingEnabled", "isOnline",
  "createdAt", "updatedAt"
)
VALUES (
  'unassigned',
  'system-unassigned-delivery',
  0, false, false,
  3.0, 0, 0,
  'FIXED', false, false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
```

**Checksum:** gereconstrueerd bestand zal **afwijken** van `66bb04f0…` tenzij origineel surface. Voor shared Neon: `migrate resolve --applied` na review; voor greenfield: SQL mag draaien.

**Optioneel later:** sentinel verwijderen/deprecaten — **buiten scope**; vereist productbesluit (nu 0 consumers).

---

## Deel 7 — Greenfield-impact

Zie [`homecheff-prisma-phase7-greenfield-impact.md`](./homecheff-prisma-phase7-greenfield-impact.md).

**Kern:** greenfield heeft **verplicht** `20251113120000_make_delivery_profile_optional` (nullable FK). Sentinel seed is **optioneel voor pariteit** met shared DB, **niet vereist** voor app-gedrag.

---

## Deel 8 — Baseline-packbesluit

| Stap | Besluit | Toelichting |
|------|---------|-------------|
| Reconstructie **deze** migratie | **GO** | Data-effect bewezen; idempotente SQL gedocumenteerd |
| Overige **7** baseline-mappen | **GO** (voorbereiding) | Blokkade D opgeheven; nog steeds review + geen auto-commit |
| Greenfield-test | **HOLD** | Na baseline-pack in repo + disposable Neon |
| Merge → main | **HOLD** | Na greenfield-test + volledige baseline-pack |
| `migrate deploy` (shared prod) | **HOLD** | Na baseline-pack + backup; resolve-batch gepland |

---

## Validatie (read-only toolchain)

| Check | Resultaat |
|-------|-----------|
| `npx prisma validate` | ✅ |
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ |

Geen muterende Prisma-commando’s.

---

## Bevestiging

Geen `migrate deploy/resolve/reset`, geen `db push`, geen DDL, geen data-updates, geen merge, geen push, geen deployment.

---

## Bijlagen

- [`homecheff-prisma-phase7-delivery-schema-inventory.json`](./homecheff-prisma-phase7-delivery-schema-inventory.json)
- [`homecheff-prisma-phase7-greenfield-impact.md`](./homecheff-prisma-phase7-greenfield-impact.md)
- Probe-script: `scripts/phase7-unassigned-delivery-probes.ts`
