# Phase 5E-F — MONEY_AND_BARTER Mobile Choice UX Audit

**Datum:** 2026-07-07  
**Scope:** Alleen audit — geen bouw, geen redesign, geen nieuwe CTA's.  
**Vraag:** Is er een echt UX-probleem wanneer mobiele gebruikers zowel kunnen kopen als een voorstel kunnen doen?  
**Voorgangers:** `MARKETPLACE_EXCHANGE_QA_MOBILE_FRICTION_AUDIT.md` (5E-E), `MARKETPLACE_EXCHANGE_PROPOSAL_CONVERSION_POLISH_AUDIT.md` (5E-D)

---

## Validatiestatus (2026-07-07)

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | ✅ pass |
| `npm run build` | ✅ pass |
| `npm run smoke-check` | ✅ pass |
| `validate-marketplace-exchange-proposal-conversion` | ✅ 30/30 |
| `validate-marketplace-exchange-commerce-alignment` | ✅ 17/17 |
| `validate-marketplace-barter-openness-wiring` | ✅ 18/18 |

Geen feature-code gewijzigd.

---

## 1. Executive summary

Phase 5E-F onderzoekt of **MONEY_AND_BARTER** op mobiel een **meetbaar ontwerpprobleem** heeft: checkout dominant, proposal secundair en deels onder de fold.

| Bevinding | Conclusie |
|-----------|-----------|
| Sticky CTA | **Alleen checkout** (add to cart / go to checkout) |
| Commerce zone | Checkout **primair** (grote knop + groene hint); proposal **secundair** (ingeklapte outline-knop) |
| Prijsregel | `€X + ruil` zichtbaar op sticky én in commerce zone |
| Value-exchange sectie | Onder de fold; bevestigt “Geld + ruil” |
| Desktop vs mobiel | Commerce zone **symmetrisch**; mobiel heeft extra **checkout-only sticky** |
| Meetbare conversiedata | **Afwezig** in codebase — geen analytics op proposal vs checkout taps |

**Conclusie:** Er is een **structurele asymmetrie** (checkout 2–3 taps via sticky; proposal 3+ taps met scroll). Dat is **bewust** vastgelegd in Phase 5E-B (`resolveProductCommerceActions`). Of dat een **echt conversieprobleem** is, kan met deze audit **niet bewezen** worden — wel dat ruil-geïnteresseerde gebruikers die **alleen de sticky** gebruiken, de proposal-route **niet** zien.

**Aanbeveling:** Eerst **lichtgewicht meting** (bestaande analytics hooks uitbreiden) vóór UI-wijziging. Kleinste mogelijke UX-fix (indien meting bevestigt): secundaire proposal-actie op sticky hergebruikend `StartChatButton` — geen nieuwe architectuur.

---

## 2. Mobile journey audit

### 2.1 Pagina-structuur (mobiel, `app/product/[id]/page.tsx`)

```
[Sticky back bar]
[Image carousel — h: 280–320px]
[ProductSaleCommerceZone]
  ├── Prijs (€X + ruil)
  ├── Quantity selector
  ├── Locality + delivery
  ├── Trust line
  ├── ProductSalePrimaryActions  ← checkout + proposal
  └── (geen ProductSaleSecondaryContact bij MONEY_AND_BARTER)
[mt-8 — scroll]
  ├── ProductOfferedBadgesSection
  ├── ProductValueExchangeSection (“Betaling & ruil”)
  ├── ExchangeSuggestionsMobileModule
  └── ProductSaleAboutSection + reviews
[Fixed ProductSaleStickyCta — lg:hidden]
[Bottom nav ~5.75rem]
```

`main` heeft `pb-[calc(10rem+safe-area)]` op mobiel — ruimte voor sticky + tabbar.

### 2.2 Taps & scroll — MONEY_AND_BARTER (optimistisch)

