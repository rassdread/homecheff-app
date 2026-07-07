# Phase 5E-E — Exchange QA & Mobile Friction Audit

**Datum:** 2026-07-07  
**Scope:** Mobiele frictie, contextbehoud, QA van exchange-flow. Geen nieuwe modellen/architectuur/redesign.  
**Voorganger:** `MARKETPLACE_EXCHANGE_PROPOSAL_CONVERSION_POLISH_AUDIT.md` (5E-D)

---

## 1. Executive summary

Phase 5E-E sluit de laatste **mobiele conversielekken** en verbetert **productcontext** bij suggestie → gesprek.

| Wijziging | Status |
|-----------|--------|
| Sticky CTA direct proposal deep-link (BARTER_ONLY) | ✅ Geïmplementeerd |
| Suggestie “Start gesprek” → product-bound conversation | ✅ Geïmplementeerd |
| Context preservation audit (listing → checkout) | ✅ Gedocumenteerd |
| Mobile journey QA | ✅ Gedocumenteerd |
| Status visibility / dead-ends / reuse | ✅ Gedocumenteerd |

**Conclusie:** Mobiele proposal-flow is nu **gelijkwaardig aan desktop** voor BARTER_ONLY (1 tap). MONEY_AND_BARTER mobiel blijft checkout-first op sticky (bewuste 5E-B keuze). Productcontext is **behouden** op detail → chat → proposal; **hersteld** op suggestie → gesprek.

---

## 2. Mobile journey audit

### 2.1 BARTER_ONLY — volledige mobiele keten (post 5E-E)

| Stap | Actie | Taps | Context |
|------|-------|------|---------|
| 1 | Feed tile “Ruil” | 1 | — |
| 2 | Detail openen | 2 | Prijsregel + value exchange |
| 3 | Sticky **Voorstel doen** | **3** | `POST /api/conversations/start { productId }` |
| 4 | Chat + proposal sheet open | 3 | `openProposal=1`, product header |
| 5 | Invullen + versturen | 4 | Prefill: title, accepted values, settlement |
| 6 | Tegenpartij accepteert | — | ProposalCard + DealCard |
| 7 | Afronden / betalen | — | CommunityOrder → checkout indien money leg |

**Taps tot proposal-sheet:** **1** (sticky of commerce CTA — identiek gedrag).

### 2.2 MONEY_AND_BARTER — mobiel

| Pad | Sticky CTA | Proposal-pad |
|-----|------------|--------------|
| Primair | Add to cart / checkout | Scroll naar uitklapbare proposal in commerce zone |
| Proposal | Niet op sticky | 2+ taps (scroll + Voorstel doen) |

**Bewust niet gewijzigd:** dubbele sticky-knop zou redesign zijn. Documenteren als P2.

### 2.3 Verborgen acties / redirects

| Issue | Ernst | Status |
|-------|-------|--------|
| ClipboardList in chat composer klein | P2 | Ongewijzigd — fallback |
| `messages?user=` links elders in app | P2 | Buiten scope (admin/profiel); suggesties gefixt |
| Niet-ingelogd: geen suggesties | P1 | Bestaand |

---

## 3. Proposal flow audit

### 3.1 Entrypoints (post 5E-E)

| Entry | Direct naar sheet? | Productcontext? |
|-------|-------------------|-----------------|
| Detail `ProductSaleProposalAction` | ✅ deep-link | ✅ |
| Mobiel sticky (BARTER_ONLY) | ✅ deep-link | ✅ |
| Commerce zone StartChat (proposal) | ✅ deep-link | ✅ |
| Chat ClipboardList | ✅ | ✅ als PRODUCT conversation |
| Suggestie Start gesprek | ❌ (chat only) | ✅ counterparty listing |
| Suggestie → listing → detail CTA | ✅ | ✅ |

### 3.2 Geen dubbele proposal-architectuur

Eén sheet: `CreateProposalSheet`. Eén service: `proposal-service`. Eén deep-link contract: `lib/proposals/proposal-deep-link.ts`.

---

## 4. Suggestion flow audit

### 4.1 Stappen per surface (na 5E-E)

| Surface | → Gesprek | → Proposal | → Deal |
|---------|-----------|------------|--------|
| Detail suggestie (desktop/mobiel) | **1 tap** (product-bound start) | +1 (ClipboardList of listing→detail CTA) | +accept |
| Profiel owner module | Zelfde card component | Idem | Idem |
| Sidebar | Zelfde card | Idem | Idem |
| Feed insert | Listing link only | Via listing detail | Via listing |

### 4.2 Vóór 5E-E vs na

| | Vóór | Na |
|---|------|-----|
| Start gesprek href | `/messages?user=username` (**geen handler**) | `StartChatButton` + `POST /conversations/start { productId: counterpartyListingId }` |
| Productcontext | ❌ Verloren | ✅ `conversation.productId` = voorgesteld aanbod |
| Proposal prefill | ❌ | ✅ Als gebruiker daarna proposal opent |

