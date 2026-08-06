# HOMECHEFF — SEO + AI Phase 2 / 2.1 / 2.2 Combined Formal Review

**Reviewer posture:** Independent verification only. Prior phase PASS verdicts were not treated as proof.  
**Candidate tip:** `41eb0eb36269ecd9878310fe812bbe8536878ec7` (`origin/seo/phase2-2-authority-trust`)  
**Reviewed against:** `origin/main` = Production runtime `4989942aa2569a857d1a8a7ed3ac2825fc1f9cab`  
**Date:** 2026-08-04 / 2026-08-05

---

## 1. Executive Summary

The three phases form a **single linear stack**. The only correct combined promotion source is **`origin/seo/phase2-2-authority-trust` @ `41eb0eb3`**. Scope is SEO/AI/entity/authority content and crawler plumbing; Adaptive Workspace was touched only for SSR identity fallbacks. Production build, lint, smoke-check, and AW regression suites pass. Core entity story is consistent across SSOTs, `/llms.txt`, `/ai.txt`, and root JSON-LD. Significant warnings remain: empty client-template FAQ/WebPage JSON-LD shells on pillar routes, soft-200 missing-product status (baseline-shared), and duplicate homepage H1.

**Final verdict:** `SEO_AI_PHASE2_COMBINED_REVIEW_PASS_WITH_WARNINGS`  
**Promotion readiness:** `READY_FOR_PRODUCTION_PROMOTION_DECISION`  
**Not done:** merge, deploy, freeze, Phase 2.3.

---

## 2. Combined Lineage

| Item | Value |
| --- | --- |
| origin/main | `4989942aa2569a857d1a8a7ed3ac2825fc1f9cab` |
| Production runtime SHA | `4989942aa2569a857d1a8a7ed3ac2825fc1f9cab` (Vercel `dpl_AR9ErvZwJsWXNAcc5X3HZ9be6gzM`, redeploy) |
| Phase 2 tip | `f5d02f4d` (docs above behavioural `fce59d16`) |
| Phase 2.1 tip | `a790e9d5` (docs above behavioural `65976f97`) |
| Phase 2.2 tip | `41eb0eb3` (docs above behavioural `40d97c1b`) |
| Merge-base each vs main | `4989942a` |
| 2.1 includes 2? | **YES** |
| 2.2 includes 2.1? | **YES** |
| Topology | **Linear** (not divergent) |
| Combined source | **`origin/seo/phase2-2-authority-trust` @ `41eb0eb3`** |

Docs-only tips sit above each phase’s behavioural tip by design. Independent merge of 2 / 2.1 / 2.2 is incorrect.

Evidence: `lineage.json`

---

## 3. Scope Review

94 files vs main (+2699 / −316). In scope: robots/sitemap, machine routes, JsonLdScript migration, OG/Twitter images, metadata, entity philosophy, authority/trust SSOTs, SEO copy/i18n, rebalance, evidence docs.

**Unauthorized areas:** no Prisma/schema/migration, no API behaviour, no checkout/billing/auth logic, no GeoFeed ownership, no Controlled Host, no planner, no scroll ownership changes.

**AW touch:** `WorkspaceOrientationStrip` (+ home plumbing) receives optional `ssrIdentity` fallbacks only — presentation/copy path, not ownership.

Verdict: **SCOPE_OK** (`scope-audit.json`)

---

## 4. Technical SEO Review

| Check | Result |
| --- | --- |
| Classic `application/ld+json` script tags | **PASS** for root graph + FAQ layout + HomecheffSeoLanding |
| Homepage SSR H1 + definition | **PASS** (non-empty H1; entity strings present) — warn: duplicate H1 |
| `/llms.txt` `/ai.txt` `/.well-known/security.txt` | **PASS** — 200, `text/plain`, no HTML shell, no secrets |
| Robots | **PASS** — public allow; api/admin/checkout/settings disallowed; sitemap+host declared |
| Sitemap | **PASS** — 139 HTTPS `homecheff.eu` URLs; valid urlset; no `/maaltijden/*`; machine routes included |
| Missing product HTTP 404 | **WARN** — `notFound()` + noindex, but status **200** (same as Production baseline) |
| Metadata / hreflang / OG / Twitter | **PASS** on sampled pages; OG image 1200×630 endpoint 200 |

---

## 5. Structured Data Review

Root graph (`buildRootEntityGraphJsonLd`): Organization + legal operator + WebSite; stable `@id`s; verified sameAs only; no AggregateRating/telephone/streetAddress/foundingDate/Review fabrication; policy URLs attached and resolve 200.

`/faq` SSR FAQPage: filled answers including philosophy.

`HomecheffSeoLanding`: filled WebPage/Article + H1.

**WARN:** `SeoLandingTemplate` (client) SSR-emits empty FAQPage/WebPage on pillar/comparison/trust/manifest. HowTo on applicable pillars uses server builders where wired.

Schema types not fabricated as LocalBusiness/Recipe/Event for coverage.

Evidence: `jsonld-validation.json`, `raw-html-crawl.json`

---

## 6. Entity Philosophy Review

