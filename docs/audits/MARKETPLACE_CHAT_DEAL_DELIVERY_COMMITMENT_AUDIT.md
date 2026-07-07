# Marketplace Chat Deal Delivery & Commitment Audit (Phase 5G-A)

**Date:** 2026-07-07  
**Scope:** Audit + implementation plan only — no feature code changes.  
**Method:** Static trace of proposal → CommunityOrder → delivery → dashboards; reuse inventory from Phase 5F-B.

**Related:** [MARKETPLACE_OPERATIONS_FULFILLMENT_DELIVERY_AFFILIATE_SUBSCRIPTION_AUDIT.md](./MARKETPLACE_OPERATIONS_FULFILLMENT_DELIVERY_AFFILIATE_SUBSCRIPTION_AUDIT.md), [MARKETPLACE_TRANSACTION_SCENARIO_QA.md](./MARKETPLACE_TRANSACTION_SCENARIO_QA.md)

---

## 1. Executive summary

The **chat/proposal/deal stack is already the intended source of truth** for community transactions. `ProposalService.acceptProposal` freezes terms into `Agreement.agreementSummary`, creates `CommunityOrder`, and routes next actions via `deal-ux-state.ts`. **Delivery is already payment-independent at the service layer** — `DeliveryRequestService` has no Stripe/checkout references and gates only on `fulfillmentMode === 'DELIVERY'` + `deliveryRequested`.

**What works today**

- Proposal create with settlement, payment path, fulfillment (pickup/delivery), schedule hints.
- Accept → Agreement snapshot + CommunityOrder + optional auto-`DeliveryRequest` when addresses + schedule exist.
- `DealCard` CTAs for pay (HomeCheff), discuss payment (direct), request delivery, mark complete, review.
- Copy for payment paths and deal status in `deal.*` / `proposal.*` i18n.

**Critical gaps for Phase 5G**

| Gap | Impact |
|-----|--------|
| **No courier UI for `DeliveryRequest`** | Delivery can be requested but not fulfilled in-app |
| **No list/queue API for community jobs** | Couriers cannot discover open requests |
| **Assignment requires buyer/seller** | Courier cannot self-claim; `assign` API needs `courierId` from party |
| **No deal commitment checkbox** | Accept is one tap — no explicit “afspraak nakomen” acknowledgement |
| **No direct-contact risk copy in deal flow** | Listing form has hints; chat/deal does not warn “eigen risico” |
| **HomeCheff payment not visually “recommended”** | Default preselect yes; no badge/hint hierarchy in `CreateProposalSheet` |
| **`DelivererSelector` unwired** | Location-based courier suggestions exist but unused |
| **Dashboards omit delivery on deals list** | `/profile/deals` has no delivery status; seller dashboard ignores CommunityOrders |

**Smallest safe MVP (recommended):**

1. Commitment micro-copy + optional checkbox on **proposal accept** (not new models).
2. Payment recommendation copy in **CreateProposalSheet** + **DealCard** (i18n only).
3. **Extend `DeliveryDashboard`** with “Community bezorgingen” tab + thin **list API** for open `DeliveryRequest`s.
4. **Courier claim flow** — either wire `DelivererSelector` → `assign` from `DealCard`, or add `claim` endpoint mirroring teen first-accept (reuse `CourierAssignment` create).
5. Reuse existing `accept` / `complete` APIs from courier tab.

---

## 2. Chat/deal afspraakbron

### 2.1 Accept flow (source of truth)

```
Chat → CreateProposalSheet → POST /api/conversations/[id]/proposals
  → Proposal (PENDING)
  → ProposalCard accept → ProposalService.acceptProposal
       → Agreement (frozen agreementSummary)
       → CommunityOrder (OPEN)
       → optional DeliveryRequest (auto if delivery + addresses + schedule)
       → DealCard in chat
```

**Key files:** `lib/proposals/proposal-service.ts`, `lib/proposals/proposal-settlement.ts`, `lib/proposals/deal-ux-state.ts`, `components/chat/proposals/DealCard.tsx`, `components/chat/ChatBox.tsx`

