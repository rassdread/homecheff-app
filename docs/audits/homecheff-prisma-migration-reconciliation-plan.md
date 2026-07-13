# HomeCheff — Prisma Migration Reconciliation Plan

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Status:** voorstel — **nog niet uitgevoerd**  
**Companion audit:** [`homecheff-prisma-migration-drift-audit.md`](./homecheff-prisma-migration-drift-audit.md)

Dit document beschrijft een **veilige, geordende** route om migratiehistory en `schema.prisma` te reconciliëren. Alle commando’s zijn **voorbereidend**; voer ze pas uit na expliciete goedkeuring en backup.

---

## Strategieën (legenda)

| Code | Betekenis |
|------|-----------|
| **A** | Origineel migratiebestand herstellen (checksum moet matchen) |
| **B** | Migratie als applied baseline (history-only op DB waar SQL al bestaat) |
| **C** | Schema-baseline vanaf huidige database |
| **D** | Migratie markeren als rolled back |
| **E** | Handmatige correctiemigratie (nieuwe forward migratie) |
| **F** | Blokkeren — nader onderzoek |

---

## Fase 0 — Voorwaarden (verplicht vóór elke wijziging)

| Stap | Doel | Commando | DB-effect | Rollback | Risico | Backup |
|------|------|----------|-----------|----------|--------|--------|
| 0.1 | Vastleggen huidige staat | `npx prisma migrate status` | Geen | — | Laag | — |
| 0.2 | JSON-inventory vernieuwen | `npx tsx --env-file=.env.local scripts/audit-prisma-migration-drift.ts` | Read-only | — | Laag | — |
| 0.3 | Neon logical backup | Neon console / `pg_dump` (schema+data) | Geen | Restore dump | Laag | **Verplicht** vóór deploy/resolve |
| 0.4 | Schema-drift snapshot | `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "$DATABASE_URL" --script > docs/audits/schema-drift-snapshot.sql` | Geen | — | Laag | Bewaar artifact |

**Preview/prod impact:** geen (read-only).

---

## Fase 1 — Acht database-only migraties

**Geen originelen gevonden in Git.** Per migratie: feitelijke DB-stand en strategie.

### 1. `20260208220000_add_user_password_hash`

| Veld | Waarde |
|------|--------|
| DB checksum | `7cc9b15e408538f49812210f0e604bb3d07b82970ab4fa6b9f0b341e773a1248` |
| Feitelijk op DB | `User.passwordHash` TEXT nullable |
| Overlap lokaal | `20250830090428_password_hash_optional`, `20250829113125_user_relations_fix` |
| **Strategie** | **B** + **F** (tot SQL gereconstrueerd) |

**Stappen (na goedkeuring):**

1. Zoek SQL op andere machines / deploy-notities (strategie **A**).
2. Als niet gevonden: maak map `prisma/migrations/20260208220000_add_user_password_hash/migration.sql` met **introspectie-gedreven** idempotente SQL (`ADD COLUMN IF NOT EXISTS "passwordHash" TEXT`) — **alleen** na review.
3. Op gedeelde Neon (SQL al aanwezig):  
   `npx prisma migrate resolve --applied 20260208220000_add_user_password_hash`  
   - **DB-effect:** alleen `_prisma_migrations` insert — **geen DDL**  
   - **Rollback:** handmatig record verwijderen (niet standaard)  
   - **Risico:** laag als kolom bestaat  
   - **Preview/prod:** resolve alleen op DB waar kolom bestaat

**Niet doen:** resolve op fresh DB zonder kolom — verbergt echte drift.

---

### 2. `20260210000000_affiliate_business_subscription_admin_roles`

| Veld | Waarde |
|------|--------|
| DB checksum | `9a9778a9d8c851c65de0ead8aabbf26277088c5809058c9251d01ed5f18605e9` |
| Feitelijk op DB | `Affiliate`, `BusinessSubscription`, `AdminPermissions` tabellen + kolommen |
| Schema | Modellen aanwezig in `schema.prisma` |
| **Strategie** | **B** |

**Stappen:** herstel history-bestand (introspectie of origineel) → `migrate resolve --applied` op Neon. Geen re-deploy DDL op bestaande DB.

---

### 3. `20260211000000_add_superadmin_role`

| Veld | Waarde |
|------|--------|
| DB checksum | `379b2919f5b72a342020425e9660709ab740dea636db0806b08345e904b40e5f` |
| Feitelijk op DB | `UserRole` enum bevat `SUPERADMIN` |
| Schema | `SUPERADMIN` in `enum UserRole` ✅ |
| **Strategie** | **B** |

**Stappen:** baseline-bestand met `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN'` (PostgreSQL 9.1+ pattern via DO-block) → resolve --applied op Neon.

