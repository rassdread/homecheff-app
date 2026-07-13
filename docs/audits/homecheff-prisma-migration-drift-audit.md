# HomeCheff — Prisma Migration Drift Reconciliation Audit

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Database:** Neon PostgreSQL (`neondb`, schema `public`) — endpoint `ep-summer-darkness-a2l0745u` (geen credentials in dit document)  
**Methode:** uitsluitend read-only (`_prisma_migrations`, `information_schema`, `pg_indexes`, `prisma migrate status`, `prisma migrate diff`)

## Executive summary

| Metriek | Waarde |
|--------|--------|
| Lokale migratiemappen | **62** |
| `_prisma_migrations` records | **72** |
| Checksum match (lokaal ∩ DB) | **34** |
| Checksum mismatch (lokaal ∩ DB) | **28** |
| Alleen database (8 ontbrekend lokaal) | **8** |
| Alleen lokaal (niet in DB) | **0** |
| Failed / rolled back | **0** |
| Laatste gemeenschappelijke migratie | `20260709_phase13e_admin_p0` |
| `npx prisma migrate status` (nu) | **Database schema is up to date!** (geen pending lokale migraties) |

**Kernprobleem:** de gedeelde Neon-database bevat **8 migraties in `_prisma_migrations` waarvan de mapbestanden nooit in deze repository hebben gestaan** (niet in `HEAD`, niet in `git log --all`, niet in stash). Daarnaast wijken **28 oudere migratiebestanden** checksum-af van wat op de database is toegepast — typisch voor herschreven history na productie-deploy.

**Schema-drift (live DB vs `prisma/schema.prisma`):** `Product` mist `lengthCm`, `widthCm`, `heightCm`, `weightKg`; `PromoCode` mist `sellerId` en `affiliateId` is in DB nullable terwijl het schema required is.

**Dish-index:** live index, schema en baselinemigratie komen overeen; migratie staat **applied** in DB met **matching checksum**.

**Geen databaseacties uitgevoerd** tijdens deze audit (geen deploy, resolve, reset, push, merge, DDL).

---

## Deel 1 — Lokale migratiegeschiedenis

Volledige machine-leesbare inventaris: [`homecheff-prisma-migration-inventory.json`](./homecheff-prisma-migration-inventory.json) (`local_inventory`, checksums, summaries).

### Overzicht

- **62** mappen onder `prisma/migrations/`, elk met `migration.sql`
- **Geen** lokale migratie met `CREATE INDEX CONCURRENTLY` in `migration.sql` (CONCURRENTLY alleen in audit-doc `docs/audits/homecheff-performance-phase3d-migrations/`, niet in Prisma-migraties)
- **Geen** strikt lege bestanden; wel **no-op placeholder:** `20250114_add_conversation_participant_hidden` (alleen commentaar)
- **Baseline / idempotent:** `20260713_dish_status_created_at_feed_index` (`CREATE INDEX IF NOT EXISTS`)
- **Handmatige SQL / backfill:** o.a. `20260705140000_conversation_context_layer` (UPDATE-backfill op `Conversation`)
- **Destructieve lokale SQL** (DROP/TRUNCATE in bestand):  
  `20250828180304_init_all_tables`, `20250829113125_user_relations_fix`, `20250829152749_add_subscription_model`, `20250901213337_rename_company_to_business`, `20250920183824_add_realtime_messaging`, `20250924150344_add_workspace_content`
- **Dubbele / overlappende history:**  
  - `20250114_add_conversation_participant_hidden` (placeholder) + `20250114120000_add_is_hidden_to_participant` (echte kolom + index)  
  - `20250108000001_fix_dish_review_updated_at` + `add_dish_reviews` (zelfde DishReview-thema, beide applied)
- **Non-timestamp map:** `add_dish_reviews` (applied 2025-12-16, checksum match)

### Volgorde vanaf `20260709_phase13e_admin_p0`

| # | Migratie | Checksum (lokaal) | Belangrijkste wijziging | DB-status |
|---|----------|-------------------|-------------------------|-----------|
| 1 | `20260713_dish_status_created_at_feed_index` | `daa46b64…` | `CREATE INDEX IF NOT EXISTS Dish_status_createdAt_idx` | Applied, checksum **match** |