| Pad | Stappen | Taps | Scrolls |
|-----|---------|------|---------|
| **Checkout via sticky** | Detail → sticky “In winkelwagen” → (optioneel) “Naar checkout” | **2–3** | **0** |
| **Checkout via commerce** | Detail → Add to cart in zone | **2** | **0–1** (kleine telefoons: zone deels onder fold) |
| **Proposal via commerce** | Detail → “Voorstel doen” (expand) → deep-link start | **3** | **0–1** |
| **Proposal via sticky** | — | **N/A** | Sticky biedt geen proposal |

### 2.3 Ontdekken beide opties?

| Signaal | Waar | Zichtbaar zonder scroll? |
|---------|------|--------------------------|
| `€X + ruil` prijsregel | Sticky + commerce | ✅ Sticky altijd; commerce meestal na image |
| “Geld + ruil” payment row | Value-exchange sectie | ❌ Onder fold |
| Checkout hint | Commerce zone | 🟡 Vaak zichtbaar |
| “Voorstel doen” knop | Commerce zone, **ingeklapt** | 🟡 Onder add-to-cart; kleinere visuele hiërarchie |
| Sticky proposal | — | ❌ Afwezig |

**Antwoord:** Een **oplettende** gebruiker ziet “+ ruil” in de prijs en kan de ingeklapte proposal-knop vinden. Een gebruiker die **alleen de sticky** volgt, ziet **alleen checkout** — geen expliciete ruil-CTA.

---

## 3. CTA visibility audit

### 3.1 Component-matrix

| Component | MONEY | MONEY_AND_BARTER | BARTER_ONLY |
|-----------|-------|------------------|-------------|
| **ProductSaleStickyCta** | Add to cart | Add to cart | **Voorstel doen** (deep-link) |
| **ProductSalePrimaryActions** | Add to cart | Add to cart + **ingeklapte** proposal | Proposal primair |
| **ProductSaleProposalAction** | ❌ | Secundair (`primary=false`) | Primair (`primary=true`) |
| **ProductSaleSecondaryContact** | ✅ (chat, geen ruil-copy) | ❌ verborgen | ❌ verborgen |
| **ProductValueExchangeSection** | Alleen bij accepted values | ✅ “Geld + ruil” + accepted | ✅ “Ruil” / accepted |

Bron: `resolveProductCommerceActions()` in `barter-commerce-alignment.ts`; `ProductSaleCommerceZone` regel 288–294 verbergt secondary contact wanneer `showProposalCta`.

### 3.2 Above / below fold (mobiel ~390×844 viewport)

| Element | Positie | MONEY | MONEY_AND_BARTER | BARTER_ONLY |
|---------|---------|-------|------------------|-------------|
| Sticky CTA | Fixed bottom | Checkout | Checkout | Proposal |
| Prijs + titel | Boven fold | ✅ | ✅ (+ ruil) | ✅ (Ruil) |
| Add to cart | Commerce zone | ✅ meestal | ✅ meestal | — |
| Proposal expand | Commerce zone | — | 🟡 onder cart-knop | ✅ primair |
| Value exchange | Onder fold | zelden | ✅ na scroll | ✅ na scroll |
| Suggesties | Onder fold | — | ✅ (auth) | ✅ (auth) |

### 3.3 Visuele hiërarchie (MONEY_AND_BARTER)

| CTA | Styling | Volgorde |
|-----|---------|----------|
| Add to cart | `primary-brand`, `font-bold`, `shadow-lg`, full width | **Eerst** |
| Checkout hint | Groen blok `commercePathCheckout` | Boven cart |
| Voorstel doen (collapsed) | Emerald outline, kleiner, `text-sm` | **Onder** cart |
| Voorstel doen (expanded) | Indigo hint + `StartChatButton` emerald | Na 1 extra tap |

---

## 4. Conversion symmetry audit

### 4.1 Wordt kopen sterker gepromoot?

**Ja — objectief**, op drie niveaus:

| Niveau | Checkout | Proposal |
|--------|----------|----------|
| **Sticky (mobiel)** | Enige actie | Afwezig |
| **Visueel gewicht** | Primary brand, groot | Outline, secundair |
| **Stappen** | 2 taps (sticky) | 3 taps + expand |
| **Copy** | `commercePathCheckout` prominent | Alleen na expand: `commercePathProposal` |

