# UX Finalization — Phase 8E Settlement Router & CTA Finalization

Date: 2026-07-08

## Goal

Every marketplace CTA uses one central settlement router. No redesign, no new payment provider, no ranking changes.

## Audit

See `docs/audits/SETTLEMENT_ROUTER_PHASE8E_AUDIT.md` for the full entrypoint audit and routing rules.

## Fixes shipped

| Area | Change |
|------|--------|
| `settlement-router.ts` | `resolveMarketplaceCtaActions`, `toMarketplaceCtaContext`, `resolveProposalCtaLabelKey`, checkout gate helpers |
| Primary CTA | `ProductSalePrimaryActions` → settlement-router |
| Sticky CTA | `ProductSaleStickyCta` → settlement-router |
| Commerce zone | `ProductSaleCommerceZone` → settlement-router for qty/checkout visibility |
| Secondary contact | `ProductSaleSecondaryContact` → router; `marketplace.cta.startConversation` |
| Preview actions | `MarketplacePreviewActions` — removed category-based proposal gate |
| Checkout API | `resolveCheckoutBlockReason` with settlement booleans |
| Proposal action | Optional `chatButtonLabel` prop for router-driven copy |
| i18n | `marketplace.cta.*` NL + EN |

## Rules enforced

1. Settlement determines flow — not category, intent, or price model  
2. HomeCheff Checkout → cart/checkout only when Connect ready + seller accepts  
3. Direct / barter / accepted values → chat + proposal  
4. Dual settlement → both paths visible  
5. Gezocht → proposal unless explicit HomeCheff checkout valid  
6. Legacy `orderMethod` fallback preserved when booleans absent  

## Validation

```bash
npx tsx scripts/validate-settlement-router-phase8e.ts
npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npx tsx scripts/validate-settlement-options-phase7c.ts
npm run build
```

## Deferred

- `AddToCartButton` / `useCart` defense-in-depth barter guards (parent-gated)  
- Feed display helpers still using `isContactOnlyProduct` for badges/copy  
- Remove legacy `resolveDetailPageActions` from old validator scripts  
- Data migration to drop lossy `orderMethod`
