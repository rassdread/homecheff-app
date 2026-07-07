# Phase 5E-D — Exchange Proposal Conversion Polish Audit

**Datum:** 2026-07-07  
**Scope:** Zichtbaarheid, conversie, voorstel-ontdekbaarheid, match-transparantie. Geen nieuwe modellen/enums/redesigns.  
**Voorganger:** `MARKETPLACE_EXCHANGE_DISCOVERY_PROPOSAL_UX_AUDIT.md` (5E-C)

---

## 1. Gevonden UX-frictie (vóór 5E-D)

| # | Frictie | Ernst |
|---|---------|-------|
| F1 | `ProductSaleProposalAction` opende alleen chat-modal; proposal-sheet pas via ClipboardList | P0 |
| F2 | Mobiele suggesties: alleen “Bekijk ruilmogelijkheid” → listing, geen Start gesprek | P0 |
| F3 | `signalKinds` bestonden maar werden niet getoond | P1 |
| F4 | MONEY-listings: `commercePathChat` suggereerde voorstel/ruil | P0 |
| F5 | `desiredExchanges` in builder maar niet gerenderd op detail | P1 |
| F6 | `AcceptedValuesPicker` in proposal: verkoperscopy op “terugbieden”-veld | P1 |
| F7 | Hint bevatte “discovery-ranking” (developer-term) | P2 |

---

## 2. Deep-link verbeteringen

### Implementatie

| Bestand | Wijziging |
|---------|-----------|
| `lib/proposals/proposal-deep-link.ts` | `openProposal=1` query contract + URL builder |
| `components/chat/StartChatButton.tsx` | `openProposalAfterStart`: skip modal → chat + `openProposal=1` |
| `components/profile/MakerContactSection.tsx` | Props doorgeven naar StartChatButton |
| `components/product/detail/ProductSaleProposalAction.tsx` | `openProposalAfterStart` + label “Voorstel doen” |
| `components/chat/ChatBox.tsx` | `initialOpenProposal` → opent `CreateProposalSheet` na load |
| `app/messages/page.tsx` | Parseert `openProposal`, cleared param na auto-open |

### Flow na fix

```
Detail → “Voorstel doen”
  → POST /api/conversations/start (geen modal)
  → /messages?conversation={id}&openProposal=1
  → ChatBox laadt → CreateProposalSheet direct open
```

**Klikken:** 1 (was 4+).

**Hergebruikt:** `CreateProposalSheet`, `StartChatButton`, bestaande conversation API — geen nieuwe proposal flow.

### Resterende frictie

| Pad | Klikken | Opmerking |
|-----|---------|-----------|
| Detail proposal CTA | **1** | Direct deep-link |
| Mobiel sticky CTA (barter-only) | **2** | Scrollt naar proposal CTA, dan 1 klik |
| Exchange suggestie → Start gesprek | **2+** | Geen `openProposal` op user-link (bewust: geen product-context) |
| Chat ClipboardList | **1** | Ongewijzigd fallback |

---

## 3. Mobile parity

### Vóór

`ExchangeSuggestionsMobileModule` rendeerde custom `Link`-kaarten met alleen listing-CTA.

### Na

- Gebruikt `ExchangeSuggestionCardView` (zelfde component als desktop detail)
- CTAs: **Bekijk aanbod**, **Bekijk profiel**, **Start gesprek**
- Dismiss + signal chips inbegrepen
- Hint onder titel (gebruikerstaal)

---

## 4. Match transparency

### Implementatie

| Bestand | Wijziging |
|---------|-----------|
| `lib/marketplace/exchange-suggestions/exchange-suggestion-signal-display.ts` | `pickDisplaySignalLabelKeys()` — max 2, prioriteit |
| `ExchangeSuggestionCard.tsx` | Chips onder samenvatting |
| `public/i18n/nl.json` + `en.json` | Gebruikerstaal voor `marketplace.exchange.signals.*` |

### Getoond vs verborgen

| Wel | Niet |
|-----|------|
| Max 2 signal chips (bijv. “Past bij wat je zoekt”) | Score (0–100) |
| km-chip bij LOCAL modifier (bestaand) | Ranking / min-score gates |
| Type label + samenvatting (bestaand) | `primaryMatchType` code labels |

---

## 5. Copy verbeteringen

