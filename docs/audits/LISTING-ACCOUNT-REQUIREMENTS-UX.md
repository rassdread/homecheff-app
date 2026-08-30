# Listing publish — ACCOUNT_REQUIREMENTS_MISSING UX

**Date:** 2026-08-30  
**Target flag:** `HOMECHEFF_LISTING_ACCOUNT_REQUIREMENTS_UX_COMPLETE`

## Root cause

1. **Server source:** `assertAccountRequirementsOr403(user, 'postItem')` in `app/api/products/create/route.ts` → `lib/account-requirements-server.ts` returns HTTP **403** with `error: "ACCOUNT_REQUIREMENTS_MISSING"`.
2. **What triggers it (postItem):** missing `emailVerified`, definitive `username`, and/or `termsAccepted`.  
   **Stripe Connect is NOT part of the postItem gate** (`missingRequirementsForAction` filters out `stripeOnboarding`).
3. **UX bug:** `MarketplaceOfferForm` called `tryShowAccountRequirementsFromApiBody(data)` **without** `res.status`. The helper required `status === 403`, so the gate never opened and the form rendered `data.error` literally → users saw `ACCOUNT_REQUIREMENTS_MISSING` above Annuleren / Aanbod plaatsen.

Prior audit evidence (`docs/audits/wx-phase53-e2e-commerce-chain/evidence.json`) showed `missing:[{ key: "termsAccepted", ... }]` — i.e. profile terms, not Stripe `currently_due`.

## Product rules (verified, unchanged)

| Listing settlement | Stripe blocks publish? |
|---|---|
| Direct / cash only (`acceptHomeCheffPayment=false`, `acceptDirectContact=true`) | **No** |
| Barter-only / no HomeCheff checkout price | **No** |
| HomeCheff online payment + price > 0, seller Connect incomplete | Listing **stays active**; soft `PAYMENTS_REQUIRED` recommendation + Connect guidance — checkout gated, not publish |

## Fixes shipped

- Fix gate call arity + defensive body-only parsing in `consume-account-requirements-response.ts`
- Central `map-api-error-for-user.ts` — never surface SCREAMING_SNAKE codes
- Inline actionable Dutch panel `AccountRequirementsInlineAlert` above publish controls
- Gate CTAs per requirement; Stripe uses seller-specific `POST /api/stripe/connect/onboard`
- Return path after Stripe → resume `/sell/new` (draft preserved via px4a draft)
- Compact chef/garden/designer forms sanitize raw codes
- Tests: `lib/client/map-api-error-for-user.test.ts`, `lib/product/order-method-account-requirements.test.ts`