### 2.2 Data captured at accept

| Field | Stored where | Present? |
|-------|--------------|----------|
| What is delivered (title, description) | `Proposal` + `agreementSummary.title` | ✅ |
| Price | `Proposal.amountCents` + snapshot | ✅ |
| Ruilwaarde | `acceptedValueTaxonomyIds`, `requestedValueTaxonomyIds` in snapshot | ✅ |
| Betaalmethode | `agreementSummary.paymentPath` (`HOMECHEFF_CHECKOUT` / `DIRECT_CONTACT` / `NONE`) | ✅ |
| Settlement | `settlementMode` in snapshot | ✅ |
| Lever-/ophaalafspraak | `Proposal.requestedDate`, `requestedTimeWindow`, `fulfillmentType` | ✅ partial |
| `conversationId` | `CommunityOrder.conversationId` | ✅ |
| `buyerId` / `sellerId` | `CommunityOrder` | ✅ |
| `listingId` / `productId` | `Proposal.productId`, `listingId` (optional) | ✅ if product-linked |
| Status | `CommunityOrder.status` (`OPEN` / `COMPLETED` / `CANCELLED`) | ✅ |
| Stripe link | `CommunityOrder.checkoutOrderId` | ✅ when paid via HomeCheff |
| Pickup/delivery addresses | **Not on accept** — derived from user profiles at `DeliveryRequest` create | ⚠️ |
| Explicit commitment timestamp | — | ❌ |
| Per-deal terms acceptance | — | ❌ (only global `User.termsAccepted` at register) |

### 2.3 Agreement snapshot shape

`AgreementSummarySnapshot` (`lib/proposals/proposal-settlement.ts`) freezes at accept:

- `settlementMode`, `amountCents`, `currency`
- `acceptedValueTaxonomyIds`, `requestedValueTaxonomyIds`
- `title`, `quantity`, `fulfillmentType`, `paymentPath`, `priceModel`, `productId`
- `acceptedById`, `acceptedAt`, `proposalId`

Listing edits after accept do **not** alter the deal — correct for binding terms.

### 2.4 Missing for a fully binding afspraak

| Missing | Severity | Notes |
|---------|----------|-------|
| Structured delivery/pickup addresses on proposal | P1 | Uses profile addresses when requesting delivery; no per-deal override UI |
| Commitment acknowledgement | P0 | No checkbox or explicit consent on accept |
| Direct-payment risk acknowledgement | P1 | No “eigen risico” in deal UI |
| Cancel flow for CommunityOrder | P2 | `CANCELLED` status exists; no user-facing cancel API found |
| Dispute/report tied to CommunityOrder | P2 | Admin disputes exist for orders; deal-specific report path unclear |

---

## 3. Payment choice analyse

### 3.1 Where payment path is chosen

| Stage | UI | Logic |
|-------|-----|-------|
| Listing create | `MarketplaceOfferForm` checkboxes | `acceptHomeCheffPayment`, `acceptDirectContact`, `orderMethod` |
| Chat proposal | `CreateProposalSheet` | `paymentPath` when money leg + product; filtered by `product.acceptHomeCheffPayment` / `acceptDirectContact` |
| Default | `resolveConversationHeader` | `HOMECHEFF_CHECKOUT` if `canHomeCheffCheckout`, else `DIRECT_CONTACT` if allowed |
| After accept | `DealCard`, `ProposalCard` | Read-only `paymentPathFromSummary(proposal.proposalSummary)` |

### 3.2 Payment path matrix

| Path | When available | Creates `Order`? | Delivery? |
|------|----------------|------------------|-----------|
| `HOMECHEFF_CHECKOUT` | Product + Stripe-ready seller + money leg | ✅ after checkout | ✅ teen via Stripe; community via `DeliveryRequest` |
| `DIRECT_CONTACT` | `acceptDirectContact` or `orderMethod: CONTACT` | ❌ | ✅ if `fulfillmentType: DELIVERY` |
| `NONE` | Barter / free / voluntary | ❌ | ✅ if delivery selected |

