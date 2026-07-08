# UX Finalization — Phase 10B Pilot Polish

**Date:** 2026-07-08

## Goal

Final polish before first city pilot: consistency, completeness, friction removal. No new features. No redesign.

## Shipped

| Area | Change |
|------|--------|
| Guest favorites | Login CTA + benefits + continue browsing |
| Mobile detail | Sticky CTA only; removed duplicate inline actions |
| Stripe Connect | Single `SettlementConnectGuidance`; banners removed from edit/sell/new |
| Terminology | Aangeboden/Offered on view axis; putForSale → aanbod plaatsen |
| Settlement labels | Unified Geaccepteerde waarden / Accepted values |
| SEO | Sitemap `/faq`, `/over-ons`; gemeenschap locale metadata |
| A11y | Bottom `<nav>` + aria-label; filter sheet Escape + focus |
| Sticky scroll | Targets `#detail-settlement` on mobile |

## Unchanged

- Marketplace architecture (7D)
- Settlement router (8E)
- Reverse discovery (8C)
- Performance architecture (4B/4C)

## Validation

```bash
npx tsx scripts/validate-pilot-polish-phase10b.ts
npx tsx scripts/validate-pilot-launch-readiness-phase10a.ts
npx tsx scripts/validate-brand-implementation-phase9b.ts
npx tsx scripts/validate-settlement-router-phase8e.ts
npm run lint
npm run build
```

## Pilot status

**Ready** for first city pilot (NL + EN).
