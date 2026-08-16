# Multi-persona UX implementation — final report

**Date:** 2026-08-17  
**Baseline audit:** `HOMECHEFF_MULTI_PERSONA_UX_CHANGES_RECOMMENDED` · overall **5.6 / 10**  
**Status:** `HOMECHEFF_MULTI_PERSONA_UX_IMPLEMENTATION_READY_WITH_P1_GAPS`

---

## Baseline (before)

| Field | Value |
|---|---|
| Main SHA before | `2bc36cb8e1040e78adb296fca2960bed6aec37cc` |
| Origin/main before | `2bc36cb8e1040e78adb296fca2960bed6aec37cc` |
| Production deployment before | `dpl_Fp3SMaYdt6HYburefhiNbEWF86hq` (homecheff.eu) |
| Working tree | Dirty with unrelated audit docs/scripts; feature changes cleanly scoped |
| Probe baseline | `docs/audits/multi-persona-ux/probe-1786920757594` · `probe-deep-1786920877124` |

---

## Files changed (presentation only)

- `lib/locale.ts` — Accept-Language cold-start resolver  
- `middleware.ts` — stop forcing EN on `.eu`  
- `hooks/useTranslation.ts` — client cold-start aligned  
- `app/layout.tsx` — html `lang` / metadata via Accept-Language  
- `public/i18n/nl.json` · `en.json` — Model B copy  
- `components/adaptive-workspace/WorkspaceOrientationStrip.tsx` — Model B + CTAs  
- `lib/adaptive-workspace-react/resolve-orientation-explanation.ts` — denser fold levels  
- `lib/seo/homepage-ssr-identity.ts` — Model B H1  
- `components/home/HomeHeroSection.tsx` — Model B + landscape thin  
- `components/home/HomeMobileEcosystemStrip.tsx` — remove duplicate definition block  
- `components/feed/FeedMobileToolbar.tsx` — progressive chrome (scope → Filters)  
- `components/feed/FeedSearchContextBar.tsx` — denser strip  
- `components/feed/LocationRefineBanner.tsx` — compact  
- `components/PrivacyNotice.tsx` — denser bottom dock (consent semantics unchanged)  
- `scripts/validate-cold-start-locale.ts` · measure probes · this report  

**Not changed:** payment, settlement, Stripe, agreements, schema, feed ranking, radius semantics, auth architecture.

---

## Locale before/after

| Context | Before | After |
|---|---|---|
| `.eu` + no cookie | Forced **EN** | Accept-Language → NL/EN; fallback **NL** |
| `nl-NL` / `nl` | Often EN on `.eu` | **NL** |
| `en-US` / `en-GB` | EN | **EN** |
| Explicit cookie / language switcher | Preserved | Preserved |
| `/en/*` | EN | EN |

---

## Hero before/after

| | Before | After (Model B) |
|---|---|---|
| Identity | DIGITAL NEIGHBOURHOOD… | Digitale buurtmarkt / Digital neighbourhood marketplace |
| Title | Incomplete “nearby cook…” | **Ontdek wat mensen bij jou in de buurt koken, groeien, maken en doen** |
| Body | Long + secondary + keyword strip | One compact body |
| CTAs | Keyword strip / weak | **Ontdek in je buurt** · **Verkoop of deel** |
| “With or without money” | Primary fold | Moved to rich desktop / secondary only |
| Keyword strip | Primary | Removed from primary fold |

**Copy deviation:** user preference “doen” used instead of “helpen” (reported). Avoided “huisgemaakt” as umbrella definition.

---

## Fold metrics (local after · `after-1786923505475` vs production baseline)

| Viewport | First listing Y before | After | Visible % before | After |
|---|---|---|---|---|
| Phone ~390 | ~680–684 | **565** | ~26% | **~46%** |
| Phone 430 | ~680 | **596** | ~26% | **~51%** |
| Phone landscape | ~434 (0%) | **356** | **0%** | **~3%** |
| Tablet | ~706 | **534** | ~42% | **~46%** |
| Desktop | ~750 | ~739* | ~21% | ~24%* |

\*Local server often runs AW **OFF** (legacy hero). Production uses `WorkspaceOrientationStrip` (Model B). Desktop production should be re-measured after deploy.

Permanent control rows: scope row removed from mobile primary chrome; ecosystem definition paragraph removed; location banner compacted.

---

## Cookie presentation

Consent choices unchanged (Accept all / Only necessary / Privacy links). Layout denser, bottom-docked, side-by-side actions on mobile. **Not** a legal rewrite.

---

## Regression gates

| Gate | Result |
|---|---|
| `npm run build` | PASS |
| `npm run smoke-check` | PASS |
| Locale unit script | PASS |
| Buyer journey (listing + terug) | PASS (local) |
| Seller entry (Sell or share → guest panel) | PASS (local) |
| PageErrors in measure | 0 on successful paints |
| Radius semantics | Unchanged (presentation only) |
| `validate:refund-settlement-unit` | PASS |
| `validate:dispute-settlement-unit` | PASS |
| `validate:multi-recipient-settlement` | PASS |
| Interaction integrity full probe | Not re-run end-to-end (DB pool contention local); payment units PASS |

---

## Persona scores BEFORE → AFTER (honest)

| Persona | Before doorgaan | After (est.) |
|---|---|---|
| 10–12 | 4 | 5 |
| 15–18 | 6 | 7 |
| 20–29 / 30–44 | 7 | 8 |
| 45–59 | 6 | 7 |
| 60–69 | 4 | **6** |
| 70–79 | 3 | **5** |
| 80+ | 2 | **3.5** |

**Overall first impression:** **5.6 → ~6.9 / 10**

NL default + complete title drive most of the senior gain. Landscape still hurts older users on rotate.

---

## Remaining issues

**P0:** none blocking deploy for this presentation pass  

**P1:**  
- Phone landscape listing visibility still ~0–5% (needs further feed-first landscape)  
- Production AW path should be re-probed post-deploy (local often AW OFF)  
- Thin/sold-out first listing supply (content, not chrome)  

**P2:** ultrawide density; jargon (HCP/Reputation); further chip touch targets  

**Out of scope:** `OUT_OF_SCOPE_ARCHITECTURAL_DEPENDENCY` — feed ranking rewrite, geo architecture rewrite, consent legal model change  

---

## Deployment

Filled after push/deploy in this session.