### 3.3 Visibility assessment

| Question | Answer |
|----------|--------|
| Visible in CreateProposalSheet? | ✅ Yes — “Hoe betaal je?” when money + product |
| Visible after accept in DealCard? | ✅ Yes — `deal.paymentPath.*` |
| HomeCheff advised without hiding direct? | ⚠️ **Partial** — default preselects HomeCheff when possible; both options shown as equal buttons; no “aanbevolen” badge or risk line for direct |
| Copy advises HomeCheff security? | ⚠️ `deal.nextStep.payHomecheff` / `proposal.nextAction.checkoutRequired` exist; not shown until after accept |

### 3.4 Recommendation for wiring (no new models)

| Surface | Change |
|---------|--------|
| `CreateProposalSheet` | Add hint under payment buttons: HomeCheff = aanbevolen; direct = onderling regelen |
| `ProposalCard` (pre-accept) | Show `marketplace.payment.homecheffDescription` / `directContactDescription` when money path visible |
| `DealCard` | When `DIRECT_CONTACT` + unpaid money leg, show risk line (new i18n key) |

---

## 4. Direct contact / cash risico-copy

### 4.1 Existing copy

| Key | Location | Content (NL) |
|-----|----------|--------------|
| `marketplace.payment.homecheffDescription` | Listing form | “Veilig online afrekenen via HomeCheff (Stripe).” |
| `marketplace.payment.directContactDescription` | Listing form | “Prijs en betaling regel je in gesprek…” |
| `deal.nextStep.discussPayment` | DealCard | “Spreek met elkaar af hoe en wanneer je betaalt.” |
| `deal.paymentPath.direct` | DealCard | “Direct contact / regeling” |

### 4.2 Missing copy (user-requested tone)

| Intended message | Exists? |
|------------------|---------|
| “Ik begrijp dat ik deze afspraak moet nakomen.” | ❌ |
| “Betaal via HomeCheff voor extra zekerheid.” | ⚠️ Similar in `deal.nextStep.payHomecheff` |
| “Spreek je buiten HomeCheff af? Dan regel je betaling onderling.” | ❌ |
| Explicit “eigen risico” for direct payment | ❌ |

### 4.3 Minimal i18n additions (implementation plan)

Proposed keys under `deal.commitment.*`:

```json
{
  "deal.commitment.acceptLabel": "Ik begrijp dat ik deze afspraak moet nakomen.",
  "deal.commitment.homecheffHint": "Betaal via HomeCheff voor extra zekerheid.",
  "deal.commitment.directRisk": "Spreek je buiten HomeCheff af? Dan regel je betaling onderling — op eigen risico."
}
```

---

## 5. Commitment checkbox analyse

### 5.1 Existing acceptance patterns

| Pattern | Where | Applies to deals? |
|---------|-------|-------------------|
| `termsAccepted` on register | `app/api/auth/register` | ❌ Global account only |
| Affiliate `acceptTerms` | `/api/affiliate/signup` | ❌ Affiliate only |
| Proposal accept button | `ProposalCard` — no checkbox | ❌ |
| Deal complete | `DealCard` → mark complete | ❌ No re-confirm |

### 5.2 Recommended minimal wiring

| Step | Component | Behaviour |
|------|-----------|-----------|
| 1 | `ProposalCard` | Checkbox required before “Accepteren” when `status === PENDING` |
| 2 | `POST /api/proposals/[id]/accept` | Optional: reject if `commitmentAccepted !== true` (server gate) |
| 3 | `Agreement` | Optional: store `commitmentAcceptedAt` in `agreementSummary` JSON (no schema migration) |

**No new models.** Extend snapshot JSON only if audit trail needed.

---

## 6. Delivery assignment analyse

### 6.1 Payment independence — confirmed

