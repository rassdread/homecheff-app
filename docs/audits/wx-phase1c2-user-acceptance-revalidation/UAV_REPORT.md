# WX Phase 1C.2 — User Acceptance Revalidation

**Date:** 2026-08-03  
**Basis:** Local AW ON guest session · 7 viewports · screenshots under `wx-phase1c1-launch-readiness-corrections/screenshots/` (post first-visitor header) · probe matrix with explain levels  
**Product code:** not modified in this phase

---

## Executive Summary

HomeCheff is substantially closer to launch than the prior UAV (61/100). Create and Search are reliably discoverable. The Workspace header now names the product as a **digitale buurtmarkt** and lists the core actions. Portrait browses; landscape works; desktop feels professional.

It is **not** yet safe to recommend launching to thousands of strangers tomorrow. Three genuine P1 issues remain: empty feeds still look unfinished (skeletons / “0 resultaten” without guidance), the default location scope contradicts “dichtbij eerst,” and trade is announced but not operationally obvious. Overall UX **84/100**. Recommendation: **READY_AFTER_P1_FIXES**.

---

## First Impression Review

| Criterion | Rating |
| --- | --- |
| What HomeCheff is | **Good** — “DIGITALE BUURTMARKT” lands immediately |
| What it is NOT | **Acceptable** — not only food, but headline still leans “koken”; not a generic webshop is clearer than before |
| Search / Buy / Sell / Trade / Request / Offer / Help / Discover | **Good** as named actions on tablet+; **Acceptable** on phone short line; trade weakest as *action* |
| Natural vs marketing | **Good** — calm, action-led, not hype |
| Five-second clarity | **Good** after chrome is visible; **Needs Improvement** while privacy modal covers phone portrait |

Verdict: a new visitor who can see the green strip understands “neighbourhood marketplace + multiple actions.” They do **not** yet fully understand *how* to trade, and “nearby first” is verbally promised then visually contradicted by scope chips.

---

## Screen-by-Screen UX Review

| Screen | Rating | Notes |
| --- | --- | --- |
| Phone Portrait | **Good** | Short strip + search + filters + Create FAB; feed delayed by cookie modal + chrome stack |
| Phone Landscape | **Good** | Compact actions; Create in header; tools rail; feels like work; empty skeletons hurt |
| Tablet Portrait | **Good** | Medium explanation + start rail tools before community; dual Create (primary FAB + secondary rail) |
| Tablet Landscape | **Good** | Workspace posture; feed primary; medium copy slightly truncated by height budget |
| Laptop | **Excellent** | Full explanation; dual rails; feed with real content feels confident |
| Desktop | **Good** | Professional three-column workspace; “Werken bij” in top nav dilutes guest focus |
| Ultrawide | **Acceptable** | Feed capped intelligently; right rail promo stack (Play / Affiliate / Werken bij) adds noise |

---

## User Journey Review

| Journey | Rating | Finding |
| --- | --- | --- |
| Guest home | **Good** | Identity + auth CTAs clear |
| Browse | **Good** | Filters readable; feed primary when populated |
| Search | **Good** | Field always present |
| Filters | **Good** | Type / category / scope discoverable |
| Trade | **Needs Improvement** | Named in header; no first-class browse path |
| Request | **Good** | “Gezocht” chip + sidebar |
| Offer / Create | **Excellent** | FAB / header Create never missing in matrix |
| Open listing | **Good** | (inferred from populated laptop feed cards) |
| Return / continue | **Good** | Continuity remount 0 in proof |
| Rotate | **Good** | Create preserved; posture swaps correctly |

---

## Workspace Review

| Posture | Rating |
| --- | --- |
| Portrait = browsing | **Good** |
| Landscape = working | **Good** |
| Desktop = professional | **Good** |
| Ultrawide = intelligent space use | **Acceptable** |
| Feed as primary surface | **Good** when content loads; **Needs Improvement** when empty skeletons dominate |

---

## Navigation Review

**Acceptable → Good.** Bottom nav (portrait) and header Create (landscape) are clear. Desktop top nav mixing “Werken bij / Reputatie” with marketplace discovery is guest-confusing. Guest “Verdienen” in bottom nav is secondary noise before the marketplace is understood.

