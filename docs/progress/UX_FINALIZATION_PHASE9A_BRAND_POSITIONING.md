# UX Finalization — Phase 9A Brand Positioning, SEO & Content Architecture

Date: 2026-07-08

## Goal

Audit-first phase: document how every user-facing surface, SEO field, and marketing message aligns (or not) with HomeCheff as a **local craft, exchange and community platform** — without changing marketplace architecture from Phases 7A–8E.

## Audit

See `docs/audits/BRAND_POSITIONING_SEO_PHASE9A_AUDIT.md` for the full surface-by-surface report.

## Findings summary

| Layer | Status |
|-------|--------|
| In-app marketplace (feed, tiles, detail, settlement) | ✅ Aligned with canonical IA + value economy |
| Homepage hero (`homePhase1`) | ✅ Broad positioning (diensten, hulp, ruil) |
| Root layout SEO titles | ✅ Ateliers / Tuinen / Keukens |
| FAQ opener, Organization schema, manifest | ❌ Meal / sell-only framing |
| SEO hub + 20 slug pages + `/maaltijden/` | ⚠️ ~75% food-intent long-tail (traffic vs brand tension) |
| Onboarding buyer/seller, legacy success page | ❌ Hardcoded NL, meal-first |
| Technical SEO | ⚠️ Sitemap gaps, hreflang cookie model, OG/Twitter inconsistent |

## Unchanged (by design)

- Marketplace architecture (7D canonical model)
- Settlement router (8E)
- Value economy UX (8D)
- Reverse discovery (8C)
- No UI redesign, no new features, no new payment provider

## Deliverables

| File | Purpose |
|------|---------|
| `docs/audits/BRAND_POSITIONING_SEO_PHASE9A_AUDIT.md` | Full audit |
| `docs/progress/UX_FINALIZATION_PHASE9A_BRAND_POSITIONING.md` | This doc |
| `scripts/validate-brand-positioning-phase9a.ts` | Regression guard + positioning checks |

## Validation

```bash
npx tsx scripts/validate-brand-positioning-phase9a.ts
npx tsx scripts/validate-settlement-router-phase8e.ts
npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npm run lint
npm run build
```

## Deferred → Phase 9B+

- Manifest, FAQ, Organization schema copy refresh
- SEO hub taxonomy (add tuin/studio/diensten/ruil)
- City URL / title strategy
- Onboarding i18n
- “Te koop” → “Aangeboden” user-facing sweep
- Sitemap + OG/Twitter hardening
- Server-side homepage JSON-LD
