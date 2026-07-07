# Marketplace Proposal Flow Audit — Phase 5E-C

Read-only audit of proposal UX after Phase 5E-C (counter expansion, exchange-to-proposal, prefill, summary, validation, analytics).

---

## 1. Counterable proposal fields

| Field | Create | Counter | API (`CounterProposalInput`) |
|-------|--------|---------|------------------------------|
| Title | ✓ | ✓ | ✓ |
| Description | ✓ | ✓ | ✓ |
| Amount (cents) | ✓ | ✓ | ✓ |
| Settlement mode | ✓ | ✓ | ✓ |
| Accepted value taxonomy IDs | ✓ | ✓ | ✓ |
| Requested value taxonomy IDs | ✓ | ✓ | ✓ |
| Quantity | ✓ | ✓ | ✓ |
| Requested date / time window | ✓ | ✓ | ✓ |
| Fulfillment type | ✓ | ✓ | ✓ |
| Payment path | ✓ | ✓ (if product-bound) | ✓ |

**Before 5E-C:** Counter UI exposed primarily amount + message.  
**After 5E-C:** `CounterProposalForm` mirrors create flow via shared `ProposalFieldsSection`.

Server-side `ProposalService.counterProposal` already accepted full payloads; the gap was UI-only.

---

## 2. Exchange surfaces → ProposalSheet

| Surface | CTA | Mechanism |
|---------|-----|-----------|
| Product detail — exchange suggestions block | `start_proposal` | `ExchangeSuggestionCardView` → `StartChatButton` |
| Profile — exchange suggestions module | `start_proposal` | Same shared card |
| Sidebar exchange suggestions | `start_proposal` | Same shared card |
| Feed exchange inserts | `start_proposal` | Same shared card (when CTA allowed) |
| Mobile exchange module | `start_proposal` | `ExchangeSuggestionsMobileModule` → shared card |
| Product listing page | Proposal CTA | `ProductSaleProposalAction` / sticky CTA (existing) |
| Chat — counter on card | Counter sheet | `ProposalCard` → `CounterProposalForm` |

**Not added in 5E-C:** Tile-level proposal CTAs (explicitly out of scope).

---

## 3. Prefill rules (`resolveProposalPrefill`)

| Source | Rules |
|--------|-------|
| `listing` | Title, price → amount, fulfillment default from product delivery/options, settlement from `deriveSettlementModeFromProduct` clamped by `allowedSettlementModesForBarterOpenness`, accepted specializations → accepted values, default payment path |
| `exchange_suggestion` | All listing rules on counterparty listing + counterparty title fallback + overlap taxonomy IDs merged into requested values; if settlement was `MONEY` and overlap exists → upgrade to `MONEY_AND_VALUE` |
| `counter` | Clone parent proposal fields (settlement, amounts, taxonomy, fulfillment, payment path from summary) |
| `conversation` | Same as listing when header is `PRODUCT`; otherwise empty form defaults |

**No guessing:** Prefill never invents taxonomy IDs beyond listing accepted values and match overlap from `overlapTaxonomyIds` on suggestion cards.

Session bridge: `storeProposalPrefill` / `consumeProposalPrefill` in `proposal-prefill-storage.ts`.

---

## 4. Active validations (`validateProposalReadiness`)

| Check | Error key |
|-------|-----------|
| User authenticated | `proposal.errors.authRequired` |
| Non-empty title | `marketplace.errors.titleDescriptionRequired` |
| Settlement vs amount/values | `proposal.errors.moneyAmountRequired`, `proposal.errors.valueRequired` |
| Listing inactive | `proposal.errors.listingInactive` |
| Settlement vs barter openness | `proposal.errors.settlementNotAllowed` |
| Stock exceeded / out of stock | `proposal.productBinding.exceedsStock`, `proposal.productBinding.outOfStock` |
| HomeCheff checkout unavailable | `proposal.errors.checkoutNotAvailable` |
| Invalid taxonomy IDs (normalize mismatch) | `proposal.errors.invalidAcceptedValues`, `proposal.errors.invalidRequestedValues` |

Server remains authoritative via `ProposalService`, `validateSettlementAgainstBarterOpenness`, and product binding helpers.

---

## 5. E2E validator scenarios

`scripts/validate-marketplace-proposal-flow.ts`:

| # | Scenario | What is verified |
|---|----------|------------------|
| 1 | Listing → proposal → accept → deal | Money readiness + create/accept API wiring + commitment |
| 2 | Listing → counter → accept | Counter prefill + full counter UI + counter API |
| 3 | Exchange suggestion → proposal | Prefill overlap + `start_proposal` CTA + session storage |
| 4 | Barter only | `BARTER_ONLY` → `VALUE_ONLY` + barter readiness |
| 5 | Money and barter | `MONEY_AND_VALUE` settlement + hybrid readiness |
| 6 | Delivery required | `DELIVERY` fulfillment in API payload |
| 7 | Direct contact | `DIRECT_CONTACT` payment path |
| 8 | HomeCheff checkout | Checkout payload + blocked when `canHomeCheffCheckout` false |

Additional checks: analytics event names, i18n parity (nl/en), documentation presence.

---

## Gaps / follow-ups (not 5E-C)

- **Counter without product context:** `CounterProposalForm` uses `allowedSettlementModesForBarterOpenness(null)` (all modes); server validates on submit. Stricter UI filtering would need product fetch on counter.
- **Notifications:** No push/email on proposal events (deferred).
- **DelivererSelector on profile deals:** Deferred in 5G-D.

---

## Chain coherence

```
Listing → Exchange Match → Proposal (prefill) → Counter (full fields) → Deal → Payment / Delivery → Complete
```

All settlement types in scope: MONEY, VALUE_ONLY, MONEY_AND_VALUE, FREE, VOLUNTARY — aligned with barter openness on the listing.
