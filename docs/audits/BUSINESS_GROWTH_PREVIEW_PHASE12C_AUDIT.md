# Business Growth Preview — Phase 12C Audit

**Date:** 2026-07-08  
**Method:** Live subscription preview, growth transparency panels, dashboard DNA widget, and product surface previews — all derived from Business DNA SSOT (Phase 12B). No new billing logic.

---

## Executive summary

Phase 12C answers: *"What exactly does this plan change for my business on HomeCheff?"* Every preview, comparison delta, and dashboard element is **generated from `getBusinessVisibilityProfile()`** — no hardcoded Premium checks, no fake metrics.

| Surface | Verdict |
|---------|---------|
| Live plan preview (`/sell`) | ✅ |
| What-changes panel | ✅ |
| Upgrade delta (plan A → B) | ✅ |
| Seller dashboard DNA widget | ✅ |
| Product preview (tile/profile/detail) | ✅ |
| Coming-soon locked features | ✅ |

---

## 1. Live preview

**Component:** `SubscriptionLivePreview`

**Plan switcher:** Individual · Basic · Pro · Premium

**Live fields** (from `buildLivePreviewFields()`):
- Business badge
- Visibility level (dots)
- Discovery level (label)
- Search priority (dots)
- Analytics tier
- Visibility score (0–100, computed from DNA)
- Homepage / regional eligibility
- Website / social promotion status
- Max locations
- AI marketing status

Updates instantly via React state on `/sell`.

---

## 2. What changes panel

**Component:** `SubscriptionWhatChangesPanel`

Shows `computeUpgradeDelta(fromPlan, targetPlan)`:
- On plan cards: delta from **current subscription** (API) to hovered plan
- In preview column: delta from current plan to selected preview plan

Only lists **what changes** — no repeated baseline features.

---

## 3. Upgrade delta engine

**Module:** `lib/business/dna-preview.ts` → `computeUpgradeDelta()`

Example Basic → Pro:
- Regional discovery
- Homepage eligibility
- Advanced analytics
- Second location
- Higher visibility / search / discovery scores

Coming-soon items flagged with `(Binnenkort)` when `comingSoon: true`.

---

## 4. Seller dashboard widget

**Component:** `BusinessDnaDashboardWidget` on `/verkoper/dashboard`

Displays:
- Current plan (from stats API `businessPlan`)
- Visibility score
- Commission %
- Growth status label
- Unlocked features
- Locked features (higher plans)
- Coming soon strip
- Upgrade CTA → `/sell`
- Embedded product preview for current plan

---

## 5. Product preview

**Component:** `BusinessDnaProductPreview`

Uses **real** components:
- `MarketplaceTileCompact` + `buildTileBadges` (business badge from `trust.businessPlan`)
- Profile header mock with `BusinessPlanBadge`
- `ProductDetailTrustBlock` with trust contract

Tile model from `buildDnaPreviewTileModel(plan)` — no screenshot mockups.

---

## 6. Coming soon / locked

**Functions:** `listComingSoonFeatureKeys()`, `listLockedFeatureKeys()`

Shown as "Binnenkort" / "Coming soon" — website, social, AI marketing, campaigns. Never displayed as live.

---

## 7. Architecture compliance

| Rule | Status |
|------|--------|
| Single SSOT | ✅ `visibility-profile.ts` |
| No new subscription system | ✅ |
| No duplicate feature tables | ✅ |
| Backwards compatible | ✅ |

---

## 8. Success criteria

| Question | Answer |
|----------|--------|
| Understand current plan in <30s? | ✅ Dashboard widget + preview |
| See what next plan adds? | ✅ Delta panel |
| See listing visibility impact? | ✅ Product preview |
| Why upgrade for growth? | ✅ Live score + benefits |

---

## Validation

```bash
npx tsx scripts/validate-business-growth-preview-phase12c.ts
npm run lint
npm run build
```