### 4.3 Resterende frictie

- Suggestie → gesprek opent **niet** automatisch proposal-sheet (bewust — gebruiker kan eerst chatten)
- Feed insert blijft listing-only (geen chat CTA op compact band)

---

## 5. Context preservation audit

### 5.1 Listing → chat

| Veld | Mechanisme | Behouden? |
|------|------------|-----------|
| `listingId` / `productId` | `Conversation.productId`, `contextType=PRODUCT` | ✅ |
| Producttitel | `resolveConversationHeader` → chat header | ✅ |
| `barterOpenness` | Header product + proposal prefill | ✅ |
| Accepted values | `acceptedSpecializations` in header | ✅ |
| Desired exchanges | Detail UI only; **niet** in proposal prefill | 🟡 Gap (data niet op Product model als apart veld) |

### 5.2 Chat → proposal

| Veld | CreateProposalSheet prefill | Behouden? |
|------|----------------------------|-----------|
| `productId` | `contextHeader.product.id` | ✅ |
| Titel | `product.title` | ✅ |
| Settlement mode | `deriveSettlementModeFromProduct(barterOpenness, …)` | ✅ |
| Accepted values | `acceptedValueTaxonomyIds` ← seller accepts | ✅ |
| Requested values | User vult in (picker) | N/A |
| `barterOpenness` | Filters settlement chips + server validation | ✅ |

**Gap:** `requestedValueTaxonomyIds` niet auto-filled from viewer's listing — matching uses it internally but geen UI prefill (toekomstige polish, geen bug).

### 5.3 Proposal → CommunityOrder

| Veld | Mechanisme | Behouden? |
|------|------------|-----------|
| `productId` | `Agreement` / `CommunityOrder` snapshot | ✅ |
| Settlement | `Proposal.settlementMode` | ✅ |
| Taxonomy legs | `acceptedValueTaxonomyIds`, `requestedValueTaxonomyIds` | ✅ |
| Money leg | `amountCents`, `paymentPath` | ✅ |

### 5.4 CommunityOrder → checkout

| Veld | Mechanisme | Behouden? |
|------|------------|-----------|
| `productId` | `/checkout?productId&communityOrderId` | ✅ (5E-B) |
| `checkoutOrderId` | Stripe webhook → order link | ✅ |

---

## 6. Status visibility audit

### 6.1 ProposalCard

| Status | Zichtbaar | UI |
|--------|-----------|-----|
| Verzonden (PENDING) | ✅ | Amber badge |
| Ontvangen (tegenpartij) | ✅ | Actieknoppen accept/reject/counter |
| Geaccepteerd | ✅ | Emerald badge + embedded DealCard |
| Afgewezen | ✅ | Red badge |
| Tegenvoorstel | ✅ | Sky badge |
| Geannuleerd | ✅ | Gray badge |
| **Bekeken** | ❌ | Geen read receipt |

### 6.2 DealCard / CommunityOrder

| Status | Zichtbaar |
|--------|-----------|
| Deal actief (OPEN) | ✅ CTA via `deal-ux-state` |
| Betaling nodig | ✅ “Betaal via HomeCheff” |
| Value-only / ruil af te ronden | ✅ Copy + mark complete |
| Afgerond (COMPLETED) | ✅ Review CTA |
| Bezorging | ✅ Delivery request status |

### 6.3 Chat system messages

| Event | Zichtbaar |
|-------|-----------|
| Proposal accepted/rejected/cancelled | ✅ `PROPOSAL_SYSTEM` banners |
| CommunityOrder created | ✅ System message |
| System labels NL hardcoded | 🟡 EN gap (`ChatThreadMessageRow`) |

---

## 7. Dead-end audit

| Situatie | Dead end? | Post 5E-E |
|----------|-----------|-----------|
| BARTER_ONLY + sticky | Was: scroll + tap | **Opgelost** |
| Suggestie Start gesprek | Was: `messages?user=` zonder handler | **Opgelost** |
| MONEY + chat “vraag stellen” | Geen proposal | ✅ Copy aligned (5E-D) |
| BARTER_ONLY + cart | Server blocked | ✅ |
| Suggestie zonder login | Module hidden | Bestaand |
| Proposal zonder PRODUCT context | Leeg sheet | Alleen algemene gesprekken |
| `/messages?user=` (profiel/admin links) | **Nog steeds** | P2 — buiten exchange scope |

---

## 8. Reuse audit

### 8.1 Hergebruikt in 5E-E

| Component / lib | Gebruik |
|-----------------|---------|
| `StartChatButton` | Sticky, suggestie CTA, detail proposal (via MakerContactSection) |
| `skipModal` + `openProposalAfterStart` | Gestandaardiseerde direct-start props |
| `buildMessagesConversationUrl` | Conversation navigate |
| `buildMessagesWithProposalOpenUrl` | Proposal deep-link |
| `ExchangeSuggestionCardView` | Desktop + mobiel + sidebar + profiel |
| `resolveConversationHeader` | Chat + CreateProposalSheet prefill |
| `POST /api/conversations/start` | Alle product-bound starts |