| Key | Was | Nu (NL) |
|-----|-----|-----------|
| `marketplace.exchangeSuggestions.hint` | …discovery-ranking… | Optionele ruilkansen — alleen voor jou, niet voor de volgorde in de feed |
| `productDetail.commercePathContact` | *(nieuw)* | Stel je vraag via de chat voordat je bestelt |
| `marketplace.detail.actions.requestProposal` | Voorstel sturen | **Voorstel doen** |
| `marketplace.acceptedValues.offeredInReturnHeading` | *(nieuw)* | Wat bied je terug? |
| `marketplace.acceptedValues.searchPlaceholder` | Zoek in taxonomy… | Zoek op categorie of product… |
| `marketplace.exchange.signals.*` | Developer-achtig | Gebruikerstaal (Past bij wat je zoekt, Zelfde categorie, …) |

**MONEY-only:** `ProductSaleSecondaryContact` gebruikt `commercePathContact` — geen ruil/voorstel-copy meer.

---

## 6. Desired exchange rendering

### Implementatie

| Bestand | Wijziging |
|---------|-----------|
| `detail-value-exchange-block.ts` | `buildDesiredExchangesForDetail()` — zelfde logica als suggestion mapper |
| `ProductValueExchangeSection.tsx` | Sectie “Zoekt” (amber chips) + “Accepteert” (emerald chips) |
| `app/product/[id]/page.tsx` | `listingTitle` prop |

**Eén sectie** “Betaling & ruil” — geen duplicatie, geen tweede accepted-values lijst.

---

## 7. Proposal entrypoints (post-5E-D)

### Directe entrypoints

| Entry | Pad naar CreateProposalSheet |
|-------|-------------------------------|
| Detail “Voorstel doen” | **Direct** (deep-link, 1 klik) |
| Chat ClipboardList | Direct (1 klik, ongewijzigd) |

### Indirecte entrypoints

| Entry | Pad |
|-------|-----|
| Mobiel sticky “Voorstel doen” | Scroll → proposal CTA → deep-link (2 klikken) |
| Suggestie “Start gesprek” | Messages → handmatig ClipboardList |
| MONEY “Vraag iets aan maker” | Chat only — geen proposal copy |

### Verborgen (bewust)

| Entry | Reden |
|-------|-------|
| Proposal vanuit suggestie zonder product | Geen product-bound prefilled context |
| MONEY listing value settlement | Server rejected — UI copy aligned |

---

## 8. Resterende conversielekken

| # | Lek | Prioriteit | Aanbeveling (5E-E) |
|---|-----|------------|-------------------|
| R1 | Sticky mobiel: scroll + klik i.p.v. direct deep-link | P2 | Sticky CTA `openProposalAfterStart` inline |
| R2 | Suggestie → gesprek zonder product context | P2 | Optioneel `?productId=` op conversation start |
| R3 | Niet-ingelogd: geen suggesties | P1 | Onboarding / auth gate copy |
| R4 | Proposal-sheet settlement hint vs payment path | P2 | Copy-only fix in `CreateProposalSheet` |
| R5 | EN hardcoded NL in chat system labels | P2 | i18n sweep (uit 5E-C) |

---

## 9. Validatiestatus

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | *(zie CI-run)* |
| `npm run build` | *(zie CI-run)* |
| `npm run smoke-check` | *(zie CI-run)* |
| `validate-marketplace-taxonomy-consolidation` | bestaand |
| `validate-marketplace-detail-system` | bestaand |
| `validate-marketplace-barter-openness-wiring` | bestaand |
| `validate-marketplace-exchange-commerce-alignment` | bestaand |
| **`validate-marketplace-exchange-proposal-conversion`** | **nieuw (5E-D)** |

---

## 10. Dubbelbouw vermeden

Alle wijzigingen hergebruiken:

- `CreateProposalSheet`, `ProposalCard`, `DealCard`, `proposal-service`
- `resolveProductCommerceActions`, `resolve-exchange-suggestions`
- `ExchangeSuggestionCardView`, `AcceptedValuesPicker`
- `marketplace.exchange.signals.*` i18n
- Bestaande conversation start API

**Niet gebouwd:** nieuwe enums, proposal/order modellen, matching engine, tile/detail/chat redesign.

---

## 11. Succescriteria

| Criterium | Status |
|-----------|--------|
| Voorstel doen → direct proposal-flow | ✅ |
| Mobiele suggesties CTA-parity | ✅ |
| Gebruiker ziet waarom match (1–2 chips) | ✅ |
| Desired exchanges op detail | ✅ |
| MONEY geen ruil-copy | ✅ |
| Geen nieuwe modellen/enums | ✅ |
| Geen redesign | ✅ |
| Audit opgeleverd | ✅ |