`DeliveryRequestService` (`lib/delivery/delivery-request-service.ts`):

- **No** `checkoutOrderId`, Stripe, or `paymentPath` checks.
- Gates: `fulfillmentMode === 'DELIVERY'`, `deliveryRequested === true`, party authorization.
- Works for **all** CommunityOrder payment paths when proposal had `fulfillmentType: DELIVERY`.

### 6.2 Model support matrix

| Order type | Delivery mechanism | Payment coupled? | UI today |
|------------|-------------------|------------------|----------|
| Stripe `Order` + teen delivery | `DeliveryOrder` | Created in webhook after pay | ✅ `/delivery/dashboard` |
| CommunityOrder + `HOMECHEFF_CHECKOUT` | `DeliveryRequest` | ❌ Independent | ⚠️ DealCard request only |
| CommunityOrder + `DIRECT_CONTACT` | `DeliveryRequest` | ❌ Independent | ⚠️ Same |
| CommunityOrder + barter (`NONE`) | `DeliveryRequest` | ❌ Independent | ⚠️ Same |
| Cart checkout (no deal) | `DeliveryOrder` | Tied to Stripe order | ✅ Checkout + dashboard |

**`DeliveryOrder` is not the right reuse target for community deals** — separate model by design (schema comment). **`DeliveryRequest` is the central community delivery layer.**

### 6.3 Community delivery lifecycle (coded)

```
accept (fulfillmentType=DELIVERY)
  → CommunityOrder.deliveryRequested=true
  → tryAutoCreateAfterAccept (if buyer+seller addresses + schedule)
     OR DealCard REQUEST_DELIVERY → POST /api/community-orders/[id]/delivery-request
  → DeliveryRequest OPEN
  → POST /api/delivery-requests/[id]/assign { courierId }  (buyer or seller only)
  → CourierAssignment PENDING, status CLAIMED
  → POST /api/delivery-requests/[id]/accept  (courier)
  → ACCEPTED
  → POST /api/delivery-requests/[id]/complete  (courier or party)
  → COMPLETED → review at /delivery-review/[id]
```

### 6.4 UI gaps

| Gap | Detail |
|-----|--------|
| No open-request list for couriers | Only `GET /api/delivery-requests/[id]` — no collection endpoint |
| `DeliveryDashboard` | Tabs: teen `DeliveryOrder` only (`delivery` \| `orders` for sellers) |
| `assign` needs `courierId` | Party must pick courier — no picker wired |
| `VIEW_DELIVERY` CTA | `href: null` — toggles inline details only |
| Courier name in DealCard | Shows “Bezorger toegewezen” but not courier identity in DTO |

### 6.5 Can DeliveryDashboard be extended?

**Yes — recommended approach.**

| Addition | Reuse |
|----------|-------|
| Tab “Community bezorgingen” | `DeliveryDashboard.tsx` tab pattern (already has `delivery` \| `orders`) |
| Fetch open requests | **New** `GET /api/delivery/community-requests` or extend `/api/delivery/dashboard` |
| Accept job | `DeliveryRequestService.acceptAssignment` via existing route |
| Complete job | `completeDelivery` via existing route |
| Status updates | Mirror teen delivery card UX |

Same ambassador `DeliveryProfile` — `assignCourier` already validates `deliveryProfile.isActive`.

---

## 7. Bezorger vooraf kiezen / reserveren

### 7.1 Inventory

| Asset | Status | Capability |
|-------|--------|------------|
| `DelivererSelector.tsx` | Built, **zero imports** | Calls `GET /api/delivery/match-deliverers` with productId + buyer lat/lng |
| `match-deliverers` | ✅ Active API | Distance/route matching via `DeliveryProfile`, geolib, Google Maps |
| `match-orders` | Orphan | No UI |
| `assign-order` | Orphan | No UI |
| `CourierScheduleService` | Orphan | 14-day schedule aggregation |
| `CourierAvailability` | Orphan model + service | No routes |
| `DeliveryProfile.availableDays/TimeSlots` | ✅ Used | Shift notification cron only |
| `schedule-shift-notifications` | ✅ Scheduled | Reminds couriers of roster — not buyer-facing |