---

## Create Review

**Excellent.** Always discoverable across the matrix. Landscape substitutes header Create when bottom collapses. Desktop keeps one primary Create; sidebar Create is visually secondary. No Create regression on rotation in proof.

---

## Search Review

**Good.** Immediately visible on all tested surfaces. Placeholder “Zoek in producten…” undercuts meals/services/help identity (**P2**). Not dependent on filter chips.

---

## Trade & Neighbourhood Identity Review

| Topic | Rating |
| --- | --- |
| Neighbourhood identity | **Acceptable** — strongly named; weakly enforced by defaults |
| Trade understanding | **Needs Improvement** — “Ruilen” in strip ≠ clear trade flow |
| Offer / help / request | **Good** — Gezocht + Create + copy |

“Dichtbij eerst” in copy vs **“Heel Nederland”** selected by default is a trust mismatch.

---

## Rotation Review

**Good.** Portrait ↔ landscape: Create remains reachable; bottom collapses / header Create appears; remount stable. No duplicated primary Create in landscape proof. Visual jump is intentional posture change, not a regression.

---

## Visual Design Review

**Good.** Cohesive green system, calm chrome, readable cards. Strip height stays feed-first (≈8–14%). Ultrawide still somewhat airy; promo cards in end rail feel campaign-y next to neighbourhood moments.

---

## Interaction Review

**Good.** Touch targets for Create / search / chips are adequate. Mouse density on desktop is comfortable. Filter rows on phone are busy but scannable. Action verb row in the strip is informational, not interactive — fine, but not a substitute for trade UX.

---

## Accessibility & Reachability Review

**Acceptable.** Create and Search are reachably placed. Cookie modal intercepts first interaction (standard, still costly). Empty skeletons may be announced as content without guidance. No severe clipped controls observed in screenshots.

---

## Issue List (P0–P3)

### P0 — Launch blocker
*None.*

### P1 — Must fix before launch
1. **Empty feed still feels unfinished** — Probe recorded `emptyGuidance: false` on all viewports; screenshots show “0 resultaten” + skeleton cards without clear next-step guidance (what HomeCheff is / search / create / change location).
2. **Nearby promise vs default scope** — Copy says nearby first; UI often defaults to **Heel Nederland**, undermining neighbourhood identity.
3. **Trade not operationally clear** — “Ruilen” is listed in the header verbs but a first-time user cannot see an obvious browse/create path for trading/barter in the primary chrome.

### P2 — Recommended
4. Search placeholder biases to “producten.”  
5. Headline “maken, koken en creëren” still food/craft-leaning vs full marketplace.  
6. Privacy modal dominates phone first paint.  
7. “Werken bij” in primary desktop nav for guests.  
8. Ultrawide end-rail promos compete with neighbourhood context.

### P3 — Future enhancement
9. Orientation action verbs not deep-linked.  
10. Guest “Verdienen” before marketplace comprehension.  
11. Commit/ship first-visitor header copy before Formal Review (present in evaluated build; ensure it is on the feature branch tip).

---

## Launch Readiness Assessment

| Gate | Status |
| --- | --- |
| P0 = 0 | **Met** |
| P1 = 0 | **Not met** (3) |
| UX ≥ 90 | **Not met** (84) |
| Understand in ~5s | **Mostly met** (identity yes; trade/how-to weak; cookie friction) |
| Create always discoverable | **Met** |
| Search always discoverable | **Met** |
| Trade clearly understood | **Not met** |
| Feed visual primary | **Met when populated**; weak when empty |
| Landscape = workspace | **Met** |
| Portrait = browsing | **Met** |
| Ready for public promotion tomorrow | **No** |

---

## Overall UX Score (/100)

**84 / 100**

(Prior UAV: 61. Gain from Create invariant, Search visibility, compact strip, tools-before-community, and first-visitor header.)

---

## Recommendation

**READY_AFTER_P1_FIXES**

Not `READY_FOR_FORMAL_REVIEW` — P1 ≠ 0 and score &lt; 90.

STOP.
