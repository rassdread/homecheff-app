# UX Finalization Phase 5 — Discovery Experience, Homepage & Filter UX

**Date:** 2026-07-07

Full audit: [`docs/audits/DISCOVERY_EXPERIENCE_PHASE5_AUDIT.md`](../audits/DISCOVERY_EXPERIENCE_PHASE5_AUDIT.md).

---

## Summary

Phase 5 is a **read-only discovery audit** with one hygiene fix and a structural validator. Performance architecture from Phase 4/4B/4C is fully preserved. The platform **performs** like a native app; the remaining gap is **teaching newcomers** what HomeCheff is and helping them find Gezocht, selling, and community value without reading the feed first.

---

## Deliverables

| Deliverable | Status |
|---|---|
| `docs/audits/DISCOVERY_EXPERIENCE_PHASE5_AUDIT.md` | ✅ |
| `docs/progress/UX_FINALIZATION_PHASE5_DISCOVERY_EXPERIENCE.md` | ✅ (this) |
| `scripts/validate-discovery-experience.ts` | ✅ 23/23 |

---

## Implemented this phase

- Removed leftover `console.log('orbit image src', …)` from `HomeHeroSection.tsx` (every mount in discovery hot path).
- Added discovery validator covering hero structure, i18n parity, feed/chips/filters presence, community sidebar modules, and **full Phase 4/4B/4C regression guard**.

---

## Audit conclusions (12-point report)

1. **Homepage:** Strong local + vertical story on desktop; mobile hero too thin; sell/earn and Gezocht not explained in hero.
2. **Feed:** Solid card hierarchy; requests clearly distinct; sale vs inspiration too similar visually.
3. **Filters:** Full feature set but dual search fields and fragmented reset are top frictions.
4. **Chips:** Clear order and styling; verticals live in dropdown instead of chips — inconsistent axis.
5. **Discovery flow:** Back-navigation instant (performance phases); forward path clear once user is in feed.
6. **Mobile vs desktop:** Mobile sacrifices hero education for feed-first; desktop sidebar community-rich but login-gated.
7. **Community visibility:** Pulse + reputation in sidebar; guests see almost none; Props/Afspraken absent on homepage.
8. **Copy:** NL/EN parity clean on live keys; “Deel” ambiguity and stale `home.*` block are maintenance risks.
9. **Quick wins:** Copy (ctaShare, Gezocht line), merge search fields, global reset, guest reputation label, mobile hero chips.
10. **Larger items:** Hero differentiation copy, unified filter surface, guest community module, vertical chips.
11. **Performance:** No regressions — density instant, SWR/caches intact, validators 23+26+25 pass.
12. **Order:** Copy → filters → mobile hero chips → tile accents → filter unification → guest community.

---

## Files changed

- `components/home/HomeHeroSection.tsx` — debug log removed
- `scripts/validate-discovery-experience.ts` (new)
- `docs/audits/DISCOVERY_EXPERIENCE_PHASE5_AUDIT.md` (new)
- `docs/progress/UX_FINALIZATION_PHASE5_DISCOVERY_EXPERIENCE.md` (new)

No changes to ranking, search algorithms, feed fetch logic, or business rules.

---

## Next recommended phase (implementation)

**Phase 5A (suggested):** i18n-only copy polish (ctaShare, Gezocht subtitle, guest reputation) + filter dual-search merge + global reset — highest impact, lowest risk, no performance regression.