*Opmerking:* `add_dish_reviews` staat alfabetisch in de maplijst maar is historisch **vóór** 2026-07 toegepast (2025-12-16); niet “na” phase13e in applied-tijdlijn.

---

## Deel 2 — Databasehistorie (`_prisma_migrations`, read-only)

**72 records** gelezen. Geen `rolled_back_at` gevuld. Geen failed records (`finished_at` overal gezet).

### De 8 migraties alleen in database (ontbreken lokaal)

| migration_name | started_at (UTC) | finished_at (UTC) | applied_steps | checksum (DB) |
|----------------|------------------|-------------------|---------------|---------------|
| `20260208220000_add_user_password_hash` | 2026-02-09T21:09:29.705Z | 2026-02-09T21:09:29.823Z | 1 | `7cc9b15e408538f49812210f0e604bb3d07b82970ab4fa6b9f0b341e773a1248` |
| `20260210000000_affiliate_business_subscription_admin_roles` | 2026-02-10T22:43:05.803Z | 2026-02-10T22:43:05.926Z | 1 | `9a9778a9d8c851c65de0ead8aabbf26277088c5809058c9251d01ed5f18605e9` |
| `20260211000000_add_superadmin_role` | 2026-02-10T22:43:05.969Z | 2026-02-10T22:43:06.077Z | 1 | `379b2919f5b72a342020425e9660709ab740dea636db0806b08345e904b40e5f` |
| `20260210120000_add_unassigned_delivery_profile` | 2026-02-11T22:24:18.499Z | 2026-02-11T22:24:18.619Z | 1 | `66bb04f0e0ac9c09cfcd3a6712b0a7a0d1ad59463c55e1ba2a032e7d08830f00` |
| `20260212000000_promo_code_admin_optional_affiliate` | 2026-02-11T22:24:18.661Z | 2026-02-11T22:24:18.767Z | 1 | `86c13e843208f86803ba822d74de597100e5af72ffd91d60571597c01ebc5ef4` |
| `20260212000000_promo_code_affiliate_optional` | 2026-02-14T14:42:50.830Z | 2026-02-14T14:42:50.947Z | 1 | `f306c0f9587798b61c7b3bee4da1060371a914486e9a5bec41f1e539bb66573c` |
| `20260212100000_promo_code_seller_id` | 2026-02-14T14:42:50.991Z | 2026-02-14T14:42:51.122Z | 1 | `f798e5ac7433e18b369395f303a0bce34a7c6e3e648edbc5ac844e8b09018dcd` |
| `20260212120000_add_product_weight_dimensions` | 2026-02-14T14:42:51.167Z | 2026-02-14T14:42:51.278Z | 1 | `06fc2f411e60820eed738a72175689f27a539166ddcee688d406aa3f55141ccc` |

Exacte checksums voor alle 8: `inventory.json` → `db_only_migrations`.

**Logs:** geen error/fail-logs van belang in `_prisma_migrations.logs`.

### Anomalie

| Migratie | applied_steps_count | Opmerking |
|----------|---------------------|-----------|
| `20260705140000_conversation_context_layer` | **0** | `finished_at` gezet; kolommen `contextType`, `contextId`, `status` **bestaan wel** op `Conversation` |

Waarschijnlijk handmatig resolved of lege stap geregistreerd; feitelijke schema-objecten zijn aanwezig.

### Dish-migratie in DB

`20260713_dish_status_created_at_feed_index` — applied **2026-07-13T00:43:13Z**, checksum **`daa46b64…`** (identiek aan lokaal bestand).

---

## Deel 3 — Vergelijking lokaal vs database

### Classificatie (samenvatting)

| Status | Aantal |
|--------|--------|
| `local_and_db_checksum_match` | 34 |
| `local_and_db_checksum_mismatch` | 28 |
| `db_only` | 8 |
| `local_only` | 0 |
| `failed` / `rolled_back` | 0 |

### Checksum mismatch (28) — namen

Alle vóór ~2026-02 in applied-tijd of init-herstructurering:

