# Community Economy Closed Loop Audit (Phase CE-1)

**Date:** 2026-07-07  
**Method:** Static code trace — geen aannames; alle bevindingen verwijzen naar bestanden/routes.  
**Out of scope:** nieuwe betaalmethodes, Tikkie, notifications, exchange chains, sponsored placements, ranking wijzigingen.

**Related:** [COMMUNITY_ECONOMY_PHASE1.md](../progress/COMMUNITY_ECONOMY_PHASE1.md), [MARKETPLACE_CHAT_DEAL_DELIVERY_COMMITMENT_AUDIT.md](./MARKETPLACE_CHAT_DEAL_DELIVERY_COMMITMENT_AUDIT.md)

---

## 1. Executive summary

HomeCheff heeft **alle bouwstenen** voor een gesloten buurt-economie: REQUEST-listings, SERVICE/TASK/COACHING diensten, Buurthulp-opportunities, chat-proposals, CommunityOrders, community delivery, en trust-signalen via `DiscoveryTrustContract`. De **kernlus** (vraag → voorstel → deal → afronden) werkt grotendeels in code.

**Volledig gesloten vandaag**

| Flow | Status |
|------|--------|
| REQUEST detail → proposal → deal → complete | ✅ |
| SERVICE/TASK/COACHING detail → proposal | ✅ |
| Proposal accept → CommunityOrder + Agreement | ✅ |
| Deal complete (`/api/community-orders/[id]/complete`) | ✅ |
| Community delivery claim/complete (5G-C) | ✅ |
| Trust: `completedDeals` in discovery/detail/ranking | ✅ |
| `/profile/deals` + delivery dashboard | ✅ |

**Gaten die CE-1 hebben gedicht**

| Gap | Fix |
|-----|-----|
| Buurthulp CTA → `/?chip=sale` | Registry + economy surfaces → `gezocht` feed |
| SERVICE preview alleen “bericht” | `MarketplacePreviewActions` proposal CTA |
| Deals dashboard niet in profile nav | `ProfileV2OwnerSidepanel` → `/profile/deals` |

**Open gaten (CE-2)**

| Gap | Impact |
|-----|--------|
| Geen community-order **cancel** API | Gebruiker kan open deal niet formeel annuleren |
| Proposal **prefill** alleen PRODUCT | REQUEST/SERVICE starten leeg formulier |
| Trust/value blocks **desktop-only** | Mobiele detail mist sidebar-vertrouwen |
| Verspreide schermen | Deals in chat + `/profile/deals` + delivery dashboard — geen unified hub in hoofdnav |
| `NOT_EXECUTED` status ontbreekt | Alleen OPEN / COMPLETED / CANCELLED |

---

## 2. Systeemdekking (overlap & gaten)

### 2.1 REQUEST

| Surface | Proposal CTA | Bron |
|---------|--------------|------|
| `/request/[slug]` detail | ✅ primary | `resolve-detail-actions.ts`, `detail-action-matrix.ts` (REQUEST → `request_proposal`) |
| Gezocht discovery | ✅ feed + section | `GeoFeed.tsx`, `prependGezochtDiscoverySection` |
| Tile preview | ✅ | `MarketplacePreviewActions.tsx` |
| Create flow | ✅ | `marketplace.request.actions.create` i18n + create intent |

**Geen doodlopende REQUEST-pagina's** — primary action is proposal; order CTA verborgen.

### 2.2 SERVICE / TASK / COACHING

| Surface | Proposal CTA | Opmerking |
|---------|--------------|-----------|
| Detail (`/product/...`) | ✅ | `DETAIL_ACTION_MATRIX.SERVICE/TASK/COACHING` |
| Preview sheet | ✅ (na CE-1) | `PROPOSAL_PREVIEW_KINDS` in preview actions |
| WORKSHOP | Order, geen proposal | Bewust — ticket/checkout flow |

Voorbeelden via taxonomy: `practical.childcare` (oppas), `practical.bike_repair`, `knowledge.coaching_*` — allemaal SERVICE/COACHING listing kinds met proposal matrix.

