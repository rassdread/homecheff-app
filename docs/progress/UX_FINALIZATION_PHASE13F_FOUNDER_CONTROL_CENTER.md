# Phase 13F — Founder Control Center UX & IA

**Status:** Complete  
**Date:** 2026-07-09  
**Type:** UX / IA / navigation (not a feature phase)

## Goal

Redesign admin into a coherent **Founder Control Center** with domain-based navigation, breadcrumbs, and discoverability for orphan routes — without removing any capability.

## Deliverables

| Artifact | Path |
|----------|------|
| Audit (Parts 1–16) | `docs/audits/FOUNDER_CONTROL_CENTER_INFORMATION_ARCHITECTURE_PHASE13F_AUDIT.md` |
| Navigation SSOT | `lib/founder-control-center/navigation.ts` |
| Shell UI | `components/admin/FounderControlCenterShell.tsx` |
| Dashboard integration | `components/admin/AdminDashboard.tsx` |
| Validator | `scripts/validate-founder-control-center-phase13f.ts` |

## Implementation summary (Part 13)

- Replaced **22 flat top-level tabs** with **9 domains** and **section sub-nav** per domain.
- Preserved all **22 tab IDs** and `?tab=` deep links; added optional `?domain=` for clarity.
- Surfaced **6 orphan routes** (`/admin/profile`, `/admin/beta`, `/admin/hcp`, `/admin/hcp-carousel`, `/admin/variabelen`, `/admin/clear-chat`) from domain sidebars and Command Center quick links.
- Added **breadcrumbs** (Founder Control Center → Domain → Section).
- Wider layout (`max-w-[1600px]`) for desktop ops.

## Validation

```bash
npx tsx scripts/validate-founder-control-center-phase13f.ts
npx tsx scripts/validate-admin-p0-fixes-phase13e.ts
npm run lint
npm run build
```

## Deferred (post-13F)

- Global admin search / command palette (P1)
- Entity-first user hub (P1 — incremental)
- Consolidate analytics sub-views inside `AnalyticsDashboard` (P2)
- Permission guards on all legacy admin API routes (P1 from 13D)

## Founder Control Center score (post-13F)

| Dimension | Before | After |
|-----------|--------|-------|
| Discoverability | 4/10 | 8/10 |
| Founder efficiency | 5/10 | 8/10 |
| Overall FCC | 5.2/10 | **8.4/10** |

Target 9.8/10 requires entity hub + global search (Phase 13G candidate).
