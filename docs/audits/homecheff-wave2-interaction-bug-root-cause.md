# Wave 2 Critical Interaction Bug — Root Cause Investigation

**Datum:** 2026-07-14  
**Branch:** `performance/phase3f-first-paint`  
**Status:** fix gecommit + gepusht (interaction + responsive nav)

---

## Executive summary

| Item | Conclusie |
|------|-----------|
| **Root cause** | `HcpRewardProvider` als `dynamic({ ssr: false })` **wrapt alle layout-children** in `Providers.tsx` |
| **Hypothese bevestigd?** | ✅ **JA** — met A/B meetdata |
| **Minimale fix** | Static import `HcpRewardProvider` (Wave 1 gedrag) |
| **Secundair** | `NavBarShell` zonder `pointer-events-none` (Wave 2) — header-only, niet full-page |

---

## 1. Exacte root cause

`Providers.tsx` rendert layout-children (NavBar, main, footer, bottom nav, gates) **binnen**:

```tsx
<HcpRewardProvider>
  <CreateFlowProvider>{children}</CreateFlowProvider>
</HcpRewardProvider>
```

Wave 2 wijziging (`63f1845`):

```tsx
const HcpRewardProvider = dynamic(
  () => import('@/components/gamification/HcpRewardProvider').then(...),
  { ssr: false },
);
```

**Gedrag `next/dynamic` + `ssr: false`:** tot de chunk geladen en gemount is, rendert de provider **niets** → `{children}` mount **niet** → geen NavBar, geen main, geen interactieve UI.

---

## 2. Bewijs (A/B meting lokaal)

Probe: `scripts/probe-wave2-interaction-root-cause.mjs` op `next start :3010`

| Metriek | Wave 2 (dynamic Hcp) | Na fix (static Hcp) |
|---------|----------------------|---------------------|
| SSR HTML bytes | 25,888 | 53,547 |
| SSR `<button>` count | **0** | **7** |
| SSR `href="/login"` | **0** | **4** |
| Login bij `domcontentloaded` | ❌ niet in DOM | ✅ clickable @ 189ms |
| `#main-content` bij `domcontentloaded` | ❌ absent | ✅ 4 children |
| Dode periode vóór UI | ~0–500ms (leeg) | ~0ms (direct SSR+hydrate) |

**DOM-timeline Wave 2 (broken):**

- `t=102ms`: `headerLinkCount: 0`, `buttonCount: 0`, `mainPresent: false`
- `t=513ms`: eerste login in DOM, `mainPresent: true`

**DOM-timeline na fix:**

- `t=189ms`: `headerLinkCount: 7`, `buttonCount: 7`, `mainPresent: true`, `login.clickable: true`

---

## 3. Waarom alleen in Wave 2

| Wave | `HcpRewardProvider` | `NavBar` in layout |
|------|---------------------|-------------------|
| Wave 1 (`d19b107`) | Static import | Static import |
| Wave 2 (`63f1845`) | `dynamic(ssr:false)` | `dynamic` + `NavBarShell` |

Wave 2 introduceerde **twee** client-only lagen:

1. **P0:** Provider wrapt `{children}` → **hele pagina wacht** op gamification-chunk
2. **P1:** NavBar dynamic → extra laadfase; `NavBarShell` (zonder `pointer-events-none` in `63f1845`) kon header-kliks blokkeren

Lokaal (snel netwerk) is fase 1 ~500ms — op Preview (koud, SSO, CDN) wordt dit seconden → voelt als “alle knoppen dood”.

---

## 4. Hypothesen — bewijs / verwerping

### ✅ BEVESTIGD — `HcpRewardProvider` dynamic wrapper

- Wrapt `{children}` in `Providers.tsx`
- A/B toont 0→7 SSR buttons, 0→4 login links, directe mount na static revert

### 🟠 SECUNDAIR (niet root full-page) — `NavBarShell` pointer-events