### 4.2 Waarom (ontwerp, geen bug)

Phase 5E-B legde vast:

```ts
case 'MONEY_AND_BARTER':
  return { showOrderCheckout: true, showProposalCta: true };
```

Beide paden zijn **toegestaan**; prioriteit is **niet** 50/50 — checkout is het **default commerce-pad**, proposal het **secundaire community-pad**. Dat sluit aan bij Stripe/HomeCheff-ordermodel als primaire revenue-flow.

### 4.3 Stappenverschil (samenvatting)

| Metriek | Checkout | Proposal |
|---------|----------|----------|
| Min. taps (mobiel) | **2** | **3** |
| Sticky bereikbaar | ✅ | ❌ |
| Modal/sheet | Cart/checkout | CreateProposalSheet (na deep-link) |
| Server gates | `orderMethod` + Stripe | `barterOpenness` + settlement validation |

**Verschil: 1 tap + sticky-only bereikbaarheid voor checkout.**

---

## 5. Heatmap simulation

Gesimuleerd viewport: **390×844** (iPhone 14), ingelogde koper, listing met prijs > 0, chat enabled.

### Scenario A — “Ik wil kopen.”

```
[Feed] --tap tile--> [Detail]
  │ prijs "€12 + ruil" in sticky (perifeer signaal)
  │ sticky: "In winkelwagen" ← DIRECT ZICHTBAAR
  └--tap--> cart updated
       └--tap "Naar checkout"--> /checkout

Taps: 2–3 | Scrolls: 0 | Dead ends: geen
Gevoel: Soepel, sticky volstaat
```

### Scenario B — “Ik wil ruilen.”

```
[Feed] --tap--> [Detail]
  │ sticky: "In winkelwagen" ← DOMINANT (misleidend voor ruil-intent?)
  │ gebruiker ziet "+ ruil" in prijs maar geen ruil-knop op sticky
  │
  ├─ Pad 1 (sticky-only user): koopt per ongeluk OF vertrekt
  │
  └─ Pad 2 (scrollt naar commerce zone):
       └--tap "Voorstel doen" (expand)-->
            └--tap "Voorstel doen" (StartChatButton)-->
                 [Chat + proposal sheet open]

Taps: 3 | Scrolls: 0–1 | Risico: sticky leidt weg van ruil-intent
```

### Scenario B variant — gebruiker mist ingeklapte knop

```
Scrollt alleen naar "Betaling & ruil" sectie (onder fold)
  → ziet "Geld + ruil" + accepted chips
  → GEEN directe CTA in die sectie (informatief only)
  → moet terug omhoog naar commerce zone voor proposal-knop

Extra scroll/frictie: +1
```

### Gelijkwaardigheid

| Journey | Symmetrisch? |
|---------|--------------|
| A vs B taps | ❌ (2–3 vs 3–4) |
| Sticky | ❌ (alleen checkout) |
| Commerce zone | 🟡 (beide aanwezig, ongelijk gewicht) |
| Desktop | 🟡 (geen sticky; beide in zone) |

---

## 6. Desktop vs mobiel vergelijking

| Aspect | Desktop (`lg+`) | Mobiel |
|--------|-----------------|--------|
| **Sticky CTA** | Geen (`lg:hidden`) | Checkout-only voor MONEY_AND_BARTER |
| **Commerce zone** | Rechterkolom, sticky binnen pagina | Onder carousel, zelfde componenten |
| **Primary actions** | Identiek `ProductSalePrimaryActions` | Identiek |
| **Proposal default** | Ingeklapt (`primary=false`) | Ingeklapt |
| **Proposal deep-link** | ✅ na expand + tap | ✅ na expand + tap |
| **BARTER_ONLY sticky** | N.v.t. | Proposal deep-link (5E-E) |
| **Value exchange** | Zelfde sectie, meer viewport | Meer scroll |