### 7.2 Questions answered

| Question | Answer |
|----------|--------|
| Can buyer/seller pre-select courier today? | **No** — UI not wired |
| Location-based suggestions? | **API yes** (`match-deliverers`); **UI no** |
| Roster/availability for matching? | **Not in matching** — cron notifications only |
| Smallest safe connection? | Wire `DelivererSelector` in `DealCard` at `REQUEST_DELIVERY` or delivery request modal → `POST assign` with selected `courierId` |

### 7.3 Alternative: courier self-claim (teen parity)

Teen delivery uses **first-accept** on `DeliveryOrder` without prior assign. Community stack requires **assign then accept**. For MVP parity, consider:

- `POST /api/delivery-requests/[id]/claim` — courier with active profile creates `CourierAssignment` on OPEN request (new thin route wrapping service logic).

**Reuse:** `CourierAssignment` model, notification helpers, `DeliveryDashboard` accept button pattern.

**Do not rebuild** `DelivererSelector` or `match-deliverers`.

---

## 8. Courier dashboard voor CommunityOrders

### 8.1 Current dashboard

- **Route:** `/delivery/dashboard` → `DeliveryDashboard.tsx`
- **API:** `GET /api/delivery/dashboard` — `DeliveryOrder` for ambassadors; seller stats if seller
- **Actions:** accept, update-status on `DeliveryOrder`
- **No** `DeliveryRequest` queries

### 8.2 Minimal MVP spec

| # | Task | Effort |
|---|------|--------|
| 1 | Add `communityRequests: DeliveryRequestDTO[]` to dashboard API (OPEN + unassigned, filter by courier region) | S |
| 2 | New tab in `DeliveryDashboard` when `deliveryProfile` exists | S |
| 3 | List cards: pickup/delivery address, time window, deal title (join Proposal) | S |
| 4 | “Accepteren” → claim or accept flow per §7.3 | M |
| 5 | Status steps: ophalen → onderweg → afgeleverd → `complete` | M |
| 6 | Push via existing `notify-delivery-request.ts` | ✅ Already wired |

**No new dashboard app** — extend existing.

---

## 9. Seller/buyer dashboard impact

### 9.1 Current state

| Surface | Sees CommunityOrder? | Sees delivery status? |
|---------|---------------------|----------------------|
| `/verkoper/dashboard` | ❌ | ❌ |
| `/verkoper/orders` | ❌ (Stripe only) | Teen only via delivery links |
| `/profile/deals` | ✅ | ❌ — title, counterpart, status, chat link only |
| `/orders` (buyer) | ❌ | Stripe orders only |
| Chat `DealCard` | ✅ | ✅ read-only status + request CTA |

### 9.2 Questions answered

| Question | Answer |
|----------|--------|
| Seller sees CO delivery status? | **Only in chat** DealCard |
| Buyer sees delivery status? | **Only in chat** |
| Can delivery be requested after accept? | ✅ `REQUEST_DELIVERY` CTA when `deliveryRequested && !deliveryRequest` |
| Can user see who delivers? | ⚠️ `deliveryAssigned` flag + “Bezorger toegewezen” — no name in UI |

### 9.3 Minimal dashboard improvements (P1)

- Add `deliveryStatus` + `deliveryRequestId` to `/api/profile/deals` response.
- Show badge on deals list rows; deep-link to conversation.
- Optional: strip on `/verkoper/dashboard` “Open afspraken” count (read-only, no new model).

---

## 10. Trust, dispute en risico

### 10.1 What exists