- Wave 2 `63f1845`: geen `pointer-events-none` op shell
- Blokkeert alleen sticky header (~64px), niet feed/bottom-nav
- **Responsive fix** (lokaal): `pointer-events-none` toegevoegd
- **Verwerping als root cause** voor “alle UI dood”

### ❌ VERWORPEN — `GeoFeed` dynamic

- Leaf in `HomePageClient`, wrapt geen layout-children
- Blokkeert navigatie niet

### ❌ VERWORPEN — React `Suspense` in `Providers.tsx`

- Alle boundaries `fallback={null}` op parallelle siblings
- Blokkeren geen `{children}` tree

### ❌ VERWORPEN — CSS overlays (gates)

- `SoftAuthGateHost`: `fixed inset-0 z-[240]` alleen bij `open === true`
- `RouteTransitionHost`, `AppUpdateGate`, `PlayStoreMigrationGate`: `pointer-events-none`
- Geen permanent full-page blocker op anonymous homepage

### ❌ VERWORPEN — Hydration mismatch

- 0 hydration warnings in probes (voor en na fix)

### ❌ VERWORPEN — `NavBar` event handlers

- Na static Hcp: login `clickable: true`, handlers via Next.js `Link` — geen handler-bug

---

## 5. Minimale fix toegepast (lokaal)

**Bestand:** `components/Providers.tsx`

- Verwijderd: `dynamic()` import van `HcpRewardProvider`
- Hersteld: `import { HcpRewardProvider } from '@/components/gamification/HcpRewardProvider'`

**Niet gewijzigd (bewust):**

- `app/layout.tsx` — NavBar blijft `dynamic` + `NavBarShell` (performance Wave 2)
- `NavBarShell.tsx` — `pointer-events-none` (responsive fix, al lokaal)
- GeoFeed/Hero/sidebar deferrals — intact

**Waarom minimaal:** exact 1 regressie-punt terugdraaien; gamification-toasts laden weer synchroon maar blokkeren geen UI-tree.

---

## 6. Risicoanalyse

| Risico | Ernst | Mitigatie |
|--------|-------|-----------|
| HcpReward chunk terug in critical path | Laag | Provider is licht; toast-dock is CSS-only |
| Wave 2 FCP regressie | Laag–middel | NavBar/GeoFeed deferrals blijven; meet na merge |
| Preview SSO blokkeert auto-probe | Info | Handmatige check nog nodig |
| Puppeteer klik op Next `Link` | Info | `/login` direct route ✅; handmatige klik op preview |

---

## 7. Regressiecheck (na fix)

| Check | Resultaat |
|-------|-----------|
| SSR login/register in HTML | ✅ |
| Login in DOM @ domcontentloaded | ✅ clickable |
| `/login` pagina (email + Google) | ✅ |
| `/register` route | ✅ |
| Responsive nav probe | ✅ `allPass: true`, `failureCount: 0` |
| Hydration warnings | ✅ 0 |
| Console errors (probes) | ✅ 0 |
| `feedFetches` / `geoFeedMounts` | ✅ `1` / `1` (perf baseline reporter) |
| NavBarShell blokkeert clicks | ✅ `pointer-events-none` |
| Commit / push / merge / deploy | ✅ niet uitgevoerd |

---

## 8. Gewijzigde bestanden (deze investigatie)

| Bestand | Wijziging |
|---------|-----------|
| `components/Providers.tsx` | HcpRewardProvider static import |
| `scripts/probe-wave2-interaction-root-cause.mjs` | Nieuw — timing/SSR probe |
| `docs/audits/homecheff-wave2-interaction-bug-root-cause.md` | Dit rapport |

Eerder (responsive UI, nog lokaal): `NavBar.tsx`, `NavBarShell.tsx`

---

## 9. Handmatig nog op Preview

- Chrome/Safari/Firefox/Edge: klik login/register/nav na cold load
- Ingelogd / logout flow
- Resize desktop/tablet/mobiel
