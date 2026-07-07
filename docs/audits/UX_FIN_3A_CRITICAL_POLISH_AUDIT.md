# UX-FIN 3A — Critical Polish Audit (Money Path + Copy)

**Date:** 2026-07-07
**Method:** Static code trace of `hooks/useTranslation.ts`, `lib/i18n/*`, `components/cart/CartDrawer.tsx`, `app/checkout/page.tsx`, `app/payment/success/page.tsx`, `app/verkoper/dashboard/page-client.tsx`, `app/verkoper/orders/page-client.tsx`, `app/api/**/orders`, `public/i18n/*.json` + `scripts/validate-ux-fin-3a-critical-polish.ts` (79 checks).
**Related:** [UX_FINALIZATION_PHASE3A_MONEY_PATH_POLISH.md](../progress/UX_FINALIZATION_PHASE3A_MONEY_PATH_POLISH.md) · [HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md](./HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md)

---

## 1. Executive summary

Fase 3 signaleerde dat HomeCheff functioneel sterk is maar dat de meest zichtbare polish-fouten geconcentreerd zitten op het geldpad en in kritieke copy. Deze fase heeft die P0/P1 quick wins verholpen zonder nieuwe functionaliteit. De belangrijkste risicoplek — het moment van betalen en statusinzicht — is nu taalconsistent en toont geen technische lekken (cuid's, ruwe enums, stray braces) meer.

Tijdens de trace bleek de checkout-namespace bovendien **grotendeels afwezig** in de i18n-bestanden (alleen `checkout.errors` bestond); ~72 `t('checkout.*')`-verwijzingen renderden leeg. Deze zijn nu allemaal aanwezig in nl én en.

---

## 2. Bevindingen per onderdeel

| # | Onderdeel | Status | Bewijs |
|---|-----------|--------|--------|
| 3A.1 | Interpolatie `{x}` + `{{x}}` | ✅ | `lib/i18n/interpolate.ts`; `useTranslation.t()` gebruikt helper; runtime-tests inclusief mixed/missing/0/geen stray braces |
| 3A.2 | Cart verkopernaam | ✅ | `CartDrawer` gebruikt `item.sellerName` + `cart.soldBy`/`cart.providerFallback`; geen "van Verkoper"; `useCart` fallback → `''` |
| 3A.3 | Payment success titel | ✅ | `productTitleById` uit order-polling; geen "Product ID:"; fallback `paymentSuccess.productFallback` |
| 3A.4 | Money-path i18n | ✅ | nieuwe `checkout.*`/`paymentSuccess.*` + aangevulde `cart.*`; 72 checkout-keys aanwezig nl+en; geen `t()||'NL'` |
| 3A.5 | Aboutview | ✅ | `admin.overview`="Overview", `admin.orderManagementDescription` hersteld; geen Aboutview/Discabout in en.json |
| 3A.6 | Seller status-enum | ✅ | `statusRaw` in `RecentOrder`/`Order`; `orderIsInEnumState()`; display via `getStatusText`; geen NL-label-beslissingen |
| 3A.7 | Console-logs | ✅ | debug-logs weg in buyer-orders, delivery-onboarding, seller-orders-API |

---

## 3. Rechten & statusovergangen (seller)

- De seller-dashboard-orders-API (`app/api/seller/dashboard/orders/route.ts`) levert `status` (gelokaliseerd label) **en** `statusRaw` (ruwe `OrderStatus`).
- Business-beslissingen (welke actieknop, welke lijst-bucket) draaien op `statusRaw`:
  - `CONFIRMED`/`PENDING` → "Nieuw" + actie "product gereed / start bezorging".
  - `PROCESSING` → actie "gereed voor afhalen / bezorgen / verzonden".
  - `SHIPPED` → actie "markeer als bezorgd" (alleen wanneer `sellerCanSetDelivered`).
- Weergave loopt via vertaalde labels; de ruwe enum wordt nooit aan de gebruiker getoond.
- Terugval op labels blijft mogelijk voor feeds zonder `statusRaw` (bijv. de delivery-dashboard-feed), maar enum heeft altijd voorrang.

---

## 4. i18n-interpolatie — gedrag

| Input | Params | Output |
|-------|--------|--------|
| `{count} x` | `{count: 5}` | `5 x` |
| `{{count}} x` | `{count: 5}` | `5 x` |
| `{{count}} of {total}` | `{count: 2, total: 9}` | `2 of 9` |
| `{count} left` | `{}` | `{count} left` (blijft staan) |
| `{{count}} items` | `{count: 0}` | `0 items` |

---

## 5. Bewust buiten scope (geen regressie, wel bekend)

- App-brede design-system-consolidatie (Button/Chip/Card), status-chip-unificatie, empty-state/onboarding-herontwerp — grotere Fase 3-items.
- `alert()` → toast buiten het geldpad; backend-afkomstige statusteksten (server-side i18n).
- Transiente Suspense-fallback op de success-pagina.

---

## 6. Validatie

```bash
npx tsx scripts/validate-ux-fin-3a-critical-polish.ts
```

79 checks — alle groen (interpolatie, cart, payment success, money-path i18n + parity, admin copy, seller status-enum, console-logs).