| Mechanism | Scope | Path |
|-----------|-------|------|
| Mark deal complete | CommunityOrder | `POST /api/community-orders/[id]/complete` |
| Deal review | After COMPLETED | `/deal-review/[id]` |
| Delivery review | After delivery COMPLETED | `/delivery-review/[id]` |
| Trust profile | Aggregates | `lib/trust/profile-trust-summary.ts` |
| Admin disputes | Orders/reports | `DisputeResolution.tsx` — not deal-specific UI |
| Stripe chargeback | Paid orders | Webhook `charge.dispute.created` |
| Affiliate reversal | Refunds | `processCommissionReversal` |

### 10.2 Scenario matrix

| Scenario | Outside HomeCheff pay | Via HomeCheff pay |
|----------|----------------------|-------------------|
| Seller doesn’t deliver | Chat + mark incomplete; review; report user; **no payment hold** | Stripe dispute/refund path; platform may assist |
| Buyer doesn’t pay | Discuss in chat; no platform lever | N/A — paid at checkout |
| No-show pickup | Chat coordination; trust review | Same + possible refund if prepaid |
| Failed delivery | `DeliveryRequest` status stuck; review courier | Teen: delivery warnings cron (orphan); community: manual complete |

### 10.3 Missing user-facing copy

| Gap | Suggested placement |
|-----|---------------------|
| What HomeCheff does / doesn’t guarantee for direct pay | `DealCard` when `DIRECT_CONTACT` |
| How to report a problem | Link to existing report flow from DealCard footer |
| Cancel deal | No UI — P2 |

---

## 11. Reuse audit

| Component | Reuse for 5G | Do not rebuild |
|-----------|--------------|----------------|
| `ProposalService.acceptProposal` | Keep as deal creation hub | ✅ |
| `Agreement` + `agreementSummary` | Commitment timestamp in JSON | ✅ |
| `DealCard` + `deal-ux-state.ts` | Payment hints, delivery CTAs, DelivererSelector hook | ✅ |
| `CreateProposalSheet` | Payment recommendation copy | ✅ |
| `DeliveryRequestService` | Full community delivery lifecycle | ✅ |
| `DelivererSelector` + `match-deliverers` | Pre-assign courier | ✅ |
| `DeliveryDashboard.tsx` | Community tab | ✅ |
| `/api/delivery-requests/[id]/*` | accept, assign, complete | ✅ |
| `notify-delivery-request.ts` | Notifications | ✅ |
| `DeliveryOrder` stack | Stripe teen delivery only — **not** for community | Separate concern |
| `CourierScheduleService` | Phase 2 — roster UI | Later |

---

## 12. P0 blockers

| # | Blocker |
|---|---------|
| P0-1 | Community delivery cannot complete — no courier queue UI |
| P0-2 | No explicit commitment on accept — weak social contract |
| P0-3 | Direct payment path lacks risk messaging in deal UI |
| P0-4 | No API to list open `DeliveryRequest`s for couriers |

---

## 13. P1 verbeteringen

| # | Improvement |
|---|-------------|
| P1-1 | Wire `DelivererSelector` → `assign` on delivery request |
| P1-2 | Delivery status on `/profile/deals` |
| P1-3 | HomeCheff “aanbevolen” visual hierarchy in proposal sheet |
| P1-4 | Show courier name on DealCard when assigned |
| P1-5 | Per-deal address override before delivery request |
| P1-6 | Seller dashboard strip for open CommunityOrders |
| P1-7 | Validator script for delivery-request lifecycle wiring |

---

## 14. Aanbevolen implementatievolgorde

### Phase 5G-B — Commitment & copy (1–2 days)

1. Add `deal.commitment.*` i18n keys (NL + EN).
2. Checkbox on `ProposalCard` accept + optional server gate.
3. `CreateProposalSheet`: HomeCheff recommended badge + direct risk hint.
4. `DealCard`: show `directRisk` when `DIRECT_CONTACT` + money leg unpaid.

### Phase 5G-C — Community courier MVP (3–5 days)