---

### 4. `20260210120000_add_unassigned_delivery_profile`

| Veld | Waarde |
|------|--------|
| DB checksum | `66bb04f0e0ac9c09cfcd3a6712b0a7a0d1ad59463c55e1ba2a032e7d08830f00` |
| Feitelijk op DB | Geen `DeliveryProfile` met `userId IS NULL` in steekproef; `20251113120000_make_delivery_profile_optional` lokaal applied |
| **Strategie** | **F** → daarna **B** |

**Stappen:**

1. **F:** introspecteer of seed/unassigned profile-ID in app-config bestaat.
2. Documenteer beoogde SQL (waarschijnlijk optionele `userId` of placeholder profile).
3. Baseline + resolve alleen als effect **aantoonbaar** op DB.

---

### 5. `20260212000000_promo_code_admin_optional_affiliate`

| Veld | Waarde |
|------|--------|
| DB checksum | `86c13e843208f86803ba822d74de597100e5af72ffd91d60571597c01ebc5ef4` |
| Feitelijk op DB | `PromoCode.affiliateId` nullable |
| Schema | `affiliateId String` **required** ❌ |
| **Strategie** | **B** + **E** (schema fix) |

**Schema-fix (E, code-only):** `affiliateId String?` + relation optional in `schema.prisma`.

**History (B):** baseline SQL `ALTER COLUMN "affiliateId" DROP NOT NULL` → resolve --applied.

---

### 6. `20260212000000_promo_code_affiliate_optional`

