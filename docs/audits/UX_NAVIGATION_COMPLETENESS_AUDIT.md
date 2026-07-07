# UX Navigation Completeness Audit (UX Finalization Phase 2)

**Date:** 2026-07-07
**Method:** Static code trace of `components/NavBar.tsx`, `components/navigation/BottomNavigation.tsx`, `components/profile/v2/ProfileV2OwnerSidepanel.tsx`, `lib/navigation/role-quick-links.ts`, `lib/profile/deals-navigation.ts`, `public/i18n/*.json` + `scripts/validate-navigation-completeness.ts`.
**Related:** [HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md](./HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md) · [UX_FINALIZATION_PHASE2_NAVIGATION_COMPLETENESS.md](../progress/UX_FINALIZATION_PHASE2_NAVIGATION_COMPLETENESS.md) · [ROUTE_OWNERSHIP.md](../architecture/ROUTE_OWNERSHIP.md)

---

## 1. Executive summary

De Global UX-audit signaleerde dat buyer-only gebruikers hun eigen transactionele pagina's niet via zichtbare navigatie konden bereiken. Deze fase sluit die gaten door de bestaande routes te ontsluiten in twee niet-role-gated NavBar-oppervlakken (desktop profiel-dropdown + mobiel hamburger-menu), aangevuld met de reeds aanwezige profielsidepanel- en role-quick-link-ingangen. Er zijn geen nieuwe features of routes gebouwd; `/agreements`, `/dorpsplein` en `/inspiratie` blijven redirects.

---

## 2. Bereikbaarheid per route (na fase 2)

| Route | Label (NL / EN) | Desktop | Mobiel | Buyer-only |
|-------|-----------------|---------|--------|------------|
| `/profile/deals` | Mijn Afspraken / My Agreements | dropdown, sidepanel, role quick links | hamburger-menu, sidepanel | ✅ |
| `/orders` | Bestellingen / Orders | dropdown | hamburger-menu | ✅ |
| `/favorites` | Favorieten / Favorites | dropdown | hamburger-menu | ✅ |
| `/notifications` | Meldingen / Notifications | `NotificationBell` | hamburger-menu | ✅ |
| `/messages` | Berichten / Messages | header, dropdown, bottom nav | hamburger-menu, bottom nav | ✅ |
| `/profile` | Profiel / Profile | header, dropdown, bottom nav | header, hamburger, bottom nav | ✅ |
| `/settings` | Instellingen / Settings | dropdown | hamburger-menu | ✅ |
| `/` (Ontdekken) | Ontdekken / Discover | header, bottom nav | header, bottom nav | ✅ |

---

## 3. Bevindingen & besluiten

| # | Onderdeel | Status | Toelichting |
|---|-----------|--------|-------------|
| N1 | Buyer-only kon `/orders`, `/favorites`, `/profile/deals` niet bereiken | ✅ Opgelost | Toegevoegd aan NavBar-dropdown + hamburger-menu (niet role-gated) |
| N2 | `/notifications` alleen desktop (`NotificationBell`) | ✅ Opgelost | Mobiele ingang in hamburger-menu |
| N3 | Bottom nav vol (6 items) | ✅ Bewust niet uitgebreid | Geen ruimte/logica; taak stond "indien ruimte/logisch" toe |
| N4 | Geen hardcoded routes | ✅ | `DEALS_PROFILE_PATH` geïmporteerd i.p.v. string |
| N5 | Stale validator (`/agreements` canonical) | ✅ Opgelost | Assert nu `/profile/deals`; alias geaccepteerd |
| N6 | ROUTE_OWNERSHIP stale (feed/hub canonicals) | ✅ Opgelost | V2: aliassen/redirects gecorrigeerd |
| N7 | Label-varianten Profiel/Dashboard | ⚠️ P3 bewust | Contextafhankelijk (auth/rol); geen defect, niet hernoemd |

---

## 4. Design/consistency

- Alle nieuwe rijen gebruiken bestaande NavBar-klassen (`mobileNavRowClass`, dropdown-rijstijl) → geen nieuwe primitives, consistente spacing en 44px touch-targets.
- Iconen: `CalendarClock` (Afspraken), `Package` (Bestellingen), `Heart` (Favorieten), `Bell` (Meldingen) — uit de reeds gebruikte `lucide-react`-set.
- Labels volledig via i18n (`navbar.*`), nl/en parity.

---

## 5. Restrisico's / vervolg (buiten scope)

- Legacy redirect-kandidaten (`/seller/[sellerId]`, `/bezorger/[username]`, `/reservations`) nog niet omgezet — documentatie-only.
- Rechter/linker sidebar-widgets (Vandaag, Volgende afspraak, Actie vereist) uit de Fase 1-audit blijven een aparte track.
- Proposal-prefill voor niet-PRODUCT listings (bekende warn in loop-validator) is een aparte functionele fix, geen navigatie.

---

## 6. Validatie

```bash
npx tsx scripts/validate-navigation-completeness.ts
```

41 checks — alle groen (canonical constants, target-pages bestaan, NavBar-wiring desktop+mobiel, buyer-only coverage, stale-validator fix, route-doc, i18n parity).
