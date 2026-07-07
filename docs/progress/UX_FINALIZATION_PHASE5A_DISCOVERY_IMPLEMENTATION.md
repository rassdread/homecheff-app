# UX Finalization Phase 5A — Discovery Implementation (Codebase-First)

**Date:** 2026-07-08

Full audit: [`docs/audits/DISCOVERY_IMPLEMENTATION_PHASE5A_AUDIT.md`](../audits/DISCOVERY_IMPLEMENTATION_PHASE5A_AUDIT.md).

---

## Summary

Phase 5 was a read-only discovery audit. **Phase 5A implements** the safe, copy-first improvements so the homepage represents the capabilities that *actually exist in the code today* — verified against the schema, API routes and components, not older docs.

The core insight: HomeCheff already supports **buying, selling, proposals, negotiation, barter-openness, requests (Gezocht), services/klussen (creatable), inspiration, delivery, appointments, reviews, props, fans and trust** — but the homepage under-sold several of these (some were even labelled "coming soon" despite being live). Phase 5A closes that gap without adding functionality or touching performance architecture.

---

## Deliverables

| Deliverable | Status |
|---|---|
| `docs/audits/DISCOVERY_IMPLEMENTATION_PHASE5A_AUDIT.md` | ✅ |
| `docs/progress/UX_FINALIZATION_PHASE5A_DISCOVERY_IMPLEMENTATION.md` | ✅ (this) |
| `scripts/validate-discovery-phase5a.ts` | ✅ 32/32 |

---

## Implemented this phase

**Copy (i18n, NL + EN parity):**
- `homePhase1.heroSubtitle` — rewritten to name real verbs (ontdek, koop, verkoop, ruil, oproep/Gezocht, inspiratie, hulp).
- `homePhase1.heroChipRequests` — new **Gezocht** hero chip; `heroChipBarter` label "Ruilhandel"→"Ruilen".
- `homePhase1.ctaShare` — "Deel wat je maakt" → "Verkoop of deel" / "Sell or share".
- `guestBottomNav.earn/create` bullets — present-tense; removed "binnenkort/straks/coming soon" for services, requests and barter-openness (all live).
- `homeDorpsplein.communityCardBody` — now names afspraken, reviews, props, verkopen/ruilen.
- `homeDorpsplein.spotlight*` — placeholder copy repurposed into a live Gezocht/help surface (+ `spotlightCta`).
- `home.reputationCompact.guestTitle`/`guestCta` — honest guest labelling.
- `feed.refineSectionLabel` — "Verfijn deze resultaten …" to disambiguate from global search.

**Presentational (no logic/fetch/state change):**
- `HomeHeroSection.tsx` — added the Gezocht chip to `HERO_CHIP_KEYS`.
- `HomeDesktopSidebar.tsx` — permanent `aria-hidden` "coming soon" placeholder → real `<Link>` into the Gezocht feed with CTA.
- `HomeReputationCompactCard.tsx` — guest branch uses `guestTitle`/`guestCta`.

---

## 14-point report

1. **Functional audit:** completed code-first (schema + API + components). See audit §1.
2. **What really exists:** all verticals + Gezocht + inspiration; full economy (buy/sell/proposals/negotiation/delivery/appointments/reviews/props/fans/trust/community-deals); services & klussen are *creatable* (no dedicated hub); barter = config + chat settlement (matching is future). Community listings as a type = ABSENT.
3. **Under-visible:** Gezocht, sell/earn, services/klussen (were "coming soon"), community trust signals, guest reputation framing.
4. **Homepage:** repurposed dead placeholder into a live Gezocht surface; community card now names real trust mechanics.
5. **Hero:** subtitle names real verbs; Gezocht chip added; ecosystem chips intact.
6. **Ecosystem:** Cheff/Garden/Designer + Inspiratie + Klusjes + Ruilen + **Gezocht** surfaced; barter framed honestly.
7. **Feed:** cards already differentiate sale/request/inspiration — no redesign (documented).
8. **Filters:** refine label clarified; dual-search consolidation deferred (regression risk) and documented.
9. **Community:** spotlight→Gezocht, community card copy, guest reputation label.
10. **Mobile:** message parity via shared rewritten subtitle; compact feed-first hero preserved (no added height).
11. **Copy:** all touched namespaces at 100% NL/EN parity; no "coming soon" on live features.
12. **Discovery flow:** every step (feed→detail→chat→voorstel→afspraken→afronden) maps to a real model; guest entry to Gezocht/sell improved.
13. **Performance:** no extra renders/fetches/remounts; density/SWR/caches/guards intact — validated.
14. **Larger items (deferred):** unified filter surface + single search, optional Diensten/Buurthulp entry, guest community-proof module, verticals-as-chips, stale `home.*` deprecation.

---

## Files changed

- `components/home/HomeHeroSection.tsx` — Gezocht chip
- `components/home/HomeDesktopSidebar.tsx` — spotlight placeholder → live Gezocht link
- `components/home/HomeReputationCompactCard.tsx` — guest title/cta
- `public/i18n/nl.json`, `public/i18n/en.json` — copy accuracy (hero, CTA, guest bullets, community, spotlight, refine, reputation)
- `scripts/validate-discovery-phase5a.ts` (new)
- `docs/audits/DISCOVERY_IMPLEMENTATION_PHASE5A_AUDIT.md` (new)
- `docs/progress/UX_FINALIZATION_PHASE5A_DISCOVERY_IMPLEMENTATION.md` (new)

No changes to ranking, search algorithms, feed fetch logic, economy, schema or business rules.

---

## Validation

```
npx tsx scripts/validate-discovery-phase5a.ts        # 32/32
npx tsx scripts/validate-discovery-experience.ts     # 23/23
npm run build                                        # pass
```
