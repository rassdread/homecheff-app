# Phase 10 — Production Release Runbook

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline` → `main`  
**Database:** shared Neon — **geen DDL in deze release**

---

## 1. Preconditions (allemaal ✅ in Phase 10 audit)

- [x] `npx prisma migrate status` → up to date
- [x] Baseline `20260714_greenfield_current_state_baseline` applied
- [x] Vercel build zonder auto-migrate
- [x] lint / build / smoke-check groen
- [x] Feed validators Phase 3A–3D groen
- [x] Neon snapshot beschikbaar (operator-bevestigd vóór resolve)

---

## 2. Releasevolgorde

### Stap 1 — Merge naar main

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff performance/phase2-baseline \
  -m "perf(feed): merge feed performance and database baseline work"
```

### Stap 2 — Post-merge verificatie (lokaal of CI)

```bash
npm run lint
npm run build
npm run smoke-check
npx prisma migrate status
```

**Verwacht:** migrate status blijft "up to date" — **geen pending migrations**.

### Stap 3 — Push main

```bash
git push origin main
```

### Stap 4 — Vercel Production build

- Automatisch via GitHub → Vercel op `main`
- BuildCommand: `node scripts/vercel-build.js`
- **Geen** `prisma migrate deploy`

### Stap 5 — Productie smoke (handmatig)

| Check | URL / actie |
|-------|-------------|
| Homepage laadt | https://homecheff.eu |
| Feed tiles | scroll eerste 10 items |
| Legacy media tile | Sacco / Marilyn — afbeelding via `/api/feed/media` |
| Blob tile | Design Studio / Spiegel |
| Inloggen | bestaand account |
| Checkout CTA | zichtbaar op producttile (geen transactie vereist voor smoke) |

### Stap 6 — Performance spot-check (optioneel)

- `FEED_PERF_TIMING=1` **niet** op productie tenzij expliciet goedgekeurd
- Observeer subjectieve feed-latency vs pre-release (~6–8 s → verwacht ~3–5 s cold)

---

## 3. Databasebeleid deze release

| Actie | Uitvoeren? |
|-------|------------|
| `prisma migrate deploy` | **NEE** |
| `prisma migrate resolve` | **NEE** |
| `prisma db push` | **NEE** |
| DDL / index toevoegen | **NEE** |
| Snapshot restore | Alleen bij incident |

Database blijft **ongewijzigd**; release is applicatiecode + migratie-architectuur op filesystem.

---

## 4. Rollback

### Applicatie (primair)

1. Vercel Dashboard → Production → **Previous deployment** → Promote
2. Of: `git revert` merge commit op `main` + push (langzamer)

Rollback **hoeft geen** database-rollback te zijn — geen schema-wijziging in deze release.

### Database (alleen bij onverwacht incident)

1. Neon Console → restore naar pre-resolve snapshot (operator)
2. **Niet** automatisch — alleen na incidentanalyse

---

## 5. Stopcriteria (abort release)

Stop en escaleer als **één** van deze optreedt na production deploy:

| # | Stopcriterium |
|---|---------------|
| 1 | Production build faalt |
| 2 | Homepage/feed 5xx |
| 3 | Wijdverspreide kapotte feed-afbeeldingen |
| 4 | `feedFetches > 1` in productie perf-baseline (indien gemeten) |
| 5 | Onverwachte auth/checkout regressie |
| 6 | Buildlog toont `prisma migrate deploy` |
| 7 | `migrate status` toont pending na deploy (onverwacht) |

Bij stop: **Vercel rollback** (stap 4.1), geen database-mutatie.

---

## 6. Monitoring eerste 30 minuten

- Vercel Functions errors (`/api/feed`, `/api/feed/media`)
- Neon query latency (bestaand dashboard)
- Gebruikersmeldingen feed/media

---

## 7. Wat niet doen

- Geen production migration
- Geen greenfield execute op shared Neon
- Geen force-push naar `main`
- Geen commit van `*-probe-latest.json` of backups
