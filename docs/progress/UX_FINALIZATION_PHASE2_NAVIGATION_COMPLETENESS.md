# UX Finalization Phase 2 — Navigation Completeness & Buyer Access

**Date:** 2026-07-07
**Status:** Complete
**Scope:** Navigatie en route-hygiëne. Geen nieuwe marketplace-, proposal-, notificatie- of betaalfunctionaliteit; geen sidebar-redesign; geen ranking/search-wijzigingen.

Bouwt voort op de Global UX, Navigation & Information-Architecture Audit (Fase 1). Belangrijkste P1: buyer-only gebruikers konden eigen pagina's (`/profile/deals`, `/favorites`, `/orders`, `/notifications` op mobiel) niet logisch bereiken.

---

## Afgerond

| Taak | Resultaat |
|------|-----------|
| **2.1** Promote Mijn Afspraken | `/profile/deals` via `DEALS_PROFILE_PATH` in NavBar-dropdown (desktop) + hamburger-menu (mobiel); stond al in profielsidepanel (`PROFILE_DEALS_NAV`) en role quick links |
| **2.2** Favorieten bereikbaar | `/favorites` in NavBar-dropdown + hamburger-menu (label Favorieten / Favorites) |
| **2.3** Bestellingen bereikbaar | `/orders` in NavBar-dropdown + hamburger-menu (label Bestellingen / Orders) — losstaand van `/verkoper/orders` |
| **2.4** Meldingen op mobiel | `/notifications` in hamburger-menu (desktop had al `NotificationBell`) |
| **2.5** Buyer-only check | NavBar-dropdown en hamburger-menu renderen in het `{user && (...)}`-blok — niet role-gated; buyer-only bereikt alle eigen pagina's |
| **2.6** Label-consistentie | Afspraak-labels gestandaardiseerd (Mijn Afspraken / My Agreements); Profiel/Dashboard-varianten bewust contextueel gelaten (P3) |
| **2.7** Stale validator | `scripts/validate-community-economy-loop.ts` assert nu canonical `/profile/deals`; `/agreements` geaccepteerd als redirect-alias |
| **2.8** Route ownership docs | `docs/architecture/ROUTE_OWNERSHIP.md` V2: `/profile/deals` canonical, `/agreements` alias, `/dorpsplein` + `/inspiratie` redirects, public profile canonical intent |
| **2.9** Mobile review | Alle nieuwe items in hamburger-menu (min-h 44px rijen); geen accountpagina alleen-desktop |
| **2.10** i18n | `navbar.agreements/orders/favorites/notifications` nl+en parity |

---

## Rapportage

### 1. Welke routes bereikbaar zijn gemaakt
- `/profile/deals` (Mijn Afspraken) — nu ook in NavBar-dropdown en hamburger-menu.
- `/orders` (Bestellingen) — NavBar-dropdown + hamburger-menu (buyer-reachable).
- `/favorites` (Favorieten) — NavBar-dropdown + hamburger-menu.
- `/notifications` (Meldingen) — hamburger-menu (mobiel); desktop via bestaande `NotificationBell`.

### 2. Welke nav-surface is aangepast
- `components/NavBar.tsx`: desktop profiel-dropdown (Mijn Afspraken, Bestellingen, Favorieten) en mobiel hamburger-menu (Mijn Afspraken, Bestellingen, Favorieten, Meldingen).
- Ongewijzigd maar reeds correct: profielsidepanel (`PROFILE_DEALS_NAV`), role quick links (`agreements → /profile/deals`), bottom nav (bewust niet uitgebreid — 6 items, geen ruimte/logica).

### 3. Hoe buyer-only navigatie is gecontroleerd
De toegevoegde links leven in het `{user && (...)}`-blok van NavBar en zijn niet afhankelijk van `sellerRoles`, `showDashboardTab` of andere rolchecks. Een ingelogde buyer-only gebruiker bereikt: Ontdekken (header/bottom nav), Inbox (`/messages`), Mijn Afspraken, Bestellingen, Favorieten, Meldingen, Profiel, Instellingen. Gevalideerd via `scripts/validate-navigation-completeness.ts`.

### 4. Welke labels zijn gestandaardiseerd
- Mijn Afspraken / My Agreements (`navbar.agreements`) — consistent met `roleQuickLinks.agreements` en `community.agreements.navLabel` ("Mijn afspraken" / "My agreements").
- Bestellingen / Orders (`navbar.orders`) — losgetrokken van verkooporders (`navbar.sellerOrders` = Verkooporders / Sales Orders).
- Favorieten / Favorites, Meldingen / Notifications toegevoegd.

### 5. Welke P1-navigatiegaten nog overblijven
- Geen openstaande P1-navigatiegaten voor eigen buyer-pagina's.
- P3 (bewust niet aangepakt): contextuele label-varianten "Mijn HC" vs "Profiel" (`bottomNav.myHC`/`bottomNav.profile`) en "Verdienen" vs "Dashboard" (`bottomNav.earn`/`bottomNav.dashboard`) — deze wisselen op auth/rol-context en zijn geen defect.
- Legacy redirect-kandidaten (`/seller/[sellerId]`, `/bezorger/[username]`, `/reservations`) blijven buiten scope van deze fase.

---

## Validatie

```bash
npx tsx scripts/validate-navigation-completeness.ts   # 41 passed, 0 failed
npx tsx scripts/validate-community-economy-loop.ts     # 69 passed, 0 failed, 2 warnings
```

---

## Related documents
- [UX_NAVIGATION_COMPLETENESS_AUDIT.md](../audits/UX_NAVIGATION_COMPLETENESS_AUDIT.md)
- [HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md](../audits/HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md)
- [ROUTE_OWNERSHIP.md](../architecture/ROUTE_OWNERSHIP.md)