**Kernverschil:** Mobiel voegt een **permanent checkout-sticky** toe die desktop niet heeft. Dat versterkt checkout-asymmetrie **alleen op mobiel**.

---

## 7. Proposal discovery score

Schaal 0 (onvindbaar) – 10 (direct zichtbaar). Scores gebaseerd op **huidige UI-structuur**, niet op gebruikersonderzoek.

### MONEY_AND_BARTER

| Surface | Checkout | Proposal |
|---------|----------|----------|
| Detailpagina (informatie) | 8 (prijs + zone) | 6 (`+ ruil` in prijs; geen CTA in value sectie) |
| Sticky CTA | **9** | **0** |
| Commerce zone | **9** | **5** (ingeklapt, onder cart) |
| Suggesties | — | 7 (Start gesprek; geen auto-proposal) |
| Chat | — | 7 (ClipboardList + deep-link als al in chat) |

**Gemiddelde proposal-discovery (mobiel): ~5,2** — matig; sticky trekt gewogen gemiddelde omlaag.

### Ter vergelijking

| Type | Proposal discovery (mobiel) |
|------|---------------------------|
| BARTER_ONLY | **9** (sticky + primair) |
| MONEY | **1** (bewust geen proposal CTA) |
| MONEY_AND_BARTER | **~5** |

---

## 8. Reuse audit

### 8.1 Later herbruikbaar (zonder nieuwe architectuur)

| Component | Potentiële rol bij kleinste fix |
|-----------|--------------------------------|
| `StartChatButton` | `skipModal` + `openProposalAfterStart` op sticky secundair |
| `ProductSaleStickyCta` | Uitbreiden met tweede knop **of** context-afhankelijke primary |
| `resolveProductCommerceActions` | Blijft single source; geen nieuwe enum |
| `buildMessagesWithProposalOpenUrl` | Bestaand deep-link contract |
| `ProductSaleProposalAction` | Zelfde gedrag; eventueel `primary` op mobiel only |
| `formatCommercePriceLabel` | Blijft `€X + ruil` signaal |

### 8.2 Absoluut niet opnieuw bouwen

- Proposal / CommunityOrder modellen
- `CreateProposalSheet`, `proposal-service`
- Checkout / Stripe cart pipeline
- `barterOpenness` enum of settlement matrix
- Parallelle sticky-bar component
- Nieuwe conversation types

---

## 9. Risicoanalyse

### 9.1 Als we niets wijzigen

| Risico | Waarschijnlijkheid | Impact | Bewijs in code |
|--------|-------------------|--------|----------------|
| Ruil-intent gebruikers gebruiken alleen sticky → kopen i.p.v. voorstel | **Medium** (structureel) | Medium | Sticky geen proposal |
| Gebruikers zien `+ ruil` maar vinden geen actie | **Laag–medium** | Medium | Prijs signaal zonder sticky-actie |
| Geen probleem — power users vinden ingeklapte knop | **Medium** | Laag | Commerce zone heeft beide |
| Checkout-conversie daalt door verwarring | **Laag** | Laag | Checkout-pad is duidelijk |
| **Meetbaar conversieverlies** | **Onbekend** | — | Geen tap-funnel analytics in repo |

### 9.2 Verwarring vs bewust ontwerp

| Observatie | Interpretatie |
|------------|---------------|
| Checkout dominant | **Bewust** (5E-B commerce alignment) |
| `+ ruil` op sticky prijs zonder ruil-actie | **Potentiële cognitieve dissonantie** — signaal zonder matching CTA |
| Proposal werkt technisch | ✅ Geen bug |
| BARTER_ONLY mobiel opgelost | ✅ Niet vergelijkbaar met MONEY_AND_BARTER |

### 9.3 Is er daadwerkelijk een UX-probleem?

| Criterium | Oordeel |
|-----------|---------|
| Technisch gebroken? | **Nee** |
| Structurele asymmetrie? | **Ja** |
| Bewijs van user harm? | **Nee** (geen data) |
| Hypothese plausibel? | **Ja** — sticky-only users missen proposal |
| Severity | **P1 hypothesis**, niet P0 bug |

