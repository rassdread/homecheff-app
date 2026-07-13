# Phase 6 — PromoCode Reconstruction

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13

---

## Live database — kolommen & constraints

### Kolommen (`PromoCode`)

| Kolom | Type | Nullable | Default |
|-------|------|----------|---------|
| `id` | text | NO | — |
| `affiliateId` | text | **YES** | — |
| `sellerId` | text | **YES** | — |
| `code` | text | NO | — |
| `appliesTo` | text | NO | `'SUBSCRIPTION_ONLY'` |
| `discountSharePct` | integer | NO | `0` |
| `startsAt` | timestamp | NO | — |
| `endsAt` | timestamp | YES | — |
| `maxRedemptions` | integer | YES | — |
| `redemptionCount` | integer | NO | `0` |
| `status` | PromoCodeStatus | NO | `'ACTIVE'` |
| `createdAt` | timestamp | NO | `CURRENT_TIMESTAMP` |
| `updatedAt` | timestamp | NO | — |

### Foreign keys

| Constraint | Kolom | Referentie | onDelete | onUpdate |
|------------|-------|------------|----------|----------|
| `PromoCode_affiliateId_fkey` | `affiliateId` | `Affiliate(id)` | **CASCADE** | CASCADE |
| `PromoCode_sellerId_fkey` | `sellerId` | `User(id)` | **CASCADE** | CASCADE |

### Indexes (live)

- `PromoCode_pkey`, `PromoCode_code_key` (unique)
- `PromoCode_affiliateId_idx`, `PromoCode_sellerId_idx`
- `PromoCode_code_idx`, `PromoCode_status_idx`, `PromoCode_startsAt_endsAt_idx`

---

## Record-statistieken (preview DB)

| Categorie | Aantal |
|-----------|--------|
| Totaal promo codes | 1 |
| Alleen `affiliateId` | 1 |
| Alleen `sellerId` | 0 |
| Beide | 0 |
| Geen van beide | 0 |
| Orphan `affiliateId` | 0 |
| Orphan `sellerId` | 0 |

**Geen** CHECK constraint die “exact één van affiliate/seller” afdwingt — PostgreSQL staat theoretisch beide NULL of beide gezet toe.

---

## Businesssemantiek (bewijs uit code)

### Huidige productie-flow: affiliate promo (subscription)

| Consumer | Gedrag |
|----------|--------|
| `POST /api/affiliate/promo-codes` | Zet **altijd** `affiliateId: user.affiliate.id` (required in app-logica) |
| `POST /api/subscribe` | Valideert promo via `affiliate` include; berekent korting + attribution |
| `GET /api/admin/promo-codes` | Include `affiliate.user` — **assumeert** affiliate aanwezig |
| `app/sell/page.tsx` | Promo-validatie voor abonnement |

### Seller promo (voorbereid in DB, niet in app)

- `sellerId` + FK naar `User` bestaan op DB.
- **Geen** API-route die `sellerId` zet bij create.
- **Geen** subscribe/checkout-flow die seller-promo gebruikt.

### Interpretatie

| Regel | Status |
|-------|--------|
| Affiliate promo | **Primair** — huidige code |
| Seller promo | **Toekomst / admin** — DB-kolom klaar, app niet |
| `affiliateId` nullable | **DB-realiteit** — migraties maakten kolom optional (admin/seller promos zonder affiliate) |
| Minstens één owner verplicht | **Niet afgedwongen in DB**; app **implicit** affiliate-only |

**Aanbeveling schema:** beide FK’s optional (`String?`); **geen** Prisma `@relation` required. Optioneel later: app-validator “affiliateId XOR sellerId” bij create — **buiten scope Phase 6 schema sync**.

---

## DB-only migraties (PromoCode-gerelateerd)

| Migratie | Checksum | Feitelijk effect |
|----------|----------|------------------|
| `20260212000000_promo_code_admin_optional_affiliate` | `86c13e8432…` | `affiliateId` DROP NOT NULL (waarschijnlijk) |
| `20260212000000_promo_code_affiliate_optional` | `f306c0f958…` | Duplicate/overlap nullable affiliate |
| `20260212100000_promo_code_seller_id` | `f798e5ac743…` | `sellerId`, index, FK → User |

---

## Voorgesteld Prisma-model (toegepast lokaal)

```prisma
model PromoCode {
  affiliateId  String?
  sellerId     String?
  affiliate    Affiliate?  @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  seller       User?       @relation("PromoCodeSeller", fields: [sellerId], references: [id], onDelete: Cascade)
  // … overige velden ongewijzigd
  @@index([affiliateId])
  @@index([sellerId])
}
```

`User` back-relation:

```prisma
promoCodesAsSeller  PromoCode[]  @relation("PromoCodeSeller")
```

---

## Compatibiliteit bestaande code

| Route / module | Impact na schema sync |
|----------------|----------------------|
| Affiliate create | Geen — zet nog steeds `affiliateId` |
| Subscribe + affiliate include | **TypeScript:** `affiliate` is `Affiliate \| null`; runtime OK voor huidige data (affiliate altijd gezet) |
| Admin list | `p.affiliate` kan null zijn in types; huidige record heeft affiliate |

**Geen codewijziging vereist** voor huidige data; optionele null-guards aanbevolen vóór seller-promo rollout.

---

## Voorgestelde idempotente SQL (greenfield)

*Niet uitgevoerd.*

```sql
-- Optional affiliate (stap 1+2 geconsolideerd voor greenfield)
ALTER TABLE "PromoCode" ALTER COLUMN "affiliateId" DROP NOT NULL;

-- Seller promo
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "sellerId" TEXT;
CREATE INDEX IF NOT EXISTS "PromoCode_sellerId_idx" ON "PromoCode"("sellerId");
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PromoCode_sellerId_fkey'
  ) THEN
    ALTER TABLE "PromoCode"
      ADD CONSTRAINT "PromoCode_sellerId_fkey"
      FOREIGN KEY ("sellerId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
```

Op **bestaande** Neon: kolommen/constraints **bestaan al** — geen DDL.

---

## Risico’s

| Risico | Niveau |
|--------|--------|
| Nullable `affiliateId` vs oude schema required | **Opgelost** in Phase 6 |
| Seller-promo zonder app-support | Laag — kolom blijft NULL |
| Admin UI null affiliate | Laag — geen seller-only records yet |
| CASCADE delete User → promo | Medium — bewust DB-design |
