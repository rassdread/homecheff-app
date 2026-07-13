# Phase 7 — Greenfield Impact (`add_unassigned_delivery_profile`)

**Branch:** `performance/phase2-baseline`  
**Datum:** 2026-07-13  
**Parent:** [`homecheff-prisma-phase7-unassigned-delivery-profile.md`](./homecheff-prisma-phase7-unassigned-delivery-profile.md)

---

## Bevinding

`20260210120000_add_unassigned_delivery_profile` is een **datamigratie** (system user + sentinel `DeliveryProfile`), geen schema-evolutie die nog ontbreekt in `schema.prisma`.

De **functionele** “unassigned delivery”-flow in de app gebruikt:

```typescript
deliveryProfileId: null  // PENDING pool
```

niet `deliveryProfileId: 'unassigned'`.

---

## Wat greenfield nodig heeft

### Verplicht (schema)

| Bron | Effect | In repo? |
|------|--------|----------|
| `20251113120000_make_delivery_profile_optional` | `DeliveryOrder.deliveryProfileId` nullable | ✅ `prisma/migrations/…/migration.sql` |

Zonder deze stap kan de webhook geen `DeliveryOrder` met `deliveryProfileId: null` aanmaken.

### Optioneel (data-pariteit met shared Neon)

| Bron | Effect | App nodig? |
|------|--------|------------|
| `20260210120000_add_unassigned_delivery_profile` | User `system-unassigned-delivery` + Profile `unassigned` | **Nee** — 0 code-references |

**Aanbeveling:** baseline-map met **idempotente INSERT** (ON CONFLICT DO NOTHING) voor history-pariteit en `resolve --applied` op shared DB. Greenfield-app werkt **zonder** deze seed.

### Niet vereist

- Nullable `DeliveryProfile.userId` — bestaat niet op DB; niet in schema
- Sentinel verwijderen op greenfield — geen voordeel; optionele seed schaadt niet (`isActive=false`)

---

## Concrete greenfieldstrategie

**Hybride C (aangescherpt na Phase 7):**

```
1. prisma migrate deploy  → volledige lokale chain (62 mappen)
2. + 8 baseline-mappen    → idempotente SQL per DB-only migratie
3. Voor add_unassigned:   → alleen INSERT system user + profile (geen ALTER)
4. Verificatie:           → DeliveryOrder.deliveryProfileId nullable
                            → webhook/dashboard null-pool werkt
5. Sentinel:              → mag bestaan; geen test op id='unassigned' tenzij legacy cleanup
```

### Volgorde in baseline-pack

Plaats `20260210120000_add_unassigned_delivery_profile` **na**:

- `20250921112416_add_delivery_profile_system`
- `20251113120000_make_delivery_profile_optional`

en **vóór** promo-migraties (chronologisch feb 11).

### Shared Neon (bestaande DB)

| Actie | Effect |
|-------|--------|
| Baseline-map toevoegen | Geen DB-impact tot deploy/resolve |
| `migrate resolve --applied` | Alleen history-row; records bestaan al |
| `migrate deploy` | INSERT … ON CONFLICT DO NOTHING → no-op |

---

## Uitkomstmatrix (Phase 7)

| # | Uitkomst | Van toepassing? |
|---|----------|-----------------|
| 1 | Schemawijziging in baseline | **Gedeeltelijk** — al gedekt door nov 2025 lokale migratie |
| 2 | Systeemrecord via seed/datamigratie | **Ja** — idempotente INSERT in baseline-map |
| 3 | Migratie niet meer relevant | **Gedeeltelijk** — data legacy; schema-deel overgenomen |
| 4 | Alleen eindstaat schema | **Ja** voor app; sentinel optioneel |
| 5 | Extra app/seedvalidatie | **Optioneel** — documenteer dat null-pool canoniek is |

---

## Risico’s greenfield

| Risico | Niveau | Mitigatie |
|--------|--------|-----------|
| Sentinel user in auth flows | Laag | Geen password; intern email-domein |
| Dubbele INSERT zonder ON CONFLICT | Medium | Idempotent SQL verplicht |
| Verwarring null vs sentinel | Medium | Documentatie + geen code naar sentinel |
| FK SET NULL vs RESTRICT | Laag | Volg lokale chain; diff na deploy |

---

## GO/HOLD (greenfield-specifiek)

| Stap | Besluit |
|------|---------|
| Baseline SQL voor deze migratie ontwerpen | **GO** |
| Baseline-map committen | **HOLD** — apart ticket na review Phase 7 docs |
| Disposable Neon `migrate deploy` test | **HOLD** |
| Sentinel seed op greenfield verplicht stellen | **NEE** — optioneel |

---

## Relatie tot merge/deploy

Phase 7 **deblokkeert** reconstructie van deze ene migratie. **Merge main** en **prod migrate deploy** blijven **HOLD** tot:

1. Alle 8 baseline-mappen gereviewd en gecommit
2. Greenfield-test geslaagd
3. Neon backup + geplande resolve-batch op shared DB