---

## 10. Aanbevolen volgende fase (5E-G)

**Meet eerst, bouw daarna minimaal.**

### Fase 5E-Ga — Instrumentatie (geen UI)

- `trackExchangeSuggestionCtaClick` patroon uitbreiden naar:
  - `sticky_add_to_cart` vs `commerce_proposal_expand` vs `commerce_proposal_deep_link`
- 2 weken data → funnel: detail view → proposal start / checkout start per `barterOpenness`

### Fase 5E-Gb — Kleinste UX-fix (alleen bij bevestigde lek)

Opties gerangschikt op minimale diff (audit-only voorstel):

| # | Fix | Diff | Hergebruik |
|---|-----|------|------------|
| 1 | Sticky **split**: cart links, compact “Voorstel doen” rechts (`StartChatButton`) | ~30 regels `ProductSaleStickyCta` | Bestaand |
| 2 | Proposal-knop **standaard uitgevouwen** op mobiel voor MONEY_AND_BARTER | 1 regel default state | `ProductSaleProposalAction` |
| 3 | Link in value-exchange sectie: “Voorstel doen →” anchor `#commerce-proposal-cta` | Copy + anchor | Bestaand id |

**Niet doen zonder data:** nieuwe sticky bar, nieuwe proposal flow, checkout demoten.

---

## 11. Conclusie — kernvragen

| Vraag | Antwoord |
|-------|----------|
| **Ontdekken gebruikers dat voorstellen mogelijk zijn?** | **Gedeeltelijk.** Prijs `€X + ruil` en ingeklapte knop in commerce zone — **niet** via sticky. Gebruikers die niet scrollen/expanden kunnen het missen. |
| **Is checkout dominant?** | **Ja** — sticky, visueel gewicht, tap-count en copy-hiërarchie. |
| **Is dat bewust gewenst?** | **Ja** — Phase 5E-B: geld-pad primair wanneer `showOrderCheckout && showProposalCta`. |
| **Meetbaar conversielek?** | **Niet bewezen** — geen analytics. Structureel lek **plausibel** voor sticky-only users. |
| **Echt UX-probleem?** | **Hypothese ja, bewijs nee.** Asymmetrie is reëel; impact onbekend. |
| **Kleinste mogelijke oplossing?** | Compacte **tweede sticky-actie** “Voorstel doen” via bestaande `StartChatButton` + `openProposalAfterStart` — zelfde patroon als BARTER_ONLY. |
| **Hergebruiken?** | `StartChatButton`, `ProductSaleStickyCta`, `resolveProductCommerceActions`, `proposal-deep-link`. |
| **Niet opnieuw bouwen?** | Proposal stack, checkout, matching, nieuwe sticky-architectuur, enums. |

---

## Bijlage A — Code-referenties

| Onderwerp | Bestand |
|-----------|---------|
| CTA matrix | `lib/marketplace/commerce/barter-commerce-alignment.ts` |
| Sticky (MONEY_AND_BARTER = cart) | `components/product/detail/ProductSaleStickyCta.tsx` |
| Checkout + proposal volgorde | `components/product/detail/ProductSalePrimaryActions.tsx` |
| Proposal expand + deep-link | `components/product/detail/ProductSaleProposalAction.tsx` |
| Secondary contact verborgen | `components/product/detail/ProductSaleCommerceZone.tsx` L288–294 |
| Detail layout mobiel | `app/product/[id]/page.tsx` |
| Prijsregel `+ ruil` | `lib/marketplace/tiles/build-tile-price-line.ts` |

## Bijlage B — Tap-tellingen samenvatting

| `barterOpenness` | Mobiel checkout (min) | Mobiel proposal (min) | Sticky proposal? |
|----------------|----------------------|----------------------|------------------|
| MONEY | 2 | — | — |
| MONEY_AND_BARTER | **2** | **3** (+ expand) | ❌ |
| BARTER_ONLY | — | **1** | ✅ |
