# Phase 6 — Product Dimensions (lengthCm, widthCm, heightCm, weightKg)

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Methode:** read-only DB metadata + `prisma migrate diff` + codebase grep

---

## Samenvatting

| Veld | Prisma-type (voorstel) | DB-type | Nullable | Default | @map |
|------|------------------------|---------|----------|---------|------|
| `lengthCm` | `Float?` | `double precision` (float8) | **YES** | none | **Nee** — kolomnaam identiek |
| `widthCm` | `Float?` | `double precision` | **YES** | none | Nee |
| `heightCm` | `Float?` | `double precision` | **YES** | none | Nee |
| `weightKg` | `Float?` | `double precision` | **YES** | none | Nee |

**Eenheid:** centimeters (L×B×H), kilogram (gewicht). Geen `weightGrams` kolom op DB.

---

## Live database (read-only)

Bron: `scripts/phase6-schema-probes.ts` → Neon shared preview.

```json
{
  "data_type": "double precision",
  "udt_name": "float8",
  "is_nullable": "YES",
  "column_default": null,
  "numeric_precision": 53
}
```

(Voor elk van de vier kolommen — identieke metadata.)

### Data-populatie (preview DB)

| Metriek | Waarde |
|---------|--------|
| Totaal producten | 7 |
| `lengthCm` ingevuld | 0 |
| `widthCm` ingevuld | 0 |
| `heightCm` ingevuld | 0 |
| `weightKg` ingevuld | 0 |

Kolommen zijn **schema-voorbereid** maar nog **niet gebruikt** in productiedata op deze database.

---

## Codebase-consumers

| Gebied | Gebruik |
|--------|---------|
| TypeScript/TSX | **Geen** referenties naar `lengthCm`, `widthCm`, `heightCm`, `weightKg` |
| API-routes | Geen create/update/read van dimensievelden |
| Formulieren / validators | Geen |
| Feed / discovery | Geen |
| Shipping / Ectaro / delivery | Geen directe mapping gevonden |

**Conclusie:** velden zijn **DB-only infrastructure** (migratie `20260212120000_add_product_weight_dimensions`) zonder applicatie-integratie. Toevoegen aan `schema.prisma` **breekt geen API-contract** — velden waren voor Prisma-client onzichtbaar.

---

## Prisma mapping

```prisma
/// Physical dimensions for shipping/parcel (optional; cm / kg)
lengthCm  Float?
widthCm   Float?
heightCm  Float?
weightKg  Float?
```

- `Float` ↔ PostgreSQL `double precision` (IEEE 754, 53-bit precision).
- Geen `@db.Decimal` — DB gebruikt geen `numeric`.
- Optioneel overal — past bij 100% NULL-data en shipping use-case (niet elk product heeft pakketdata).

---

## Migratie-oorsprong

| Item | Waarde |
|------|--------|
| DB-only migratie | `20260212120000_add_product_weight_dimensions` |
| Checksum (DB) | `06fc2f411e60820eed738a72175689f27a539166ddcee688d406aa3f55141ccc` |
| Lokaal migratiebestand | **Ontbreekt** |

---

## Voorgestelde idempotente SQL (greenfield / baseline)

*Niet uitgevoerd — documentatie only.*

```sql
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lengthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "widthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "heightCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightKg" DOUBLE PRECISION;
```

Op **bestaande** shared Neon: **geen DDL nodig** (kolommen bestaan). Alleen `schema.prisma` sync.

---

## Risico’s

| Risico | Niveau | Toelichting |
|--------|--------|-------------|
| Dataverlies | Geen | Alleen schema-declaratie |
| API-break | Geen | Geen consumers |
| Type mismatch | Laag | Float ↔ float8 bewezen |
| Nullable te strict | Geen | DB is nullable, schema `Float?` match |

---

## Schema-sync status

`prisma/schema.prisma` is **lokaal bijgewerkt** (Phase 6).  
`prisma migrate diff --from-schema-datamodel … --to-url …` toont **geen** Product-drift meer (alleen HcpCarouselSlide default — zie schema-sync doc).
