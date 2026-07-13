# Phase 9A — Disposable Test Readiness

**Script:** `scripts/run-disposable-greenfield-test.ts`  
**Safety validator:** `scripts/validate-disposable-greenfield-safety.ts`  
**Status:** klaar voor review — **niet uitgevoerd** op database

---

## Safety controls

| Vereiste | Geïmplementeerd |
|----------|-----------------|
| `GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE` | ✅ |
| `GREENFIELD_DATABASE_URL` (expliciet, geen `.env.local`) | ✅ |
| Blokkeer `ep-summer-darkness-a2l0745u` | ✅ |
| Blokkeer `homecheff.eu` | ✅ |
| Toon host/database alleen | ✅ `parseDbUrl` |
| Lege DB check | ✅ 0 public tables |
| Geen auto-reset | ✅ |
| Geen DROP DATABASE | ✅ |
| Cleanup apart: `GREENFIELD_CLEANUP_ACK` | ✅ |
| Default dry-run | ✅ |
| Stopt bij elke mislukte stap | ✅ throw + report |
| Geen handmatige `_prisma_migrations` INSERT | ✅ |
| Officiële `migrate resolve` / `deploy` | ✅ |
| Pre-cutoff migration root guard | ✅ weigert 61 resterende mappen |

---

## Exacte testflow (12 stappen)

| # | Stap | Verwachte output |
|---|------|------------------|
| 1 | Identity check | `Target: host=… database=…` geen credentials |
| 2 | Empty check | 0 public tables |
| 3 | Migration root | Geen mappen `< 20260714_greenfield…` |
| 4 | Baseline DDL | Path A: deploy OK; Path B: db execute OK |
| 5 | Registration | resolve applied OK of deploy checksum auto |
| 6 | `migrate status` | `Database schema is up to date!` |
| 7 | Post-cutoff deploy | Geen pending of alle post-cutoff applied |
| 8 | `prisma generate` | Client generated |
| 9 | Schema diff | **Leeg** of alleen `HcpCarouselSlide.updatedAt` |
| 10 | build + smoke-check | Pass |
| 11 | CRUD | User, Product, PromoCode (seller), DeliveryProfile, Dish, CommunityOrder chain, DealReview |
| 12 | History audit | Geen `_prisma_migrations` namen vóór baseline |

### Verwachte failure vóór promote

```text
Greenfield --execute blocked: 61 pre-cutoff migrations still in prisma/migrations/
```

Dit is **correct gedrag** tot archive-stap is uitgevoerd.

---

## Commando's

### Dry-run (default)

```bash
npx tsx scripts/run-disposable-greenfield-test.ts
npx tsx scripts/validate-disposable-greenfield-safety.ts
```

### Execute (na promote + disposable URL)

```bash
export GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE
export GREENFIELD_DATABASE_URL="postgresql://...@<disposable-neon>/..."
npx tsx scripts/run-disposable-greenfield-test.ts --execute
```

### Cleanup (optioneel)

```bash
export GREENFIELD_CLEANUP_ACK=I_UNDERSTAND_CLEANUP
npx tsx scripts/run-disposable-greenfield-test.ts --execute --cleanup
```

---

## Rapporten

| Bestand | Wanneer |
|---------|---------|
| `docs/audits/greenfield-test-plan-dry-run-*.json` | dry-run |
| `docs/audits/greenfield-test-report-*.json` | execute |

---

## Post-cutoff beleid (Deel 8)

| Concept | Waarde |
|---------|--------|
| **Baseline migration** | `20260714_greenfield_current_state_baseline` |
| **Historisch / archive** | Alles `< 20260714…` → `prisma/migrations-archive/pre-20260714-greenfield/` |
| **Eerste gedeelde post-baseline migratie** | Eerste map met timestamp **>** `20260714_greenfield_current_state_baseline` |
| **Naming policy** | `YYYYMMDDHHMMSS_descriptive_snake_case`; timestamp **>** baseline |
| **CI guard (voorstel)** | Fail als nieuwe migratie in `prisma/migrations/` sorteer naam `< baseline` |

### Regels toekomstige migraties

1. Alleen in `prisma/migrations/` (niet archive)
2. Timestamp strikt na cutoff
3. `prisma migrate deploy` op shared Neon + greenfield na baseline
4. Geen loose `.sql` in migrations root

---

## Phase 8 mappen (Deel 9)

| Actie | Status |
|-------|--------|
| Verplaatst naar `docs/baseline-history/phase8-reconstructed/` | ✅ |
| Niet in actieve `prisma/migrations/` | ✅ gecontroleerd |
| Geen invloed op greenfield deploy | ✅ inhoud in baseline SQL |