### 2.3 COMMUNITY_HELPER (Buurthulp)

| Laag | Voor CE-1 | Na CE-1 |
|------|-----------|---------|
| `community-helper-variants.ts` | ✅ `chip=gezocht` | Ongewijzigd |
| `opportunity-registry.ts` | ❌ `chip=sale` | ✅ `chip=gezocht` |
| `resolve-opportunity-economy-surfaces.ts` | ❌ negeerde variant href | ✅ `helperContract.actionHref` |

Buurthulp eindigt nu op **echte REQUEST-feed** (gezocht), niet op verkoop-chip.

### 2.4 Proposal

- Create: `CreateProposalSheet` → `POST /api/conversations/[id]/proposals`
- Accept: `ProposalService.acceptProposal` → Agreement + CommunityOrder
- Categories: `ProposalCategory` = PRODUCT | SERVICE | TASK | REQUEST
- Settlement: `SettlementMode` = MONEY | MONEY_AND_VALUE | VALUE_ONLY | FREE | VOLUNTARY
- Prefill gap: `proposal-prefill.ts:67` — `contextHeader?.kind !== 'PRODUCT'` → leeg formulier

### 2.5 Deal / CommunityOrder

- Status: `OPEN` | `COMPLETED` | `CANCELLED` (`prisma/schema.prisma`)
- UI: `DealCard.tsx`, `ProfileDealCard`, `/profile/deals`
- Complete: `lib/trust/community-order-service.ts` → `completeCommunityOrder`
- Cancel: **geen** dedicated API/route gevonden

### 2.6 Delivery

- Auto-create bij accept wanneer fulfillment = DELIVERY + adressen
- Courier: `CommunityDeliveryPanel`, claim/complete APIs (5G-C)
- Onafhankelijk van Stripe in community pad

---

## 3. CE-1.4 — Deal type inventory

| Scenario | Category | Settlement | Fulfillment | Werkt? |
|----------|----------|------------|-------------|--------|
| Product tegen geld | PRODUCT | MONEY | PICKUP/DELIVERY | ✅ Stripe checkout pad |
| Product tegen product (ruil) | PRODUCT | VALUE_ONLY / MONEY_AND_VALUE | varies | ✅ barter-commerce-alignment |
| Dienst tegen geld | SERVICE | MONEY | ON_SITE_* | ✅ proposal + deal |
| Dienst tegen dienst | SERVICE | VALUE_ONLY | ON_SITE_* | ✅ taxonomy accepted values |
| Verzoek tegen vrijwillige bijdrage | REQUEST | VOLUNTARY / FREE | varies | ✅ half — prefill leeg |
| Verzoek + bezorging | REQUEST | * | DELIVERY | ✅ delivery request na accept |

**Half ondersteund**

- VOLUNTARY/FREE settlement — werkt in proposal, beperkte prefill/copy
- DIRECT_CONTACT payment path — geen expliciete risico-copy in deal accept (5G-A audit)
- WORKSHOP — order flow, geen community proposal loop (bewust)

---

## 4. CE-1.5 — Completion flow

| Entity | Complete API | Statussen | Cancel |
|--------|--------------|-----------|--------|
| CommunityOrder | `POST .../community-orders/[id]/complete` | OPEN → COMPLETED | ❌ geen user API |
| DeliveryRequest | `POST .../delivery-requests/[id]/complete` | service-layer statuses | accept/decline flows |
| Proposal | — | PENDING/ACCEPTED/CANCELLED | proposal cancel in chat |

**Geen nieuwe workflow-engine nodig** — bestaande enums volstaan; cancel-API is de belangrijkste ontbrekende schakel.

---

## 5. CE-1.6 — Community profile signals

`DiscoveryTrustContract` (`lib/discovery/contracts/discovery-trust-contract.ts`):