`20250108000000_auto_encryption`, `20250108000001_fix_dish_review_updated_at`, `20250114120000_add_is_hidden_to_participant`, `20250114_add_conversation_participant_hidden`, `20250115000000_add_notification_preferences`, `20250115000001_add_tab_permissions`, `20250115_add_dish_video`, `20250120000000_make_reservation_id_optional`, `20250826141844_init`, `20250826185222_products_init`, `20250827185027_add_images`, `20250828180304_init_all_tables`, `20250829113125_user_relations_fix`, `20250829113321_image_workspace_support`, `20250829152749_add_subscription_model`, `20250830083724_npx_prisma_format_npx_prisma_migrate_dev`, `20250830090428_password_hash_optional`, `20250831211328_add_profile_image`, `20250901151719_add_dishes_and_username`, `20250901205335_add_company`, `20250901205523_add_company_fields`, `20250901210104_support_favorites_for_products`, `20250901210943_add_order_items`, `20250901211324_add_user_interests`, `20250901212503_add_workplace_photos`, `20250901213337_rename_company_to_business`, `20251109183030_add_stripe_subscription_refs`, `20251113120000_make_delivery_profile_optional`

**Interpretatie:** database is met **oudere SQL-versies** van deze bestanden gemigreerd; lokale bestanden zijn later bijgewerkt (idempotent guards, formatting, squash). **Niet opnieuw deployen** op bestaande DB — Prisma ziet ze als applied.

**Recente migraties (≥ 20260702) met checksum match:** o.a. marketplace-, trust-, phase13e-, dish-indexmigraties.

### Schema vs database (`prisma migrate diff`)

Van `schema.prisma` → live DB (wat DB heeft maar schema niet):

```sql
-- Product (van ontbrekende DB-only migratie)
ALTER TABLE "Product" ADD COLUMN "heightCm", "lengthCm", "weightKg", "widthCm" ...

-- PromoCode (van DB-only promo-migraties)
ALTER TABLE "PromoCode" ADD COLUMN "sellerId", ALTER "affiliateId" DROP NOT NULL;
CREATE INDEX "PromoCode_sellerId_idx" ...
ADD FK PromoCode_sellerId → User
```

**Feitelijk aanwezig op DB (read-only checks):**

| Object | Status |
|--------|--------|
| `User.passwordHash` | ✅ |
| `User.suspendedAt` | ✅ |
| `UserRole` enum `SUPERADMIN` | ✅ (schema ook) |
| `Role` enum | BUYER, SELLER, ADMIN only (geen SUPERADMIN — verwacht) |
| `Product.lengthCm/widthCm/heightCm/weightKg` | ✅ DB / ❌ schema |
| `PromoCode.affiliateId` nullable | ✅ DB / ❌ schema (required) |
| `PromoCode.sellerId` | ✅ DB / ❌ schema |
| `Affiliate`, `BusinessSubscription`, `AdminPermissions` | ✅ |
| `Dish_status_createdAt_idx` | ✅ |
| `Conversation.contextType/contextId/status` | ✅ |

### Handmatig uitgevoerd zonder lokale history

- **Dish-index:** oorspronkelijk handmatig (Phase 3D CONCURRENTLY-script); daarna **baselinemigratie applied** in `_prisma_migrations` — history nu gesynchroniseerd op deze DB.
- **8 DB-only migraties:** SQL nooit in repo; effecten **deels** wel op DB, **niet** volledig in `schema.prisma`.

---

## Deel 4 — Zoektocht ontbrekende migratiebestanden

| Bron | Resultaat |
|------|-----------|
| `git log --all` op `prisma/migrations/<naam>/` | **Geen commits** voor alle 8 namen |
| `git stash` | Geen matches |
| Repository grep | **Geen** bestanden met die namen |
| `backup-pre-conversation-context-logical-20260705-041402.json` | Alleen conversation snapshot, geen migraties |
| `docs/audits/homecheff-performance-phase3d-migrations/` | Alleen Dish-index **voorstel**-SQL |
| CI/CD (`gh`) | Niet beschikbaar in deze omgeving |
| Remote branches | `main`, `performance/phase2-baseline` — geen extra migratiemappen |

