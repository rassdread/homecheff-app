# HomeCheff Manifest — Phase 13T Audit

**Date:** 2026-07-11  
**Scope:** Philosophical foundation SSOT, `/manifest`, expanded `/over-ons`, platform integration.  
**Builds on:** 13O (truth boundaries), 13P–13S (authority) — no re-open unless consistency required.

---

## Part 1 — Manifest SSOT

**File:** `lib/seo/homecheff-manifest.ts`

Canonical exports:

- `MANIFEST_MISSION`, `MANIFEST_VISION`, `MANIFEST_IS`
- Six `MANIFEST_CORE_VALUES` with labels
- `MANIFEST_IS_NOT` guardrail lists
- `MANIFEST_AI`, `MANIFEST_SOCIETY_HOPES` (aspirational, no metrics)
- `manifestOrganizationDescription()` for schema alignment

**Root cause addressed:** Philosophy was scattered across pillar copy without a single timeless reference.

---

## Part 2 — `/manifest` page

| Layer | Path |
|-------|------|
| Route | `app/manifest/page.tsx` |
| Blocks | `lib/seo/manifest-blocks.ts` |
| i18n | `lib/i18n/manifestPageSources.ts` |
| Template | `AuthorityLandingPage` / `SeoLandingTemplate` |

Sections: why we exist, long preparation (no hero founder story), philosophy, vision, mission, six values, what we are not / are, AI, society (bounded), future, FAQ, last reviewed.

**Tone:** Calm, mature, no startup clichés, no unsupported claims.

---

## Part 3 — Expanded About (`/over-ons`)

**File:** `app/over-ons/page.tsx` + `overOns.*` in NL/EN JSON

New sections:

- Story behind HomeCheff
- Philosophy (links to Manifest)
- Personal craftsmanship
- Why local matters
- Technology with conscience
- AI as supporting tool
- Honest entrepreneurship
- Food is one category
- Digital village square
- Looking ahead

Retained: reachability table, team, company details.

**Founder policy:** No hero narrative; no dramatic employer transition in public copy.

---

## Part 4 — Platform integration

| Surface | Integration |
|---------|-------------|
| Sitemap | `/manifest` added |
| Footer | Manifest link |
| Pillar pages | `PILLAR_LINKS` + `labelNs: pillarSharedFaq` |
| Ecosystem map | Manifest + About links; mission references manifest |
| Comparison pages | `comparisonShared` manifest/about links |
| FAQ | Manifest reference block |
| SEO hub | Manifest link |
| Organization schema | `platform-definition` uses `manifestOrganizationDescription()` |
| `knowsAbout` | + technology with conscience, digital village square |

**No duplicate content:** Pages link to Manifest; full text lives once on `/manifest`.

---

## Part 5 — AI & SEO

- Organization JSON-LD description aligned via manifest SSOT
- FAQ and About reference Manifest without copying full text
- Phase 13O blocked claim patterns enforced in validator
- No measured impact, ranking boost, or GDPR export claims added

---

## Part 6 — Security / governance

Public philosophy pages only — no new auth surface. Content governance rules unchanged; validator checks blocked patterns and hype.

---

## Verdict

One timeless philosophical source implemented. Safe to ship after lint/build pass.