| Veld | Waarde |
|------|--------|
| DB checksum | `f306c0f9587798b61c7b3bee4da1060371a914486e9a5bec41f1e539bb66573c` |
| Feitelijk op DB | Zelfde nullable `affiliateId` (mogelijk duplicate stap) |
| **Strategie** | **B** + **F** (verifieer of dubbel t.o.v. #5) |

**Stappen:** vergelijk applied volgorde; mogelijk één baseline-deel. **Niet** twee keer DDL op fresh DB.

---

### 7. `20260212100000_promo_code_seller_id`

| Veld | Waarde |
|------|--------|
| DB checksum | `f798e5ac7433e18b369395f303a0bce34a7c6e3e648edbc5ac844e8b09018dcd` |
| Feitelijk op DB | `PromoCode.sellerId` nullable + index `PromoCode_sellerId_idx` + FK naar `User` |
| Schema | `sellerId` ontbreekt ❌ |
| **Strategie** | **B** + **E** |

**Schema-fix:** voeg `sellerId String?` + relation + `@@index([sellerId])` toe.

**Baseline SQL:** `ADD COLUMN IF NOT EXISTS`, index, FK — idempotent.

---

### 8. `20260212120000_add_product_weight_dimensions`

| Veld | Waarde |
|------|--------|
| DB checksum | `06fc2f411e60820eed738a72175689f27a539166ddcee688d406aa3f55141ccc` |
| Feitelijk op DB | `Product.lengthCm`, `widthCm`, `heightCm`, `weightKg` (double precision) |
| Schema | Kolommen ontbreken ❌ |
| **Strategie** | **B** + **E** |

**Schema-fix:** voeg optionele `Float?` velden toe aan `Product`.

**Baseline SQL:** vier `ADD COLUMN IF NOT EXISTS` — idempotent.

---

## Fase 2 — Geconsolideerd baseline-pack (aanbevolen aanpak)

In plaats van 8 losse resolve-acties zonder bestanden:

| Stap | Doel | Actie |
|------|------|-------|
| 2.1 | **C** — documenteer actuele DB | `prisma db pull` naar tijdelijk branch **of** handmatig schema bijwerken (voorkeur: gerichte E-fixes) |
| 2.2 | History-pack | Maak **8 mappen** met idempotente SQL afgeleid van `migrate diff` + introspectie |
| 2.3 | Checksum verificatie | **Alleen** `resolve --applied` als nieuw bestand **exact** DB-checksum produceert **of** accepteer bewuste checksum drift met nieuw bestand op **nieuwe** omgevingen |
| 2.4 | Volgorde | Chronologisch: 20260208 → 20260212 (zoals DB `started_at`) |

**Kritisch:** Prisma checksum van gereconstrueerd bestand zal **niet** matchen met DB-checksum tenzij byte-identiek origineel. Twee opties:

1. **History sync zonder checksum-match:** nieuwe bestanden voor **toekomstige** bootstrap; op Neon `resolve --applied` per naam (geen DDL). Accepteer checksum mismatch op oude records — Prisma klaagt niet zolang naam in DB staat.
2. **A** als origineel later gevonden: vervang bestand, checksum moet `db_checksum` zijn.

**Deploy-blokkade:** `migrate deploy` op **nieuwe** database blijft **HOLD** tot baseline-pack in `main` staat en getest op disposable Neon branch.

---

## Fase 3 — Checksum mismatch (28 historische migraties)

| Strategie | **F** (geen actie op productie-DB) |

| Stap | Doel | Commando | DB-effect | Risico |
|------|------|----------|-----------|--------|
| 3.1 | Bevestig applied | Inventory JSON | Geen | Laag |
| 3.2 | Geen re-apply | **Geen** `migrate deploy --force` | — | **Hoog** als SQL opnieuw draait |
| 3.3 | Greenfield-only fix (optioneel) | Nieuw project: `C` full baseline squash | Alleen nieuwe DB | Medium |

**Rollback:** n.v.t. — geen wijziging voorgesteld op bestaande Neon.

**Preview/prod:** geen impact bij geen actie.

---

## Fase 4 — Anomalie `20260705140000_conversation_context_layer`

| Veld | Waarde |
|------|--------|
| applied_steps_count | 0 |
| Feitelijk op DB | `contextType`, `contextId`, `status`, `metadata` + indexes ✅ |
| **Strategie** | **F** (documenteer) — **geen** resolve/rollback |

**Actie:** verifieer met `SELECT` op `Conversation` (read-only). Als objecten bestaan → **geen** re-apply. Optioneel log in runbook waarom steps=0.

---

## Fase 5 — Dish-index (`20260713_dish_status_created_at_feed_index`)

| Besluit | Detail |
|---------|--------|
| **Strategie** | **B** (reeds uitgevoerd op Neon) |
| Gedeelde Neon | Migratie **applied**, checksum **match** — **geen actie** |
| Nieuwe omgeving | **`migrate deploy` veilig** (`IF NOT EXISTS`) |
| `resolve --applied` | **Niet nodig** op huidige DB |
| SQL aanpassen | **Niet nodig** |

| Commando (alleen nieuwe env) | `npx prisma migrate deploy` |
| DB-effect | Index aangemaakt als afwezig |
| Rollback | `DROP INDEX IF EXISTS "Dish_status_createdAt_idx";` + migratie-record handmatig |
| Risico | Laag |
| Backup | Schema backup voldoende |

---

## Fase 6 — Schema.prisma synchronisatie (E)

**Vóór merge naar main**, onafhankelijk van migratie-history:

```prisma
// Product model — toevoegen:
lengthCm   Float?
widthCm    Float?
heightCm   Float?
weightKg   Float?

// PromoCode model — wijzigen:
affiliateId  String?
affiliate    Affiliate? @relation(...)
sellerId     String?
seller       User?      @relation(...)
@@index([sellerId])
```

| Stap | Commando | DB-effect |
|------|----------|-----------|
| 6.1 | Handmatig `schema.prisma` edit | Geen |
| 6.2 | `npx prisma validate` | Geen |
| 6.3 | `npx prisma migrate diff` → moet leeg of alleen defaults | Geen |
| 6.4 | **Geen** nieuwe migratie tot baseline-pack klaar | — |

**Risico zonder schema-fix:** runtime Prisma-client wijkt af van DB (promo/product velden onzichtbaar voor ORM).

---

## Uitvoeringsvolgorde (aanbevolen)

```
0. Backup Neon
1. schema.prisma fixes (Product + PromoCode) — commit op feature branch
2. Maak 8 baseline migration folders (idempotent SQL, gereviewd)
3. Op shared Neon: migrate resolve --applied × 8 (geen deploy DDL)
4. prisma migrate status → verwacht: geen DB-only warnings
5. Test migrate deploy op disposable Neon branch (fresh)
6. lint / build / smoke-check
7. Merge main (applicatie) — migrate deploy apart goedkeuren
```

---

## GO/HOLD matrix (herhaling)

| Stap | Besluit |
|------|---------|
| Merge performance → main | **HOLD** tot Fase 1–2 + 6 gereed |
| Vercel build (geen migrate) | **GO** |
| `prisma migrate deploy` (shared prod/preview) | **HOLD** |
| Dish-index op huidige Neon | **GO** (klaar) |
| Productie-uitrol incl. migrate | **HOLD** |

---

## Wat expliciet verboden blijft (tenzij nieuw ticket)

- `prisma migrate reset` op gedeelde Neon
- `resolve --applied` zonder aantoonbaar bestaande SQL
- `deploy` terwijl 8 DB-only niet in lokale mappen staan
- Checksum-mismatch bestanden “fixen” door re-deploy op productie

---

## Bevestiging

Dit plan is **documentatie only**. Geen commando’s uit dit plan zijn tijdens de audit uitgevoerd.
