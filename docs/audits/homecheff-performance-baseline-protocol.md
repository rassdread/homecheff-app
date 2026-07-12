# HomeCheff Performance Baseline Protocol

**Datum:** 2026-07-12  
**Doel:** Reproduceerbare baseline vóór optimalisaties of Render-beslissing.

---

## 1. Voorbereiding

### Environment flags

| Omgeving | Server | Client |
|----------|--------|--------|
| Lokaal dev | `FEED_PERF_TIMING=1` | `NEXT_PUBLIC_FEED_PERF_BASELINE=1` |
| Preview | Zelfde in Vercel preview env | Zelfde |
| Productie | **Alleen tijdelijk** (max 1 uur) | **Niet** op productie tenzij expliciet goedgekeurd |

### Commando's

```bash
# Server lokaal met timing
FEED_PERF_TIMING=1 npm run dev

# Productie-build lokaal
FEED_PERF_TIMING=1 NEXT_PUBLIC_FEED_PERF_BASELINE=1 npm run build && npm start

# HTTP cold/warm probe (geen login vereist)
npm run perf:startup:cold -- --base-url=http://127.0.0.1:3000
npm run perf:startup:warm -- --base-url=http://127.0.0.1:3000

# Bundle analyse
npm run analyze
```

---

## 2. Scenario's & runs

Voer **per scenario** uit:

- **3 cold runs**
- **3 warm runs**

| # | Scenario | Auth | Script / tool |
|---|----------|------|---------------|
| 1 | Homepage anoniem cold | Uit | [Startup meettool](../../scripts/performance/measure-homecheff-startup.mjs) `--mode=cold` + browser |
| 2 | Homepage anoniem warm | Uit | `--mode=warm` + browser |
| 3 | Homepage ingelogd cold | In | Browser + `__hcFeedPerfReport()` |
| 4 | Homepage ingelogd warm | In | Herhaal binnen 60s |
| 5 | Feed API cold | Uit | Script `/api/feed` |
| 6 | Feed API warm | Uit | Script warm mode |

---

## 3. Browser capture (homepage)

1. Open DevTools → Performance + Network
2. Hard refresh (cold) of normale navigatie (warm)
3. In console (baseline flag aan):

```javascript
window.__hcFeedPerfReport()
```

4. Noteer Network:
   - `/` TTFB
   - `/api/feed` TTFB + `Server-Timing` header
   - Dubbele calls naar `/api/profile/me`, `/api/inspiratie`

5. Lighthouse (optioneel):

```bash
npx lighthouse http://127.0.0.1:3000/ --only-categories=performance --view
```

---

## 4. Server-Timing interpretatie

Voorbeeld header:

```
auth;dur=12, geo;dur=3, feed-db;dur=180, stats;dur=95, trust;dur=210, prisma;dur=420, prisma-count;dur=0;desc="38 queries", total;dur=650
```

| Bucket | Actie bij >200ms |
|--------|------------------|
| `feed-db` | Index/query review (Fase 3) |
| `trust` | Trust precompute (Fase 3) |
| `stats` | Stats preview flag (Fase 3) |
| `prisma` | Zie `debug.perf.prisma` breakdown |

---

## 5. Android / Capacitor handmatig protocol

**Geen release vereist** — gebruik bestaande app → `https://homecheff.eu` of preview URL.

### Config referentie

- Splash: `3250ms` (`capacitor.config.ts`)
- Remote URL: `CAPACITOR_SERVER_URL` of `https://homecheff.eu`

### Per run vastleggen

| Stap | Wat observeren |
|------|----------------|
| T0 | App force-stop (Instellingen → Apps → HomeCheff → Stop) |
| T1 | Cold launch — tap icoon |
| T2 | Splash zichtbaar |
| T3 | WebView wit / eerste paint |
| T4 | Homepage shell (hero zichtbaar) |
| T5 | Feed tiles zichtbaar |
| T6 | Feed interactief (scroll/tap) |

### Warm launch

- App naar achtergrond (niet force-stop)
- Heropen binnen 30s
- Noteer T1→T6 delta

### Netwerkvarianten

- WiFi
- Mobiel 4G/5G

### Auth varianten

- Anoniem (uitgelogd)
- Ingelogd (bestaand account)

### Logcat / remote debug

Met `NEXT_PUBLIC_FEED_PERF_BASELINE=1` op server URL (preview):

```
adb logcat | grep HC-PERF
```

Of Chrome `chrome://inspect` → WebView → Console filter `[HC-PERF]`

### Meetpunten template

| Run | Type | Netwerk | Auth | T2 splash ms | T4 shell ms | T5 feed ms | T6 usable ms |
|-----|------|---------|------|--------------|-------------|------------|--------------|
| 1 | cold | wifi | anon | | | | |
| 2 | cold | wifi | anon | | | | |
| 3 | cold | wifi | anon | | | | |

---

## 6. Bundle analyse protocol

Na `npm run analyze`:

| Module | Zoek in rapport | Notitie |
|--------|-----------------|--------|
| GeoFeed | `GeoFeed` chunk | Grootte KB |
| NavBar | `NavBar` | |
| Providers | provider tree imports | |
| pusher-js | `pusher` | |
| socket.io | `socket.io` | Verwacht: tree-shaken/unused |
| @stripe/stripe-js | `stripe` | |
| firebase | `firebase` | Server-only verwacht |
| @react-pdf | `react-pdf` | |
| emoji-picker | `emoji` | |
| lucide-react | `lucide` | |

---

## 7. Cold vs warm definities

| Term | Definitie in dit protocol |
|------|---------------------------|
| **HTTP cold** | Script: geen keep-alive, cache-bypass headers, nieuwe TCP per run |
| **HTTP warm** | Script: warmup + keep-alive |
| **Vercel cold** | Eerste invocation na idle — **niet** volledig door script gesimuleerd |
| **Browser cold** | Hard refresh / cleared cache |
| **Browser warm** | Herhaalbezoek binnen 60s, return cache actief |

---

## 8. Data-opslag

Vul resultaten in: [Results template](./homecheff-performance-phase2-results-template.md)

Geen PII in logs:

- Geen e-mails, coords, tokens
- URLs zonder query params in duplicate detector

---

## 9. Beslisboom na baseline

Zie [Measurement plan](./homecheff-performance-measurement-plan.md) sectie 8.

Kort:

1. Als warm feed API p95 > 800ms → query optimalisatie (Fase 3)
2. Als cold−warm > 40% TTFB → onderzoek serverless warming
3. Als client hydration > API wait → GeoFeed defer (Fase 3)
4. Als alles warm < 400ms → Render niet nodig

---

## 10. Rollback instrumentatie

Flags uitzetten → gedrag identiek aan pre-Phase-2. Geen code removal vereist.