**Conclusie:** originelen **niet recoverable** uit Git. Geen automatische reconstructie uitgevoerd. Gecontroleerd baselinevoorstel staat in het [reconciliation plan](./homecheff-prisma-migration-reconciliation-plan.md).

---

## Deel 5 — Veilig herstelplan (samenvatting)

Gedetailleerde stappen per migratie: [`homecheff-prisma-migration-reconciliation-plan.md`](./homecheff-prisma-migration-reconciliation-plan.md).

| Groep | Strategie |
|-------|-----------|
| 8 DB-only | **B** (applied baseline) + **E** (schema.prisma bijwerken) — **niet** F als eindtoestand, wel **F** tot originelen gevonden |
| 28 checksum mismatch | **F** voor re-bootstrap; op productie-DB **geen actie** (already applied) |
| `20260705140000_conversation_context_layer` (steps=0) | **F** verifiëren; objecten bestaan → geen re-apply |
| Dish-index | Al applied → geen resolve nodig op deze DB |

---

## Deel 6 — Dish-indexspecifiek

| Aspect | Live DB | `schema.prisma` | `20260713_…/migration.sql` |
|--------|---------|-----------------|----------------------------|
| Naam | `Dish_status_createdAt_idx` | `@@index([status, createdAt(sort: Desc)])` | `"Dish_status_createdAt_idx"` |
| Kolommen | `(status, "createdAt" DESC)` | status + createdAt Desc | `"status", "createdAt" DESC` |
| Definitie | `CREATE INDEX … USING btree (status, "createdAt" DESC)` | — | `CREATE INDEX IF NOT EXISTS …` |

**Besluit:** op gedeelde Neon is history **al applied** (checksum match). Op **nieuwe** omgevingen: **migratie mag later veilig via `migrate deploy`** (`IF NOT EXISTS`). **Geen `resolve` nodig** op deze DB. **Geen aanpassing** van SQL vereist.

---

## Deel 7 — Merge- en deploymentbesluit

| Stap | Besluit | Toelichting |
|------|---------|-------------|
| **Merge `performance/phase2-baseline` → `main`** | **HOLD** | Migratiedrift (8 DB-only) + `schema.prisma` achter op DB (Product, PromoCode). Code (perf/cache) kan review-klaar zijn, maar merge zonder migratieplan riskeert drift voor andere devs/CI. |
| **Vercel build zonder migrations** | **GO** | Applicatiecode buildt onafhankelijk; geen automatische Prisma-deploy in standaard build. |
| **`prisma migrate deploy`** | **HOLD** | Tot 8 DB-only migraties verklaard en lokale history baseline-pack staat **of** schema expliciet gelijkgetrokken. Deploy op bestaande DB is nu no-op voor pending (0), maar **greenfield/bootstrap** mist DB-only effecten. |
| **Dish-index history** | **GO** (deze DB) | Reeds applied. Andere envs: deploy met `IF NOT EXISTS`. |
| **Productie-uitrol (incl. migrate)** | **HOLD** | Zelfde als deploy; eerst reconciliation + schema-sync. |

**Onderscheid:** performance-code kan merge-ready zijn voor **application deploy**; **database-migratie-deploy blijft geblokkeerd** tot reconciliation afgerond is.

---

## Bijlagen

- Machine inventory: [`homecheff-prisma-migration-inventory.json`](./homecheff-prisma-migration-inventory.json)
- Herstelplan: [`homecheff-prisma-migration-reconciliation-plan.md`](./homecheff-prisma-migration-reconciliation-plan.md)
- Audit-script (read-only): `scripts/audit-prisma-migration-drift.ts`

## Bevestiging uitgevoerde acties

| Actie | Uitgevoerd? |
|-------|-------------|
| `prisma migrate deploy` | ❌ Nee |
| `prisma migrate resolve` | ❌ Nee |
| `prisma migrate reset` | ❌ Nee |
| `db push` / DDL | ❌ Nee |
| Merge naar `main` | ❌ Nee |
| `git push` | ❌ Nee |
| Productie/preview deploy | ❌ Nee |