1. `GET /api/delivery/community-requests` (or extend dashboard GET) — OPEN requests for active couriers.
2. `DeliveryDashboard` tab “Community bezorgingen”.
3. Courier **claim** endpoint OR wire `DelivererSelector` on party side → `assign`.
4. Wire `accept` + `complete` buttons in dashboard.
5. DealCard: show courier first name when `activeAssignment` present.

### Phase 5G-D — Dashboard parity (2 days)

1. Extend `/api/profile/deals` with delivery fields.
2. Deals list badges + link to chat.
3. Optional verkoper dashboard “open afspraken” count.

### Phase 5G-E — Hardening

1. `scripts/validate-community-delivery-wiring.ts`
2. Manual QA: barter + direct + Stripe deal each with delivery request
3. Analytics events: `delivery_request_created`, `courier_assigned`, `delivery_completed`

---

## Succescriteria — expliciete antwoorden

| Vraag | Antwoord |
|-------|----------|
| **Kan bezorging los van Stripe werken?** | **Ja — service layer already does.** `DeliveryRequestService` is payment-agnostic. Gap is UI + courier queue only. |
| **Kan iedere CommunityOrder een bezorger krijgen?** | **Alleen als** `fulfillmentType: DELIVERY` was set in proposal (→ `deliveryRequested`). Pickup/barter without delivery flag: N/A. With flag: request works; assign/complete blocked by missing UI. |
| **Kan een bezorger vooraf gekozen worden?** | **Niet today.** `DelivererSelector` + `match-deliverers` ready; smallest wire: DealCard delivery flow → assign. |
| **Kan locatie/beschikbaarheid gebruikt worden?** | **Locatie: ja** via `match-deliverers`. **Roster: nee** in matching (cron only). **CourierAvailability: orphan.** |
| **Welke componenten hergebruiken?** | `DealCard`, `deal-ux-state`, `DeliveryRequestService`, `DeliveryDashboard`, `DelivererSelector`, `match-deliverers`, assignment APIs, existing i18n namespaces. |
| **Waar commitment-copy?** | `ProposalCard` accept (checkbox); optional echo in `DealCard` header after accept. |
| **Waar HomeCheff betaling aanbevelen?** | `CreateProposalSheet` payment section (pre-send); `DealCard` / `deal.nextStep` when `HOMECHEFF_CHECKOUT` + unpaid. |
| **Waar rechtstreeks contact toestaan?** | Keep in `CreateProposalSheet` when `acceptDirectContact`; show risk copy in `ProposalCard` + `DealCard` — never remove option. |
| **Kleinste veilige MVP?** | (1) Commitment checkbox + copy, (2) community tab on existing dashboard + list API, (3) claim or assign-from-`DelivererSelector`, (4) reuse accept/complete APIs. **No new models.** |

---

## Validatie

### Build pipeline (2026-07-07)

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ Pass |
| `npm run build` | ✅ Pass |
| `npm run smoke-check` | ✅ Pass |

### Marketplace / proposal validators

| Script | Result |
|--------|--------|
| `validate-marketplace-barter-openness-wiring` | 18/18 |
| `validate-marketplace-detail-system` | 182/182 |
| `validate-marketplace-exchange-commerce-alignment` | 17/17 |
| `validate-marketplace-exchange-proposal-conversion` | 30/30 |
| `validate-marketplace-preview-ux` | 38/38 |
| `validate-marketplace-previews` | 104/104 |
| `validate-marketplace-taxonomy-consolidation` | ✅ Pass |
| `validate-marketplace-tile-system` | 90/90 |
| `validate-exchange-funnel-analytics` | 13/13 |
| `validate-exchange-foundation` | 50/50 |
| `validate-exchange-suggestions` | 124/124 |

**Combined:** ~666 checks passed, 0 failed.

### Missing validator coverage

| Area | Validator |
|------|-----------|
| DeliveryRequest lifecycle | ❌ None |
| Deal commitment / payment copy wiring | ❌ None |
| Courier dashboard community tab | ❌ None |
| DelivererSelector integration | ❌ None |

---

*Audit complete. No application code was modified.*
