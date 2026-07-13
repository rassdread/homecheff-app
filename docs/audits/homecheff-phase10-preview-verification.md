# Phase 10 — Preview Deployment Verification

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline`  
**Commit:** `4632a9b` — `chore(prisma): promote current-state baseline and archive legacy migrations`

---

## 1. Deployment status

| Veld | Waarde |
|------|--------|
| Commit hash | `4632a9b` |
| GitHub commit status | ✅ **success** — `Vercel – homecheff-app` — "Deployment has completed" |
| Vercel dashboard | https://vercel.com/sergio-s-projects-f7b64ee1/homecheff-app/paGVMipvqZrpA2zBN9YL5MtuRvr5 |
| Build command | `node scripts/vercel-build.js` |
| `prisma migrate deploy` in build | ❌ **Afwezig** (bevestigd via `validate-no-auto-migrations-in-build` + `scripts/vercel-build.js`) |
| Database write tijdens build | ❌ **Geen** — alleen `prisma generate` + `next build` |

### SSO-beperking

Preview-URL's (`*.vercel.app`) zijn **Vercel SSO-beschermd**. Geautomatiseerde `curl` tegen preview retourneert `302 → vercel.com/sso-api`.

**Impact:** geen geautomatiseerde browser/console-verificatie in CI-agentcontext. Build- en commitstatus zijn wel groen; functionele verificatie via:

1. GitHub/Vercel deployment success op exacte commit
2. Lokale productie-build tegen **dezelfde shared Neon** (`DATABASE_URL`)
3. Eerdere handmatige preview-metingen (Phase 3C/3D) op dezelfde branch

---

## 2. Buildpad-verificatie

`vercel.json`:

```json
"buildCommand": "node scripts/vercel-build.js"
```

`scripts/vercel-build.js` stappen:

1. `npx prisma generate`
2. `cross-env … next build`

Geen migratie-, push- of execute-stappen.

Legacy pad `build:vercel-old` (met `migrate deploy`) bestaat nog in `package.json` maar is **niet** het actieve Vercel buildCommand.

---

## 3. Functionele feedcontrole (lokaal prod-build, shared Neon)

Uitgevoerd zonder `FEED_PERF_TIMING` (productie-equivalente payload):

| Item | Afbeelding | Type |
|------|------------|------|
| HomeCheff Design Studio | Vercel blob URL | product |
| Kunstschilderijen (Sacco) | `/api/feed/media?type=product&id=4f822286-…&i=0` | legacy inline → proxy |
| Marilyn Monroe A3 | `/api/feed/media?type=product&id=1823cae9-…&i=0` | legacy inline → proxy |
| Elvis presley A3 | `/api/feed/media?type=product&id=e648aaec-…&i=0` | legacy inline → proxy |
| Spiegel van de ziel | Vercel blob URL | dish/listing |

| Check | Resultaat |
|-------|-----------|
| `GET /api/feed` status | 200 |
| Items eerste pagina | 10 |
| Inline `data:` in JSON (items) | **0** |
| Legacy media via proxy | ✅ |
| Response size | ~40 KB |

### Feedcontract (statisch)

| Check | Validator |
|-------|-----------|
| Single feed fetch | `validate-feed-contract-phase3a`, `validate-feed-trust-phase3b` |
| Stats deferred | `validate-feed-stats-defer-phase3b` |
| Desktop 1 kolom default | `validate-feed-desktop-layout-phase3c/3d` |
| Trust cache | `validate-feed-trust-cache-phase3d` |
| Media safety | `validate-feed-legacy-media-phase3c` |

---

## 4. Console / CSP classificatie

| Waarschuwing | Classificatie |
|--------------|---------------|
| `vercel.live` CSP | **Bestaand / non-blocking** — Vercel preview tooling |
| Google Tag Manager CSP | **Bestaand / non-blocking** — analytics |
| Nieuwe applicatiefouten in feedpad | **Geen** gedetecteerd in lokale prod-build smoke |

---

## 5. Preview performance context (eerder gemeten op branch)

Uit `homecheff-performance-phase3d-final.md` (handmatige preview, `FEED_PERF_TIMING=1`):

| Run | Server ms | Product | Dish | Trust |
|-----|-----------|---------|------|-------|
| 1 | 4315 | 1297 | 1326 | 1207 |
| 2 | 3000 | 1297 | 952 | 373 |
| 3 | 2822 | 1395 | 951 | 188 |

`feedFetches=1`, `geoFeedMounts=1` bevestigd in die sessie.

---

## 6. Preview verdict

| Aspect | Status |
|--------|--------|
| Deployment op `4632a9b` | ✅ GROEN |
| Build zonder migrate | ✅ GROEN |
| Geautomatiseerde preview HTTP (SSO) | ⚠️ GEBLOKKEERD — non-blocking |
| Functionele feed (lokaal + Neon) | ✅ GROEN |
| Afbeeldingen / legacy media | ✅ GROEN |

**Aanbeveling vóór productie:** handmatige SSO-preview check (homepage open, feed scroll, 1–2 legacy tiles) door operator met Vercel-toegang — optioneel gezien eerdere branch-verificatie en lokale parity.
