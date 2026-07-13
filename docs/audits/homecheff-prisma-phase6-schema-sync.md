# Phase 6 — Schema Sync (Product, PromoCode, HcpCarouselSlide)

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13

---

## Doel

`prisma/schema.prisma` alignen met live Neon-schema **zonder databaseacties**.

---

## Uitgevoerde schemawijzigingen (lokaal)

### Product

Toegevoegd aan `model Product`:

```prisma
lengthCm  Float?
widthCm   Float?
heightCm  Float?
weightKg  Float?
```

Zie: [homecheff-prisma-phase6-product-dimensions.md](./homecheff-prisma-phase6-product-dimensions.md)

### PromoCode

- `affiliateId`: `String` → `String?`
- `affiliate`: `Affiliate` → `Affiliate?`
- `sellerId`: `String?` (nieuw)
- `seller`: `User?` @relation("PromoCodeSeller") (nieuw)
- `@@index([sellerId])` (nieuw)

Zie: [homecheff-prisma-phase6-promocode-reconstruction.md](./homecheff-prisma-phase6-promocode-reconstruction.md)

### User

```prisma
promoCodesAsSeller  PromoCode[]  @relation("PromoCodeSeller")
```

### HcpCarouselSlide

**Geen wijziging** — zie besluit hieronder.

---

## HcpCarouselSlide — `updatedAt` default

| Bron | `updatedAt` |
|------|-------------|
| Originele migratie `20260509200000_hcp_v3_carousel_slides` | `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| Live DB (`information_schema`) | `column_default: CURRENT_TIMESTAMP` |
| `schema.prisma` | `DateTime @updatedAt` (geen `@default`) |
| `migrate diff` schema → DB | `ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP` |
| `migrate diff` DB → schema | `ALTER COLUMN "updatedAt" DROP DEFAULT` |

### Besluit: **veilig negeren (introspection noise)**

- Prisma `@updatedAt` **schrijft** timestamp bij elke update — DB-default is redundant.
- Insert zonder `updatedAt`: DB-default vult aan; Prisma create zet beide timestamps.
- Geen functionele drift; geen app-bug.
- **Geen** schema-aanpassing nodig; **geen** migratie voor dit punt.

---

## Migrate diff na schema sync

```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-url "$DATABASE_URL" \
  --script
```

**Output (enige restverschil):**

```sql
ALTER TABLE "public"."HcpCarouselSlide" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
```

Product + PromoCode: **in sync**.

---

## Migratievoorstel (niet uitgevoerd)

**Doel:** greenfield reproduceerbaarheid + documentatie; op shared Neon **no-op** via idempotent SQL.

**Voorgestelde mapnaam (nog niet aangemaakt):**  
`prisma/migrations/20260714_phase6_schema_sync_baseline/migration.sql`

```sql
-- Phase 6 schema sync baseline (idempotent)
-- Safe on DBs where 20260212* migrations were applied manually / DB-only history.

-- Product dimensions
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lengthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "widthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "heightCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightKg" DOUBLE PRECISION;

-- PromoCode: optional affiliate + seller
ALTER TABLE "PromoCode" ALTER COLUMN "affiliateId" DROP NOT NULL;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "sellerId" TEXT;
CREATE INDEX IF NOT EXISTS "PromoCode_sellerId_idx" ON "PromoCode"("sellerId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PromoCode_sellerId_fkey') THEN
    ALTER TABLE "PromoCode"
      ADD CONSTRAINT "PromoCode_sellerId_fkey"
      FOREIGN KEY ("sellerId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
```

**Let op:** dit is een **consolidatie** van DB-only effecten. Op shared Neon staat dit al in `_prisma_migrations` onder de 20260212*-namen. Deploy-strategie: eerst **8 baseline history-mappen** + resolve (zie greenfield doc), **daarna** pas nieuwe forward migraties — anders dubbele history.

**Alternatief voor bestaande DB:** alleen `schema.prisma` commit — **geen** nieuwe migratiemap tot baseline-pack klaar is.

---

## Validatie (Phase 6)

| Check | Resultaat |
|-------|-----------|
| `npx prisma format` | ✅ |
| `npx prisma validate` | ✅ |
| `npx prisma generate` | ✅ |
| `migrate diff` schema ↔ DB | ✅ Product/Promo sync; Hcp default only |
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ (DB ping read-only) |
| PromoCode unit tests | ⚠️ Geen dedicated tests in repo |
| Product dimension tests | ⚠️ Geen — velden niet in app |
| Feed/payment/auth regression | ✅ build + smoke-check; geen geautomatiseerde feed/payment suite |

---

## GO/HOLD

| Stap | Besluit | Reden |
|------|---------|-------|
| **Commit schema-sync** | **GO** | Diff bewezen; build groen; geen DB-actie |
| **Merge → main** | **HOLD** | 8 DB-only migratiemappen ontbreken nog in repo |
| **`migrate deploy`** | **HOLD** | Baseline-pack + greenfield test vereist |
| **Greenfield test** | **HOLD** | Disposable Neon branch + baseline folders eerst |

---

## Bevestiging

Geen `migrate deploy/resolve/reset`, geen `db push`, geen DDL, geen merge, geen push, geen deploy.