### 8.2 Niet opnieuw bouwen

- Proposal / CommunityOrder modellen
- CreateProposalSheet / ProposalCard / DealCard
- Matching / suggestion resolver
- Nieuwe chat routes of conversation types
- Parallelle CTA-systemen

### 8.3 Dubbelbouw-risico

| Risico | Mitigatie |
|--------|-----------|
| Tweede “start chat from suggestion” component | `StartChatButton` hergebruikt |
| Custom sticky proposal logic | Zelfde props als `ProductSaleProposalAction` |
| Nieuwe query params | Alleen `openProposal` + bestaande `conversation` |

---

## 9. P0 problemen

*Geen open P0 na 5E-E.* (Sticky + suggestie context opgelost.)

---

## 10. P1 verbeteringen

| # | Item |
|---|------|
| P1-1 | `messages?user=` handler voor profiel/admin links (algemeen messaging) |
| P1-2 | Auto-open proposal na suggestie-gesprek (optioneel `openProposal` op suggestion start) |
| P1-3 | Niet-ingelogde exchange discovery (onboarding) |
| P1-4 | EN i18n chat system labels |

---

## 11. P2 polish

| # | Item |
|---|------|
| P2-1 | MONEY_AND_BARTER: secundaire proposal-knop op sticky (zonder redesign: long-press?) |
| P2-2 | Proposal “bekeken” indicator |
| P2-3 | Prominentere ClipboardList in chat |
| P2-4 | Prefill `requestedValueTaxonomyIds` from viewer listings bij mutual match |
| P2-5 | Feed insert: optionele “Start gesprek” naast listing link |

---

## 12. Aanbevolen volgende fase (5E-F)

**Exchange onboarding & edge QA** — geen nieuwe commerce:

1. Fix globale `messages?user=` routing (bestaande `start-seller` API)
2. Optionele `openProposal` op suggestion product-start
3. i18n sweep chat system messages
4. E2E smoke script: BARTER_ONLY happy path (API-level, geen Playwright verplicht)

---

## 13. Conclusie — kernvragen

| Vraag | Antwoord |
|-------|----------|
| **Is mobiele proposal-flow gelijkwaardig aan desktop?** | **Ja voor BARTER_ONLY** (1 tap sticky = zelfde deep-link als desktop CTA). **Gedeeltelijk voor MONEY_AND_BARTER** — sticky blijft checkout-first. |
| **Is productcontext overal behouden?** | **Ja** op detail → chat → proposal → order. **Ja** op suggestie → gesprek (via `counterpartyListingId`). Desired exchanges alleen op detail UI, niet in proposal prefill. |
| **Verborgen proposal-entrypoints?** | Alleen ClipboardList als fallback; geen nieuwe verborgen paden. |
| **Onnodige extra taps?** | Sticky scroll-tap **verwijderd** voor BARTER_ONLY. MONEY_AND_BARTER proposal nog via scroll. |
| **Dead ends?** | Suggestie `messages?user=` **opgelost**. Profiel `messages?user=` nog open (buiten exchange). |
| **Grootste resterende conversielek?** | **MONEY_AND_BARTER mobiel:** proposal alleen via scroll + commerce zone. Secundair: suggestie → proposal vereist extra stap. |
| **Wat mag niet opnieuw gebouwd worden?** | Proposal stack, CommunityOrder/checkout, matching, StartChatButton/ChatBox architectuur, exchange suggestion resolver, deep-link contract. |

---

## 14. Implementatie 5E-E (code)

| Bestand | Wijziging |
|---------|-----------|
| `ProductSaleStickyCta.tsx` | `StartChatButton` met `skipModal` + `openProposalAfterStart` |
| `StartChatButton.tsx` | `skipModal` prop; `buildMessagesConversationUrl` |
| `ExchangeSuggestionCard.tsx` | `StartChatButton` i.p.v. `messages?user=` link |
| `proposal-deep-link.ts` | `buildMessagesConversationUrl` helper |
| `validate-marketplace-exchange-proposal-conversion.ts` | 5E-E checks uitgebreid |

---

## 15. Validatiestatus

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | *(CI-run)* |
| `npm run build` | *(CI-run)* |
| `npm run smoke-check` | *(CI-run)* |
| `validate-marketplace-taxonomy-consolidation` | bestaand |
| `validate-marketplace-detail-system` | bestaand |
| `validate-marketplace-barter-openness-wiring` | bestaand |
| `validate-marketplace-exchange-commerce-alignment` | bestaand |
| `validate-marketplace-exchange-proposal-conversion` | uitgebreid (5E-E) |