- `completedDeals` — gevuld vanuit trust enrichment
- `build-tile-trust-cue.ts` — compacte tile cue (geen `UserStatsTile` op discovery)
- `detail-trust-block` — detail sidebar
- `ranking-profiles.ts` — `completedDeals` weight 0.1

**Geen nieuwe score-engine** — bestaande contracten worden gebruikt. Buurthulp zelf telt niet apart; telt mee via voltooide deals en reviews.

---

## 6. CE-1.7 — Dashboard audit

| Scherm | Route | Inhoud |
|--------|-------|--------|
| Mijn deals | `/profile/deals` | Filters open/completed/cancelled, open chat |
| Delivery (courier) | `/delivery/dashboard` | Community tab + Commerce tab |
| Chat DealCard | in conversatie | Pay, delivery, complete, review |
| Profile sidepanel | profile V2 | **+ deals link (CE-1)** |

**Dubbel werk / verspreiding**

- Deal status zichtbaar in **chat** en **`/profile/deals`** — geen single “operations hub”
- Delivery status op deals-pagina **niet** gesynchroniseerd (alleen in DealCard)
- Geen deals-link in globale hoofdnav (alleen profile sidepanel)

---

## 7. CE-1.8 — Mobile review

| Onderdeel | Mobiel | Opmerking |
|-----------|--------|-----------|
| REQUEST/SERVICE sticky CTA | ✅ | `ProductSaleStickyCta`, `mobileSticky` in matrix |
| Preview actions | ✅ | flex wrap, min-h-9 touch targets |
| Trust block in commerce zone | ⚠️ | `hidden lg:block` in `ProductSaleCommerceZone.tsx` |
| Value exchange sidebar | ⚠️ | `ProductDetailMainSections.tsx` desktop-only |
| Proposal prefill | ⚠️ | Zelfde als desktop — leeg voor non-PRODUCT |

**Geen desktop-only blockers** voor de kern-CTA (proposal starten); secundaire trust UI wel desktop-only.

---

## 8. CE-1.9 — i18n

Gecontroleerde keys (validator):

- `marketplace.request.actions.*`
- `marketplace.detail.actions.requestProposal`
- `marketplace.discovery.requests.*`
- `profile.deals.navLabel`
- `profileV2.sidepanel.community.dealsDesc`
- `trust.deals.*`
- `opportunities.economy.communityHelper.variants.*`

**en/nl parity** — validator faalt bij ontbrekende keys.

---

## 9. Gesloten vs open — matrix

| Stap | Gesloten? | Notities |
|------|-----------|----------|
| Buurthulp → REQUEST feed | ✅ | CE-1 fix |
| REQUEST → Proposal | ✅ | |
| SERVICE → Proposal (detail) | ✅ | |
| SERVICE → Proposal (preview) | ✅ | CE-1 fix |
| Proposal → Deal | ✅ | |
| Deal → Delivery | ✅ | 5G-C |
| Deal → Complete | ✅ | |
| Deal → Cancel | ❌ | CE-2 |
| Complete → Trust signal | ✅ | HCP + badges + completedDeals |
| Unified dashboard | ⚠️ | Pagina's bestaan; nav verspreid |

---

## 10. Aanbevolen volgende implementatiefase (CE-2)

**Prioriteit 1 (sluit de lus)**

1. `POST /api/community-orders/[id]/cancel` + DealCard + ProfileDealCard CTA
2. Proposal prefill voor REQUEST/SERVICE (`ResolvedConversationHeader` kinds)

**Prioriteit 2 (parity)**

3. Mobile trust/value blocks zichtbaar onder primary CTA
4. Delivery status kolom op `/profile/deals`
5. Hoofdnav entry “Mijn afspraken” (hergebruik `PROFILE_DEALS_NAV`)

**Prioriteit 3 (trust copy)**

6. DIRECT_CONTACT risico-copy bij proposal accept (i18n only, 5G-A)

---

## 11. Validatie

```bash
npx tsx scripts/validate-community-economy-loop.ts
```

Warnings (geen fail): cancel API missing, desktop-only trust blocks, non-PRODUCT prefill gap.
