# Discovery Sections Phase 2D — Section Registry & Ranking Rollout

**Status:** Complete (library + validation; no API/UI rollout)

---

## Delivered

### Part 1 — Section registry
- [x] `lib/discovery/sections/` module
- [x] Five sections: `nearby`, `trusted_makers`, `top_rated`, `trending`, `new_creators`
- [x] Registry owns id, titleKey, eligibility spec, ranking profile, limits, allowed kinds

### Part 2 — Trusted makers
- [x] `trusted_maker` profile via registry
- [x] sellerTier ≥ 4, combined reviews ≥ 3, inspiration excluded
- [x] Audit: tier distribution, review buckets, eligible listing ids

### Part 3 — Top rated
- [x] `top_rated` profile — per-channel evidence, no blended rating

### Part 4 — Trending
- [x] `trending` profile — capped favorites, recency, no views/HCP/followers

### Part 5 — Nearby
- [x] New `nearby` ranking profile
- [x] Distance + light activity + trust; all marketplace listing kinds

### Part 6 — New creators
- [x] New `new_creators` ranking profile
- [x] Account age, media, description quality gates; recency-only sort

### Part 7 — Legacy audit
- [x] `docs/audits/LEGACY_RANKING_MIGRATION_PLAN.md` — replace/wrap/deprecate plan; no removal

### Part 8 — Readiness report
- [x] `docs/audits/DISCOVERY_SECTION_READINESS.md`

---

## Key files

| File | Role |
|------|------|
| `lib/discovery/sections/section-registry.ts` | Canonical section definitions |
| `lib/discovery/sections/build-section.ts` | Registry → engine → limited results |
| `lib/discovery/sections/section-audit.ts` | Counts and trusted_makers distribution |
| `lib/discovery/ranking/ranking-profiles.ts` | Added `nearby`, `new_creators` profiles |
| `scripts/validate-discovery-sections.ts` | Section integration validation |
| `docs/architecture/DISCOVERY_SECTION_REGISTRY.md` | Architecture reference |

---

## Validation

```bash
npx tsx scripts/validate-ranking-engine.ts
npx tsx scripts/validate-discovery-sections.ts
npm run lint
npm run build
```

---

## Not in scope

- Personalization / recommendations
- Feed API or UI wiring (Phase 2E)
- Legacy file removal
