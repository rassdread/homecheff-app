# UX Finalization Phase 3 — Complete User Journey Polish

**Date:** 2026-07-07
**Status:** Audit complete — no code changed
**Scope:** Volledige UX-, UI-, copy-, navigatie- en interactie-audit over de complete HomeCheff-app. **Geen featurefase**: geen nieuwe economie, marketplace-, delivery-, AI- of notificatiefunctionaliteit, geen sidebar-redesign, geen ranking/search/payment-wijzigingen, geen grote redesigns.

Deliverable: dit progress-document + [HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md](../audits/HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md). Bouwt voort op Fase 1 (nav/IA) en Fase 2 (navigation completeness).

---

## Methode

Vier parallelle read-only verkenningen over `app/**`, `components/**`, `lib/**`, `public/i18n/*`:
1. Eerste indruk / homepage / onboarding / empty states.
2. Copy-audit + NL/EN i18n-parity + terminologie.
3. UI-consistentie: primitives, statuschips, loading/empty/error states, tokens, touch targets.
4. Journey-polish per rol (buyer / seller / request / courier / operations).

Hoog-impact bevindingen zijn daarna direct tegen de broncode geverifieerd.

---

## 1. Complete user journeys per rol (samenvatting)

| Rol | Reis | Staat |
|-----|------|-------|
| Gast | `/` hero+feed → tile → detail → soft-auth gate | Gates goed; concept-uitleg ontbreekt (koop+verkoop, "Gezocht") |
| Koper | detail → voorstel → chat → deal → checkout → success → `/orders` → review | Nav ok (Fase 2); **geldpad = zwakste polish** |
| Verkoper | `/sell/new` → publiceren → dashboard → orders → deal → delivery → afronden | Statuslogica matcht NL-labels (fragiel); geen publicatie-bevestiging |
| REQUEST/community | `/?chip=gezocht` → `/request/[slug]` → voorstel → deal → agenda → delivery | Functioneel compleet; **visueel als verkoop verkleed** |
| Bezorger | signup → dashboard → claim → bezorgen → afronden → verdiensten | Goede status/earnings-cards; geen terug-naar-app; currency-helper wijkt af |
| Operations hub | `/profile/deals` cockpit → actie vereist → filters → agenda → historie | **Referentiekwaliteit**; alleen micro-nits |

---

## 2. Gevonden UX-fricties, geprioriteerd

