# UX Finalization — Phase 9B Brand Implementation

Date: 2026-07-08

## Goal

Implement Phase 9A audit: one brand story everywhere — local craft, exchange and community platform. Food is one category, not the brand.

## Brand SSOT

`docs/brand/HOMECHEFF_BRAND_LANGUAGE.md`

## Shipped

| Area | Change |
|------|--------|
| Brand language | Canonical doc NL/EN |
| FAQ opener | Platform + value exchange (NL/EN) |
| About | Full ecosystem story |
| Organization schema | Broad i18n description |
| Manifest | Multi-category positioning |
| Discover hub | “Aangeboden” not “te koop” |
| Onboarding | i18n buyer/seller + 4 categories |
| Success page | `paymentSuccess` i18n |
| SEO hub | Balanced sections + ecosystem links |
| City pages | Broad titles (URLs kept) |
| FAQ JSON-LD | Services + exchange |
| Layout keywords | Broad terms first |

## Unchanged

- Marketplace architecture (7D)
- Settlement router (8E)
- Reverse discovery (8C)
- UX flows, ranking, payment

## Validation

```bash
npx tsx scripts/validate-brand-implementation-phase9b.ts
npx tsx scripts/validate-brand-positioning-phase9a.ts
npx tsx scripts/validate-settlement-router-phase8e.ts
npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npm run lint
npm run build
```

## Deferred

- SEO slug page body rewrites (keep food long-tail titles)
- Full FAQ selling/buying legal blocks
- OG image, sitemap gaps, remaining “te koop” form labels
