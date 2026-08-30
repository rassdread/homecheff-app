# Listing publish — ACCOUNT_REQUIREMENTS_MISSING UX

**Date:** 2026-08-30  
**Target flag:** `HOMECHEFF_LISTING_ACCOUNT_REQUIREMENTS_UX_COMPLETE`  
**COMMIT_SHA:** `2589643a410f54c3f08f76e60ebd2fe10884d94e`  
**DEPLOYMENT_ID:** `dpl_AYj7g2xMAsFYcuad4arZZ7YZrkWG` (aliased `https://homecheff.eu`)

## Final certification

```
ROOT_CAUSE = MarketplaceOfferForm called tryShowAccountRequirementsFromApiBody(body) without res.status → gate never opened → data.error ("ACCOUNT_REQUIREMENTS_MISSING") rendered above Annuleren/Aanbod plaatsen
ACCOUNT_REQUIREMENTS_MISSING_SOURCE = lib/account-requirements-server.ts ← assertAccountRequirementsOr403(..., 'postItem') ← app/api/products/create/route.ts
STRIPE_CONNECT_RELATED = NO (postItem filters out stripeOnboarding; typical missing key = termsAccepted / emailVerified / username)
EXACT_MISSING_REQUIREMENT = Server returns missing[] (evidence: termsAccepted in prior audits); not Stripe currently_due
NON_STRIPE_LISTINGS_BLOCKED_BEFORE = NO (product rules already allowed cash/direct & barter without Connect; Stripe only soft-flags PAYMENTS_REQUIRED)
NON_STRIPE_LISTINGS_FIXED = YES (rules preserved + tested; no new Stripe hard-block on publish)
FRIENDLY_DUTCH_ERROR = PASS
DIRECT_FIX_LINK = PASS
STRIPE_CONNECT_LINK_SELLER_SPECIFIC = PASS (POST /api/stripe/connect/onboard Account Link)
RETURN_TO_HOMECHEFF = PASS (/seller/stripe/success → stored /sell/new path; draft via px4a)
LISTING_DRAFT_PRESERVED = PASS (draft cleared only on successful publish)
RAW_ERROR_CODES_HIDDEN = PASS
MOBILE_VERIFIED = PASS (inline alert + 44px CTAs + safe-area above publish controls; live auth session not re-run)
PRODUCTION_VERIFIED = PASS (prod i18n accountRequirementsUx live; sell/new 200; deployment READY)
```

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
- Tests: `lib/client/map-api-error-for-user.test.ts`, `lib/product/order-method-account-requirements.test.ts` (12/12 pass)

## HOMECHEFF_LISTING_ACCOUNT_REQUIREMENTS_UX_COMPLETE
