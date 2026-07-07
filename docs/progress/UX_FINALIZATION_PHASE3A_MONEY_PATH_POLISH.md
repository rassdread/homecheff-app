# UX Finalization Phase 3A — Money Path + Critical Copy Polish

**Date:** 2026-07-07
**Status:** Complete
**Scope:** Alleen P0/P1 quick wins uit de Fase 3-audit rond de betaal-, checkout-, cart- en statuservaring. **Geen** nieuwe features, betaalmethodes, Tikkie/escrow, nieuwe checkout-/proposalflow, sidebar-redesign, notifications, ranking/search-wijzigingen of design-system-codemod.

Bouwt voort op Fase 1 (nav/IA-audit), Fase 2 (navigatie-completeness) en Fase 3 (complete user-journey-audit). Deliverable: dit progress-document + [UX_FIN_3A_CRITICAL_POLISH_AUDIT.md](../audits/UX_FIN_3A_CRITICAL_POLISH_AUDIT.md).

---

## Afgerond

| Taak | Resultaat |
|------|-----------|
| **3A.1** i18n-interpolatie | Eén veilige helper `lib/i18n/interpolate.ts` ondersteunt zowel `{count}` als `{{count}}`; `useTranslation.t()` gebruikt die. Trust-cues renderen niet langer als `{5} afgeronde afspraken`. |
| **3A.2** Cart verkopernaam | `CartDrawer` toont de echte `item.sellerName`; fallback via `cart.providerFallback` (NL "aanbieder" / EN "provider"). Geen hardcoded "van Verkoper" meer; `useCart` slaat geen Nederlandse `'Verkoper'` fallback meer op. |
| **3A.3** Payment success producttitel | Order-polling levert nu producttitels; success-pagina toont de titel (map `productId → title`) i.p.v. `Product ID: <cuid>`, met vertaalde fallback `paymentSuccess.productFallback`. |
| **3A.4** Money-path i18n | `checkout`, `paymentSuccess` en de cart-drawer draaien volledig via i18n (nieuwe namespaces `checkout.*`, `paymentSuccess.*`, aangevulde `cart.*`), volledige nl/en parity, geen `t('key') || 'NL fallback'`-patroon in het geldpad. |
| **3A.5** Aboutview copy-bug | `admin.overview` = "Overview" (was "Aboutview"); `admin.orderManagementDescription` = "Overview and management of all orders". Ook `productPage.backToOverview` en de `Discabout`-varianten in EN hersteld. |
| **3A.6** Seller status-enum | Dashboard + verkooporders beslissen op de ruwe enum (`statusRaw`) via `orderIsInEnumState()`, renderen via vertaalde labels (`getStatusText`), tonen geen ruwe enum en gebruiken geen Nederlandse labels voor business-beslissingen. |
| **3A.7** Console-logs | Debug-`console.log`'s verwijderd in het buyer-orders-pad, delivery-dashboard-onboarding en de seller/orders-API. `console.error` voor echte fouten blijft. |
| **3A.8** Validatie | `scripts/validate-ux-fin-3a-critical-polish.ts` — 79 checks groen. |

---

## Rapportage

### 1. Welke P0/P1 auditbevindingen zijn opgelost
- **J1 (P0)** i18n-interpolatie: `{{x}}` werd letterlijk getoond. Opgelost met één helper die beide vormen aankan, met veilige omgang met ontbrekende waarden en `0`/lege string.
- **J2 (P1)** Cart toonde "van Verkoper": vervangen door echte verkopernaam + vertaalde fallback.
- **J3 (P1)** Payment success toonde `Product ID: <cuid>`: vervangen door producttitel uit de order-polling.
- **J4 (P1)** Hardcoded Nederlands in checkout/success/cart: volledig geïnternationaliseerd met nl/en parity.
- **J5 (P1)** "Aboutview": hersteld naar "Overview" (+ verwante botched find/replace: `orderManagementDescription`, `backToOverview`, `Discabout`).
- **J6 (P1)** Seller-statuslogica op Nederlandse labels: nu enum-first via `statusRaw`.

### 2. Welke geldpad-schermen zijn opgeschoond
- `components/cart/CartDrawer.tsx` — header, lege staat, verkopernaam, "alles verwijderen", totaal, afreken-CTA.
- `app/checkout/page.tsx` — order-overzicht, bezorgopties, prijsregels, knoppen, adres/tijd-labels, alerts.
- `app/payment/success/page.tsx` — alle states (loading/missing/error/success), betalingsgegevens, orderregels, "wat gebeurt er nu", CTA's, locale-afhankelijke bedrag-formattering.

### 3. Hoe i18n-interpolatie nu werkt
`lib/i18n/interpolate.ts` → `interpolateTranslation(value, params)`:
- Vervangt **eerst** `{{key}}` en **daarna** `{key}` (voorkomt dat `{{x}}` half wordt verminkt).
- Ontbrekende param (`undefined`/`null`) → placeholder blijft staan (breekt niet).
- `0` en lege string worden wél ingevuld.
- `useTranslation.t()` roept deze helper aan voor alle stringwaarden met params.

### 4. Hoe seller-statuslogica veiliger is gemaakt
- De seller-orders-API leverde al `statusRaw` (ruwe `OrderStatus`) naast het gelokaliseerde label.
- Dashboard (`RecentOrder.statusRaw`) en verkooporders gebruiken `orderIsInEnumState(order, [ENUMS], [labels])`: enum-first, label alleen als terugval wanneer geen enum aanwezig is.
- Weergave loopt via `getStatusText`/`getOrderStatusColor` (vertaald); de ruwe enum wordt nooit direct getoond.
- Tab-labels ("Nieuw"/"Lopend") en de "Terugbetaald"-status lopen nu via i18n (`seller.new`, `seller.ongoing`, `seller.refunded`).

### 5. Welke auditbevindingen bewust buiten scope blijven
- **J7–J26** grotere items: UI-primitive-consolidatie (Button/Chip design-system), status-chip unificatie app-breed, empty-state redesigns, first-impression/onboarding-herontwerp, `alert()` → toast-migratie buiten het geldpad.
- Backend-afkomstige statusteksten (bijv. `availability.message` van de bezorg-API) — server-side i18n valt buiten deze frontend-polishfase.
- De transiente Suspense-fallback ("Laden…") op de success-pagina blijft ongewijzigd (kort zichtbaar, buiten de i18n-provider-hook).
- Overige `Aboutview/Discabout`-achtige tekstbugs buiten EN zijn niet aangetroffen; brede copy-sweep is geen onderdeel van deze fase.

---

## Validatie

```bash
npx tsx scripts/validate-ux-fin-3a-critical-polish.ts   # 79 passed, 0 failed
npm run build
```
