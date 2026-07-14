# Phase UI — Cross-Platform Responsive Audit

**Datum:** 2026-07-14  
**Branch:** `performance/phase3f-first-paint` (Wave 2, niet op main)  
**Modus:** analyse + responsive nav fix (lokaal, geen commit/push/merge/deploy)

---

## Executive summary

| Gebied | Status |
|--------|--------|
| **Nav auth (Inloggen/Aanmelden)** | 🟢 **GROEN** na fix |
| **NavBarShell blocking** | 🟢 **GROEN** (`pointer-events-none`) |
| **Viewporttests 320–2560px** | 🟢 **18/18 pass** |
| **Homepage overflow (pagina)** | 🟢 geen horizontale scroll |
| **Wave 2 dynamic imports** | 🟠 apart issue (interaction bug) — buiten deze UI-fix |
| **Tablet md–lg homepage** | 🟠 waarschuwingen (P2) |
| **Viewport hook first paint** | 🟠 P1 (bestaand, niet nav-fix) |

---

## 1. Exacte oorzaak — auth-knoppen verdwenen

### Root cause (pre-fix)

1. **Inloggen/Aanmelden zaten ín de desktop-nav** (`hidden md:flex`) als laatste items in een horizontale flex-rij.
2. **Hamburger alleen onder 768px** — in het bereik **768–1280px** (≈1/3 van 34") geen overflow-menu maar wél te veel nav-items.
3. **Logo-tekst overflow** — `HomeCheff` + ondertitel liep visueel over de login-knop (`overflow-x-clip` op body knipte af).
4. **Geen `shrink-0` op auth-CTAs** — knoppen werden uit viewport gedrukt.

### Fix toegepast (lokaal)

| Wijziging | Bestand |
|-----------|---------|
| Auth-CTAs uit nav → vast `ml-auto shrink-0` cluster | `NavBar.tsx` |
| Desktop-nav `md:flex` → `lg:flex` | `NavBar.tsx` |
| Hamburger `md:hidden` → `lg:hidden` | `NavBar.tsx` |
| Logo compact (icoon only) onder lg | `NavBar.tsx` |
| Compactere auth-padding per breakpoint | `NavBar.tsx` |
| Auth zichtbaar tijdens session `loading` | `NavBar.tsx` |
| Header `overflow-x-clip` | `NavBar.tsx` |
| Shell `pointer-events-none` | `NavBarShell.tsx` |
| Shell placeholders aligned met auth+hamburger | `NavBarShell.tsx` |

---

## 2. Nieuwe responsive navigatiestrategie

```
┌─────────────────────────────────────────────────────────────┐
│  LOGO          [ Desktop nav — alleen lg+ ]    AUTH | ☰   │
└─────────────────────────────────────────────────────────────┘
```

| Zone | Breakpoint | Gedrag |
|------|------------|--------|
| Logo | `< lg` | Icoon only, max-width capped |
| Logo | `≥ lg` | Icoon + tekst |
| Desktop nav | `≥ lg` | Home, Werken bij, Profiel, Berichten, HCP, Delen, Taal |
| Auth CTAs | **alle breedtes** (guest) | Inloggen + Aanmelden, `shrink-0`, nooit in nav-flex |
| Hamburger | `< lg` | Overige links + mobile menu |
| Bottom nav | `< lg` | Aanvullende navigatie (mobiel/tablet) |

---

## 3. Responsive matrix — navigatie (guest, anoniem)

| Breedte | Tailwind | Desktop nav | Auth header | Hamburger | Overflow |
|---------|----------|-------------|-------------|-----------|----------|
| 2560 | 2xl+ | ✅ flex | ✅ zichtbaar | — | ✅ |
| 1920 | xl | ✅ flex | ✅ | — | ✅ |
| 1600 | xl | ✅ flex | ✅ | — | ✅ |
| 1440 | xl | ✅ flex | ✅ | — | ✅ |
| 1366 | xl | ✅ flex | ✅ | — | ✅ |
| 1280 | xl | ✅ flex | ✅ | — | ✅ |
| 1180 | xl | ✅ flex | ✅ | — | ✅ |
| 1024 | lg | ✅ flex | ✅ | — | ✅ |
| 900 | md | — | ✅ | ✅ | ✅ |
| 820 | md | — | ✅ | ✅ | ✅ |
| 768 | md | — | ✅ | ✅ | ✅ |
| 640 | sm | — | ✅ | ✅ | ✅ |
| 540 | — | — | ✅ | ✅ | ✅ |
| 480 | — | — | ✅ | ✅ | ✅ |
| 430 | — | — | ✅ | ✅ | ✅ |
| 390 | — | — | ✅ | ✅ | ✅ |
| 360 | — | — | ✅ | ✅ | ✅ |
| **320** | — | — | ✅ | ✅ | ✅ |

**Landscape (390–844px hoogte 390):** alle ✅ login + register zichtbaar.

**Runtime resize (1280→900→640→1024):** header-hoogte stabiel (geen CLS > 8px).

---

## 4. Viewporttestresultaten

### NavBar probe (`scripts/probe-responsive-navbar-phase-ui.mjs`)

- **allPass: true**
- **failureCount: 0**
- **18 portrait breedtes** 320–2560
- **5 landscape** configuraties
- **0 hydration/console errors** in snapshot
- **NavBarShell:** `pointer-events-none` wanneer zichtbaar tijdens load

### Homepage probe (`scripts/probe-homepage-responsive-phase-ui.mjs`)

- **Geen pagina-overflow** op 320–2560 (`scrollWidth === viewport`)
- **Geen stuck feed skeleton**
- **26 feed tile signals** op meeste breedtes
- **Interne elementen** (filter chips, hero CTA) kunnen voorbij viewport rand — geclipped door `overflow-x-clip`, geen scrollbar

---

## 5. Per-component audit

### Navigatie

| Component | Status | Notities |
|-----------|--------|----------|
| NavBar | 🟢 | Auth fix toegepast |
| NavBarShell | 🟢 | `pointer-events-none`, CLS placeholders |
| Desktop menu | 🟢 | `lg+` only |
| Tablet menu | 🟢 | Hamburger + header auth |
| Mobile menu | 🟢 | Auth ook in menu (backup) |
| Hamburger | 🟢 | `< lg` |
| Login/Aanmelden | 🟢 | Altijd in header (guest) |
| Gebruikersmenu | 🟢 | `lg+` desktop; `< lg` hamburger |
| Bottom nav | 🟠 P2 | Dicht op 320px (6 slots) |
| Dynamic NavBar (Wave 2) | 🟠 | Shell non-blocking na fix; interaction bug apart |

### Homepage

| Component | Status | Notities |
|-----------|--------|----------|
| Hero mobile | 🟠 P3 | CTA's kunnen druk op <360px |
| Hero desktop visual | 🟠 P3 | Orbit overflow bij lg |
| Guest panels | 🟢 | Modal overlay, OK |
| Sidebars | 🟠 P2 | Vaste 280/320px; krap bij 1024 |
| Mobile strips | 🟠 P2 | `md:hidden` — tablet mist strip |
| Feed tiles | 🟢 | `min-w-0`, truncate |
| Skeletons | 🟢 | Geen stuck in probe |
| GeoFeed dynamic | 🟢 | Lazy load OK in probe |

### Wave 2 dynamic imports

| Import | Hydration | Skeleton | pointer-events |
|--------|-----------|----------|----------------|
| NavBar | 🟠 apart issue | 🟢 non-blocking | 🟢 shell fixed |
| GeoFeed | 🟢 | 🟢 clears | 🟢 |
| Hero visual | 🟢 | 🟢 | 🟢 |
| HcpRewardProvider | 🟠 P0 apart | — | — |

---

## 6. Prioriteitenlijst

### P0 — Merge-blocking

| # | Issue | Status |
|---|-------|--------|
| 1 | Wave 2 preview interaction bug (HcpRewardProvider wrapper) | 🔴 **open** — apart van UI-fix |
| 2 | Auth knoppen verdwijnen md–lg | 🟢 **fixed lokaal** |

### P1 — Hoog

| # | Issue | Bestand |
|---|-------|---------|
| 1 | Viewport hook first-paint desktop shell op mobile | `useNarrowViewport.ts`, `HomePageClient.tsx` |

### P2 — Middel

| # | Issue | Bestand |
|---|-------|---------|
| 1 | Tablet md–lg ecosystem strip gap | `HomeMobileEcosystemStrip.tsx` |
| 2 | Fixed sidebar widths bij 1024px | `HomePageClient.tsx` |
| 3 | GeoFeed filter md/lg mismatch | `GeoFeed.tsx` |
| 4 | Bottom nav dichtheid 320px | `BottomNavigation.tsx` |
| 5 | Sidebars zonder `min-w-0` | `HomePageClient.tsx` |

### P3 — Laag

| # | Issue | Bestand |
|---|-------|---------|
| 1 | Hero CTA druk <360px | `HomeHeroSection.tsx` |
| 2 | Orbit visual clip bij lg | `HomeHeroVisualCluster.tsx` |
| 3 | Global overflow-x clip side effects | `globals.css` |
| 4 | 2-col discover dense op 320px | `GeoFeed.tsx` |
| 5 | Guest bottom-nav hover tooltips | `BottomNavigation.tsx` |

---

## 7. Bevestigingen

| Criterium | Status |
|-----------|--------|
| Inloggen altijd zichtbaar/bereikbaar | ✅ 320–2560px |
| Aanmelden altijd zichtbaar/bereikbaar | ✅ 320–2560px |
| Geen horizontale scrollbar (pagina) | ✅ |
| Geen layout regressie nav (resize) | ✅ |
| Geen hydration regressie (probe) | ✅ |
| Geen performance regressie | ✅ (alleen CSS/structuur nav) |
| NavBarShell blokkeert geen clicks | ✅ `pointer-events-none` |
| Geen commit/push/merge/deploy | ✅ |

---

## 8. Gewijzigde bestanden (deze sessie)

- `components/NavBar.tsx`
- `components/navigation/NavBarShell.tsx`
- `scripts/probe-responsive-navbar-phase-ui.mjs` (nieuw, validator)
- `scripts/probe-homepage-responsive-phase-ui.mjs` (nieuw, validator)
- `docs/audits/homecheff-phase-ui-responsive-audit.md` (dit document)

`app/layout.tsx` — **niet gewijzigd** (dynamic NavBar intact).

---

## 9. Handmatige checks nog aanbevolen

- Chrome / Safari / Firefox / Edge visueel op 900px en 768px
- Ingelogde gebruiker: profiel dropdown + cart op `lg+`
- Login/logout/Google login flows op preview (na Wave 2 interaction fix)
- Capacitor safe-area op iOS/Android (notch, bottom nav)
