# UX Finalization — Phase 13P: Human Craft, Semantic Authority & Mission-Aligned SEO

**Status:** Complete (audit only)  
**Date:** 2026-07-11

---

## Goal

Determine how HomeCheff should **truthfully** present itself to Google, Bing, AI search engines, users, municipalities, partners and investors — without making claims the current product cannot support.

Core brand position: **the person behind the product**, not anonymous mass production.

This phase is **audit only**. No new pages, copy, metadata or schema were implemented.

---

## What was delivered

### 1. Comprehensive audit (`docs/audits/HUMAN_CRAFT_SEMANTIC_AUTHORITY_PHASE13P_AUDIT.md`)

Sixteen parts covering:

| Part | Topic |
|------|-------|
| 1 | Current semantic identity (homepage → legal) |
| 2 | Human craft philosophy consistency |
| 3 | Mass-production distinction |
| 4 | Search intent clusters (income, craft, cohesion, circular) |
| 5 | Pillar and supporting content strategy |
| 6 | City and regional strategy (Vlaardingen, Schiedam, Rotterdam, Rijnmond) |
| 7 | Structured data audit |
| 8 | AI discoverability |
| 9 | Truth and claim integrity (Phase 13O boundary) |
| 10 | Mission communication |
| 11 | Internal linking architecture |
| 12 | Social-impact authority |
| 13 | Content governance |
| 14 | International readiness (NL/EN) |
| 15 | Ranked opportunity register |
| 16 | Final verdict (10 direct answers) |

### 2. Validator

- `scripts/validate-human-craft-semantic-authority-phase13p.ts`

---

## Key findings (honest summary)

### What search engines currently understand

HomeCheff is **split**:

- **Homepage, About, FAQ JSON-LD, `gemeenschap` hubs, root metadata** → local craft + community marketplace (food, garden, creations, services, barter, help).
- **~70% of long-tail SEO landings + meal-city pages** → local food / home-cooking marketplace.
- **Net effect for crawlers:** a **local food marketplace with some broader craft signals**, not yet the definitive authority on personal craftsmanship or neighbourhood economy.

### Visibility scores (mission dimensions)

| Dimension | Visibility | Assessment |
|-----------|------------|------------|
| Personal craftsmanship | **Partial** | Homepage + About strong; SEO long-tail food-heavy |
| Extra income | **Moderate** | Multiple income landings; fee/subscription copy ahead of proof |
| Social cohesion | **Weak in SEO** | Product exists (requests, barter); thin public content |
| Mass-production distinction | **Moderate** | Dropshipping pages + taxonomy blocks; no policy pillar |
| Ethical technology | **Weak publicly** | Phase 13O evidence internal; not citation-worthy yet |

### Truth boundaries (from Phase 13O — must not outrun in SEO)

| Priority | Claim area | SEO action |
|----------|------------|------------|
| **P0** | Discovery boost / DNA visibility multiplier | Soften or remove until wired to live ranking |
| **P0** | GDPR data export | Do not rank on privacy leadership |
| **P0** | Global account safety | Do not claim full enforcement |
| **P1** | €2,000 individual revenue cap | Marketing-only — disclose or enforce |
| **P1** | Premium analytics | Unimplemented — remove from subscription SEO |
| **P1** | Social impact / waste reduction | No public metrics yet — aspirational only |
| **P1** | "Popular" discovery | Do not claim anti-gaming discovery |

### Top five legitimate authority opportunities

1. **Platform definition pillar** — unify homepage, About, FAQ, JSON-LD under one craft-first entity definition (P0 identity).
2. **Earn extra income locally** — consolidate `bijverdienen`, `verkopen-huis`, `gemeenschap` with truthful fee disclosure (P1).
3. **Personal craftsmanship / meet the maker** — profiles + listing schema + maker-forward copy (P1).
4. **Neighbour help & local services** — requests + services taxonomy → one pillar (P2 pilot).
5. **Rijnmond pilot cluster** — Vlaardingen + Schiedam + Rotterdam with data thresholds, not empty city spam (P2).

---

## Implementation policy

**No content, metadata or schema changes in Phase 13P.**

Recommended sequence after audit approval:

1. Fix P0 truth issues (13O) before any SEO scale.
2. Ship P0 identity alignment (entity definition, claim softening).
3. Pilot P1 pillars with real listing/profile evidence.
4. Expand city pages only when thresholds met.

---

## Validation

```bash
npx tsx scripts/validate-human-craft-semantic-authority-phase13p.ts
npm run lint
npm run build
```

---

## Files created

- `docs/audits/HUMAN_CRAFT_SEMANTIC_AUTHORITY_PHASE13P_AUDIT.md`
- `docs/progress/UX_FINALIZATION_PHASE13P_HUMAN_CRAFT_SEO.md`
- `scripts/validate-human-craft-semantic-authority-phase13p.ts`

No application code modified in this phase (audit-only).
