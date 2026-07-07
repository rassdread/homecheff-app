# Marketplace Exchange Funnel Analytics Audit (Phase 5E-G)

**Date:** 2026-07-07  
**Scope:** Instrumentation only — no UX changes. Measures MONEY_AND_BARTER mobile checkout vs proposal discovery.

---

## 1. Events that already existed

| Event / module | Purpose |
|----------------|---------|
| `lib/marketplace/exchange-suggestions/exchange-suggestion-analytics.ts` | Suggestion impressions and CTA clicks (`exchange_suggestion_*`) on detail/profile surfaces |
| `components/GoogleAnalytics.tsx` → `trackEvent()` | Generic GA4/gtag transport used by all custom events |
| `lib/analytics-events.ts` | Typed helpers for a small set of global events (not exchange-funnel specific) |

No prior events covered the product-detail → sticky/commerce checkout → proposal sheet → checkout completion funnel for barter openness.

---

## 2. Events added (Phase 5E-G)

All names are prefixed `exchange_funnel_` and defined in `lib/marketplace/exchange/exchange-funnel-analytics.ts`.

| Key | GA4 event name |
|-----|----------------|
| `detailView` | `exchange_funnel_detail_view` |
| `stickyCheckoutClick` | `exchange_funnel_sticky_checkout_click` |
| `commerceCheckoutClick` | `exchange_funnel_commerce_checkout_click` |
| `proposalExpand` | `exchange_funnel_proposal_expand` |
| `proposalDeepLinkClick` | `exchange_funnel_proposal_deep_link_click` |
| `proposalSheetOpened` | `exchange_funnel_proposal_sheet_opened` |
| `proposalSubmitted` | `exchange_funnel_proposal_submitted` |
| `checkoutStarted` | `exchange_funnel_checkout_started` |
| `communityOrderCreated` | `exchange_funnel_community_order_created` |
| `checkoutCompleted` | `exchange_funnel_checkout_completed` |

Registry validation: `npx tsx scripts/validate-exchange-funnel-analytics.ts`

---

## 3. Where events fire

| Event | File | Trigger |
|-------|------|---------|
| `detailView` | `app/product/[id]/page.tsx` | After product payload is loaded and transformed |
| `stickyCheckoutClick` | `components/product/detail/ProductSaleStickyCta.tsx` | Sticky add-to-cart success; sticky “Ga naar afrekenen” |
| `commerceCheckoutClick` | `components/cart/AddToCartButton.tsx` | Commerce-zone add-to-cart success; commerce “Ga naar afrekenen” |
| `proposalExpand` | `components/product/detail/ProductSaleProposalAction.tsx` | Secondary proposal CTA expanded (MONEY_AND_BARTER) |
| `proposalDeepLinkClick` | `components/chat/StartChatButton.tsx` | Conversation started with `openProposalAfterStart` (commerce, sticky, suggestions) |
| `proposalSheetOpened` | `components/chat/proposals/CreateProposalSheet.tsx` | Sheet opens with product-bound conversation context |
| `proposalSubmitted` | `components/chat/proposals/CreateProposalSheet.tsx` | Successful POST to `/api/conversations/.../proposals` |
| `checkoutStarted` | `app/checkout/page.tsx` | User submits checkout form (cart or deal `communityOrderId` flow) |
| `communityOrderCreated` | `components/chat/proposals/ProposalCard.tsx` | Proposal accept returns `communityOrder` |
| `checkoutCompleted` | `app/payment/success/page.tsx` | Stripe session retrieved successfully on payment success page |

**Wiring chain (no new UI):** `ProductSalePrimaryActions` passes `exchangeFunnelListing` into `AddToCartButton` and `ProductSaleProposalAction` → `MakerContactSection` → `StartChatButton` with `funnelSurface` / `funnelEntrypoint`.

---

## 4. Properties sent

Built by `buildExchangeFunnelPayload()` — **no PII** (no user ids, emails, names, or free text).