SSOTs (`entity-philosophy.ts` → platform, briefs, homepage identity) consistently state:

- digital neighbourhood marketplace  
- community / people / craftsmanship / creator / neighbourhood first  
- “Everything starts close to home.”  
- “Distance determines priority, not possibility.”  
- local-first scalable path neighbourhood → … → Europe (never “international marketplace” branding)

**PASS**

---

## 7. Second-Hand Boundary Review

Permanent distinction present in philosophy, llms/ai briefs, and i18n resale reason: not ordinary second-hand; only restored/upcycled/redesigned/craft-repaired work; value = personal labour/creativity/craftsmanship.

**PASS** (`second-hand-boundary.json`)

---

## 8. Category & Semantic Coverage Review

Balanced coverage across food, garden, handmade, design, repairs, lessons, knowledge, creative services, Wanted, barter, circular/local micro-entrepreneurship via pillars, rebalance landings, intent inventory (gaps documented, no mass doorway spam). No delivery-platform / gig / classifieds identity drift in SSOTs. Sitemap topical food:craft ≈ 1.05 — mild residual food weight (**warn**).

---

## 9. Authority & Trust Review

Brand HomeCheff ↔ operator Arrias Beheer B.V. (KvK 80532829, Vlaardingen) ↔ founder Sergio Arrias (name/role only). Support/press emails only. No invented street/phone/founding date/user counts/partnerships. Pending social/Wikidata documented, not emitted. Trust language explicitly rejects 100% safety guarantees. Policy URLs live.

**PASS**

---

## 10. AI Discoverability Review

Same core story recoverable from homepage raw HTML (Organization/WebSite + body strings), `/llms.txt`, `/ai.txt`, FAQ SSR, manifest/trust surfaces, comparison guidance. Answerability matrix for the required ten questions: **consistent**. Ambiguity risk limited to empty client FAQ shells on some HTML pages (root + machine files remain authoritative).

Evidence: `ai-answerability-matrix.json`

---

## 11. Knowledge Graph Review

Stable names/URLs/`@id`s across entity-graph SSOT, schema builders, machine briefs. One brand entity; legal operator parent; founder relation. No unverified sameAs / Wikidata claims in verified list.

**PASS** (`knowledge-graph-validation.json`)

---

## 12. Local SEO Review

Nearby-first semantics documented. City `/maaltijden/*` hubs excluded from sitemap while noindex-gated. NAP honesty: city+country only; GBP/Apple/Bing **blocked_missing_nap** until real address; docs distinguish prepared vs claimed.

**PASS**

---

## 13. Open Graph Review

`opengraph-image` / `twitter-image` 1200×630 PNG 200; layout uses `summary_large_image` + neighbourhood marketplace copy; not food-only / not 192² logo-only default.

**PASS** with twitter runtime re-export warning.

---

## 14. Security & Trust Discoverability

`/.well-known/security.txt` present (contacts, policy, expires). Production headers previously observed: HSTS, CSP, X-Frame-Options DENY, nosniff. No secrets in machine files/schemas. Local preview HTTP omits some edge headers — noted.

---

## 15. Performance Review

Homepage HTML ~57KB; root JSON-LD 3 scripts; shared First Load JS ~636KB from build; OG PNG generated. No Lighthouse/PSI. No evidence of material hydration/CLS/INP regression from SEO-only changes; AW suites green.

Limitation: bounded local evidence only (`performance-summary.json`).

---

## 16. Regression Review

| Gate | Status |
| --- | --- |
| lint | PASS |
| smoke-check | PASS (pre + post build) |
| production build | PASS_WITH_WARNINGS |
| test:adaptive-workspace-react | PASS |
| orientation / visible-1c / chrome / nav-preservation | PASS |
| geofeed authority transition | PASS |
| dedicated SEO package tests | none — independent probes used |

**NO_PRODUCT_REGRESSION_OBSERVED**

---

## 17. Raw vs Rendered Crawl

Raw non-JS crawl on `127.0.0.1:3456` (combined tip production build): homepage entity + filled root JSON-LD; machine routes plain text; rebalance landing H1 filled; pillar H1 empty until hydration; pillar FAQ/WebPage LD empty shells.

Rendered: Playwright unavailable — inferred hydration fills i18n; limitation recorded in `rendered-crawl.json`.

---

## 18. Merge Simulation

`git merge --no-ff --no-commit origin/seo/phase2-2-authority-trust` into origin/main → **CLEANLY_MERGEABLE**, 0 conflicts. Merge-base equals main tip ⇒ tip build is merge-equivalent. Simulation discarded.

---

## 19. Remaining Warnings

See `warnings.md` (empty client JSON-LD shells; soft-200 404s; duplicate H1; twitter runtime; mild food weight; no PSI/Playwright).

---

## 20. Final Verdict

```
SEO_AI_PHASE2_COMBINED_REVIEW_PASS_WITH_WARNINGS
READY_FOR_PRODUCTION_PROMOTION_DECISION
```

**STOP.** Do not merge. Do not deploy. Do not freeze. Do not begin Phase 2.3.