Volledige register (J1–J26) met locaties in de audit, [§13](../audits/HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md#13-prioritized-friction-register-p0p3). Kern:

- **P0 (1):** J1 — `t()` interpoleert alleen `{x}`, maar 61 keys gebruiken `{{x}}`; trust-cues renderen als `"{5} afgeronde afspraken"` (geverifieerd: `hooks/useTranslation.ts:693`, `en.json:7777`).
- **P1 (7):** J2 cart "van Verkoper", J3 success "Product ID: <cuid>", J4 geldpad hardcoded NL, J5 "Aboutview"-typo, J6 verkoper-status op NL-labels, J7 primitive/token-fragmentatie, J8 eerste-indruk (koop+verkoop / "Gezocht" / mobiele chips).
- **P2 (10):** statuschips ≥6× herbouwd, `alert()`-foutkanaal, ruwe status-enums, request-chrome, bare spinners, hover-only 24px controls, `/favorites`=Fans, courier-currency, terminologie-drift, `|| 'Dutch'`-fallbacks.
- **P3 (8):** innerHTML-toast, dubbele statuschip, dubbele chatlink, stepper-asymmetrie, `console.log`, kapitalisatie "Dorpsplein", publicatie-bevestiging, `deliveryFee || 300`.

## 3. UI-consistentieanalyse

- Design system nauwelijks geadopteerd: alleen `Button` (33 files) + `EmptyState` (1 file); `HcButton`/`HcCard`/`Card`/`Tag`/`Input`/`LoadingSkeleton` = **0 externe imports**; ~250 files met ruwe `<button>`.
- Drie "primary green" tokens (`primary-brand`/`primary-600`/`emerald-600`) + `rounded-lg/xl/2xl` door elkaar binnen één journey.
- Statuschips ≥6× herbouwd met botsende kleuren voor dezelfde status; `Tag` ongebruikt.
- Loading: skeletons op 5 routes; profile-deals & delivery vallen terug op bare spinners.
- Errors: geen toast-library; ~240 `alert()`-aanroepen als de facto foutkanaal.

## 4. Copy- en terminologieanalyse

- NL/EN parity **structureel perfect** (7358 keys elk, 0 orphan keys). Content: ~5 onvertaalde waarden + 579 identieke (meest legitieme cognaten).
- **Interpolatie-bug (P0)** in trust-namespaces.
- Copy-bug: `admin.overview`="Aboutview".
- Terminologie-drift: afspraak↔deal↔agreement↔arrangement; bezorger↔courier↔deliverer; aankopen↔bestellingen.
- Dev-termen in UI-copy: "listing"/"checkout"/"feed" onvertaald in NL; ruwe status-enums getoond.

## 5. Visual polish-kansen

Reconcilieer greens+radius op het `Button`/token-systeem (grootste kwaliteitswinst); één gedeelde statuschip; verwijder gestapelde dubbele chip op deal-cards; skeletons overal; homepage-dichtheid temperen op desktop, kern-chips behouden op mobiel.

## 6. Informatie-architectuurverbeteringen

`/favorites` toont Fans i.p.v. favorieten (naam↔inhoud-mismatch, extra relevant na Fase 2-nav); reviews staan op REQUEST-detail (verkeerde listing-kind); trust-cues goed geplaatst maar gebroken door J1; courier-verdiensten off-area zonder terugweg.

## 7. Mobile vs desktop

Mobiele hero is lean maar verliest "meer dan maaltijden"- en community-messaging (chips zijn `hidden lg:block`); cart-model verschilt (drawer vs `/checkout`); back-office/finance-tabellen desktop-first (Fase 1 M1); courier zonder bottom-nav/terug-naar-app; uploader-controls hover-only op touch.

## 8. Concrete polish-aanbevelingen (quick wins vs groter)

**Quick wins:** J1 (`{{ }}` support in `t()` → fixt 61 keys), J2/J3 (cart naam + success titel), J5 ("Overview"), J20/J21/J23 (de-dup + logs), J25/J26/J19.

**Medium:** J4 (geldpad → `t()`), J6/J11 (status via enum), J13 (skeletons), J12 (request-chrome gaten), J16/J18 (courier currency + fallbacks).

**Groter (als tracks):** J7/J9 (design-system + gedeelde `Tag`), J10 (toast i.p.v. `alert()`), J8 (eerste-indruk), J17 (canonieke terminologie), J14 (touch/hover-pass).

Aanbevolen volgorde in audit [§15](../audits/HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md#15-recommended-sequencing-post-audit-not-part-of-this-phase).

---

## Rapportage-checklist (opdracht)

1. Complete user journeys per rol — §1 + audit §1. ✅
2. Geprioriteerde UX-fricties (P0–P3) — §2 + audit §13 (J1–J26). ✅
3. UI-consistentieanalyse — §3 + audit §4/§11. ✅
4. Copy- en terminologieanalyse — §4 + audit §5. ✅
5. Visual polish-kansen — §5 + audit §8. ✅
6. Informatie-architectuurverbeteringen — §6 + audit §7. ✅
7. Mobile vs desktop — §7 + audit §9. ✅
8. Concrete polish-aanbevelingen (quick wins vs groter) — §8 + audit §14. ✅

---

## Related documents
- [HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md](../audits/HOMECHEFF_COMPLETE_USER_JOURNEY_AUDIT.md)
- [HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md](../audits/HOMECHEFF_GLOBAL_UX_NAVIGATION_AUDIT.md)
- [UX_NAVIGATION_COMPLETENESS_AUDIT.md](../audits/UX_NAVIGATION_COMPLETENESS_AUDIT.md)
- [ROUTE_OWNERSHIP.md](../architecture/ROUTE_OWNERSHIP.md)

---

*Fase 3 is uitsluitend een audit — er is geen code gewijzigd. De vervolg-implementatie (money-path polish, consistency pass, design-system) is een aparte bouwfase.*