| Property (GA4 param) | Type | When included |
|--------------------|------|---------------|
| `listing_id` | string | Always |
| `barter_openness` | `MONEY` \| `MONEY_AND_BARTER` \| `BARTER_ONLY` | When known (normalized) |
| `surface` | `sticky` \| `commerce_zone` \| `suggestion` \| `chat` \| `detail` | Always |
| `device` | `mobile` \| `desktop` | Auto from viewport (`lg` breakpoint) |
| `entrypoint` | string | Always — distinguishes sub-actions |
| `has_accepted_values` | boolean | Derived from `acceptedSpecializations` or explicit |
| `has_desired_exchanges` | boolean | Derived from `listingIntent === REQUEST` + `specializations` |
| `order_method` | string | When available on listing |
| `settlement_mode` | string | Proposal submit / community order flows |
| `proposal_id` | string | Community order from proposal accept |
| `community_order_id` | string | Community order / deal checkout completion |

**Entrypoint examples:** `product_detail_load`, `sticky_add_to_cart`, `sticky_go_to_checkout`, `commerce_add_to_cart`, `commerce_go_to_checkout`, `proposal_expand_click`, `commerce_proposal_deep_link`, `sticky_proposal_deep_link`, `create_proposal_sheet_open`, `create_proposal_submit`, `cart_checkout_submit`, `deal_checkout_submit`, `proposal_accept`, `stripe_payment_success`.

---

## 5. Funnel questions answerable with this data

Filter GA4 on `barter_openness = MONEY_AND_BARTER` and `device = mobile`:

1. **Detail reach** — `detail_view` count per listing.
2. **Checkout intent (sticky vs commerce)** — compare `sticky_checkout_click` vs `commerce_checkout_click` rates from detail views.
3. **Proposal discovery** — `proposal_expand` (secondary CTA) + `proposal_deep_link_click` (direct chat+sheet).
4. **Proposal engagement** — `proposal_sheet_opened` → `proposal_submitted` conversion.
5. **Checkout start** — `checkout_started` (cart vs deal entrypoints).
6. **Deal path** — `community_order_created` after proposal accept → `checkout_started` with `surface=chat` → `checkout_completed`.
7. **End-to-end money path** — detail → commerce/sticky checkout click → checkout started → checkout completed.

**Core 5E-F hypothesis:** Among mobile MONEY_AND_BARTER sessions, is `sticky_checkout_click` / `commerce_checkout_click` disproportionately high vs `proposal_expand` + `proposal_deep_link_click` + `proposal_submitted`?

---

## 6. UX decisions enabled later (data-driven)

| If data shows… | Possible smallest follow-up (not in 5E-G) |
|----------------|---------------------------------------------|
| High sticky checkout, near-zero proposal discovery | Secondary sticky “Voorstel doen” via existing `StartChatButton` (`openProposalAfterStart`) |
| High `proposal_expand`, low `proposal_submitted` | Sheet/copy friction — tune `CreateProposalSheet`, not sticky |
| High deep-link, low sheet open | Chat routing / `openProposal` param reliability |
| Strong commerce checkout, weak sticky on same listings | Sticky parity review (5E-B intentional asymmetry) |
| Proposal path converts but checkout after accept drops | Deal checkout UX / `communityOrderId` flow only |

**Rule:** Do not change CTAs until at least one full mobile cohort is measured with these events.

---

## Validation

```bash
npm run lint
npm run build
npm run smoke-check
npx tsx scripts/validate-exchange-funnel-analytics.ts
npx tsx scripts/validate-marketplace-exchange-proposal-conversion.ts
npx tsx scripts/validate-marketplace-exchange-commerce-alignment.ts
npx tsx scripts/validate-marketplace-barter-openness-wiring.ts
```

---

## Privacy & constraints

- No new enums, CTAs, or layout changes in 5E-G.
- Events use listing/product ids only (public marketplace identifiers).
- Device is coarse mobile/desktop — no fingerprinting.
