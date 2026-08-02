# WX Phase 1B.5.4 — Formal Independent Review

**Mode:** Independent formal review (read-only vs feature tip; review artifacts written here only)  
**Branch:** `wx/phase-1b5-4-progressive-disclosure`  
**Feature tip:** `0ff904c4` (`0ff904c497a06019c8bf7173a992c42b35082062`)  
**Compare:** `origin/main` = `3667ae23` (frozen 1B.5.3 Production baseline)  
**Worktree:** `/Users/sergioarrias/homecheff-wx-1b54-impl`  
**Review date (UTC):** 2026-08-02

**Not performed:** merge · deploy · Production freeze · WX Phase 1B.5.5 · source modification · feature commits

---

## 1. Executive Summary

Independent reconstruction from repository source, contract tests, production build, merge-tree, and **re-run** browser/scroll proofs against a live standalone server on `http://127.0.0.1:3120`.

| Gate | Independent result |
| --- | --- |
| Architecture / purity | PASS |
| Contract `wx-progressive-disclosure-v1` `1.0.0` | PASS |
| Ownership (GeoFeed / Host / Registry / Presentation / Assist / Capability) | PASS |
| Diagnostics-only (no disclosure/assist UI) | PASS |
| Portrait document / landscape feed scroll | PASS |
| Regression + lint + smoke + production build | PASS (16/16) |
| Independent browser proof | PASS (10/10 + journey) |
| Independent scroll verification | PASS (8/8 + journey) |
| 1B.2.1 landscape re-run | PASS |
| Merge simulation vs `origin/main` | CLEAN |
| Rollback / migrations | PASS (no Prisma schema/migration delta) |
| Evidence binding Commit A → B → stamp | PASS |

**Browser-proof runtime incident (repaired during review):** first probe attempt hit `ERR_CONNECTION_REFUSED` because the standalone Node process was killed when its parent Shell session ended after logging `Ready`. Port target `3120` was correct; this was not an application defect. Server was restarted as a harness-backed background job and proofs resumed successfully. See `browser-runtime-diagnosis.txt`.

---

## 2. Architecture Review

**Source of truth:** `lib/adaptive-workspace-react/resolve-progressive-disclosure.ts`  
**Layout wiring:** `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx`

Findings (reconstructed, not taken from prior DELIVERABLE claims):

- Progressive Disclosure is a **pure** planning layer: no React, no DOM mutation APIs in resolver body, synchronous, deep-frozen output, sealed `diagnosticsOnly: true`.
- Pipeline in layout:

  Mode → Capability → Presentation → Assist Eligibility → Progressive Disclosure → **diagnostics attributes only**

- Sealed non-driving flags: `drivesChrome: false`, `rendersDisclosure: false`, `activatesCapabilities: false`, `disclosureUiAuthorized: false`, `visualActivationAuthorized: false`, entry `renderAuthorized: false`.
- Diff vs `origin/main` does **not** move GeoFeed ownership, Controlled Host, Workspace chrome ownership, Capability Framework, Presentation Resolver, Surface Registry, or Assist Eligibility resolvers.
- Layout binds disclosure **attributes** on the existing root `<section>`; no disclosure drawer/overlay/panel components.

**Verdict:** PASS (with non-blocking WARNs in §12).

---

## 3. Progressive Disclosure Contract Review

| Field | Observed |
| --- | --- |
| Contract ID | `wx-progressive-disclosure-v1` |
| Version | `1.0.0` |
| Phase | `1b.5.4` |
| Progressive surface IDs (k=5) | `assist-primary`, `assist-secondary`, `tool`, `disclosure`, `utility` |
| States | `hidden` \| `discoverable` \| `disclosed` \| `suppressed` \| `reserved` \| `future-disclosure` |

Diagnostics attributes verified in independent browser snaps:

`data-wx-phase=1b.5.4`, `data-wx-disclosure`, `-version`, `-token`, `-status`, `-renders=0`, `-drives-chrome=0`, `-ids`, `-hidden`, `-discoverable`, `-disclosed`, `-suppressed`, `-reserved`, `-future`

Version consistency checked across resolver constants, unit tests, layout bindings, and probe assertions.

Contract tests (independent): `npm run test:progressive-disclosure-1b54` → **17/17 PASS**.

**Verdict:** PASS

---

## 4. Ownership Review

| Owner | Change vs `origin/main`? | Independent proof |
| --- | --- | --- |
| GeoFeed (`{primary}` in stable feed slot) | No ownership move | Remains child of permanent primary host |
| Controlled Host / shell | Unchanged keys | `hostCount=1`, `shellMountId` stable across journey |
| Workspace / Mode engine | Unchanged modules | Suites PASS |
| Capability Framework | Allowlist-only test touch | `data-wx-cap-visual-activation` still off in proof checks |
| Presentation Resolver | Unchanged module | Suites PASS; attrs retained |
| Surface Registry | Unchanged | Suites PASS |
| Assist Eligibility | Unchanged module | `rendersAssist=0`, zero assist UI |
| Single mount / remount | Continuity keys unchanged | `remount=0`, journey `shellMountStable` + `primaryMountStable` |

Primary slot remains keyed by transition continuity only (not disclosure state).

**Verdict:** PASS

---

## 5. Scroll Ownership Review

Infrastructure gate in layout (`multiCol = plan.supportingPanelCount > 0`):

- non-`multiCol` (phone portrait): `data-wx-scroll-owner="document"`; **no** `overflow-y-auto` / `overscroll-y-contain` on `#homecheff-feed-desktop`
- `multiCol` (landscape phones with rails, tablet+, desktop): `data-wx-scroll-owner="feed"`; overflow + overscroll containment retained

Independent scroll verification (`independent-scroll/`):

| Case | Expect | Observed |
| --- | --- | --- |
| phone-portrait / 320 | document | document |
| phone-landscape / 740 | feed | feed |
| tablet portrait/landscape | feed | feed |
| desktop / ultrawide | feed | feed |

Verdict: `WX_PHASE_1B5_4_SCROLL_VERIFICATION_PASS` (8/8 + journey).  
1B.2.1 re-run: `WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_PASS` (landscape frozen 0/5; portrait frozen 0/5).

**Verdict:** PASS

---

## 6. Browser Proof Review

Independent re-run against production standalone build on port **3120** (not trusting committed probe JSON from Commit B).

| Artifact | Result |
| --- | --- |
| `independent-browser/browser-proof.json` | `WX_PHASE_1B5_4_BROWSER_PROOF_PASS` · **10/10** |
| `independent-browser/cross-mode-journey.json` | `pass=true` · 8 steps · mount stable · no reload |
| Visible disclosure DOM delta | **zero** |
| Visible assist DOM delta | **zero** |
| `disclosureRenders` / `drivesChrome` | **0** on all cases |
| Activation / capability rendering | checks `capOff`, `rendersAssistOff` true |
| Console / page errors | none on passed cases |

**Verdict:** PASS

---

## 7. Responsive Review

Independent disclosure matrix viewports exercised: **320, 390, 740, 844, 768, 1024, 1280, 1440, 1920, 2560** (portrait + landscape samples).  
Scroll matrix: 320/390 portrait, 740/844 landscape, 768, 1024, 1440, 2560.  
1B.2.1 matrix additionally hit **360, 375, 430** portrait and matching landscapes.

Requested width **414** was not a dedicated disclosure-probe row; nearest independent cover is **430** in the 1B.2.1 re-run (non-blocking WARN).

**Verdict:** PASS with WARN (414 not explicitly rowed in disclosure probe)

---

## 8. Regression Review

Independent execution log: `regression-stdout.txt` / `regression-results.tsv`

| Suite | Result |
| --- | --- |
| `test:progressive-disclosure-1b54` | PASS |
| `test:assist-eligibility-1b53` | PASS |
| `test:surface-presentation-1b52` | PASS |
| `test:surface-registry-1b51` | PASS |
| `test:workspace-mode-engine` | PASS |
| `test:workspace-transition-continuity` | PASS |
| `test:mobile-landscape-scroll` | PASS |
| `test:workspace-capability-framework` | PASS |
| `test:landscape-work-posture` | PASS |
| `test:nav-preservation-1b4` | PASS |
| `test:adaptive-workspace` | PASS |
| `test:adaptive-workspace-react` | PASS |
| `test:adaptive-workspace-chrome` | PASS |
| `lint` | PASS |
| `smoke-check` | PASS |
| `npm run build` | PASS |

**Verdict:** PASS

---

## 9. Merge Review

`git merge-tree $(merge-base origin/main HEAD) origin/main HEAD`

| Field | Value |
| --- | --- |
| MERGE_RESULT | **CLEAN** |
| conflict_markers | 0 |
| FEATURE_COMMITS | 3 |
| Merge-base | `3667ae23` (= `origin/main`) |

**Verdict:** PASS — ready for a promotion **decision** (merge itself not performed).

---

## 10. Rollback Review

- Feature is three commits atop frozen 1B.5.3 tip `3667ae23`.
- `prisma/migrations` changed: **0**
- `schema.prisma` changed: **0**
- No DB runtime dependency introduced by disclosure planner.
- Behavioural rollback: omit merge / revert feature branch; scroll-owner gate lives only in layout className/`data-wx-scroll-owner` (no migration).

**Verdict:** PASS

---

## 11. Evidence Integrity

| Item | Independent check |
| --- | --- |
| Commit A `ac3fee19` | Impl/tests/probes; parent = `3667ae23`; includes `resolve-progressive-disclosure.ts` |
| Commit B `607bb171` | Docs evidence only under `docs/audits/wx-phase1b5-4-*`; parent = Commit A |
| Stamp `0ff904c4` | Evidence hash stamp; parent = Commit B |
| Contract tests | Re-run PASS |
| Browser / scroll / ownership | **Re-run** under `independent-*` (not reused Commit B JSON as proof) |
| Prior Commit B pack | Present and consistent, but review treats it as secondary |

Working tree at tip for feature files: clean. Untracked: this formal-review directory only (expected until a later docs commit; **not** committed by this review).

**Verdict:** PASS (with WARN: review pack untracked)

---

## 12. Remaining Warnings

1. **Naming:** state `disclosed` does **not** authorize UI (`renderAuthorized` / `rendersDisclosure` remain false). Downstream must not treat `data-wx-disclosure-disclosed` as a render permit.
2. **Duplicate resolution:** layout resolves Presentation/Assist for their attrs, then `resolveProgressiveDisclosureFromPlans` resolves them again (still O(k), k=5). Drift risk if call sites diverge later.
3. **CI hygiene:** scroll verification probe is not registered as an npm script (disclosure probe is).
4. **Viewport 414:** not an explicit disclosure-probe row; covered indirectly via nearby widths / 1B.2.1 `430`.
5. **Review pack untracked:** `docs/audits/wx-phase1b5-4-formal-review/` is local review output; not part of Commit A/B.
6. **Harness note:** standalone servers started inside ephemeral Shell sessions die on session end — browser proofs must keep the server in a harness-backed background job (runtime ops, not product defect).

None of the above are ownership, contract, DOM, or merge blockers.

---

## 13. Final Verdict

Independent verification supports promotion **decision** readiness. Non-blocking warnings remain.

WX_PHASE_1B5_4_REVIEW_PASS_WITH_WARNINGS  
READY_FOR_WX_PHASE_1B5_4_PROMOTION_DECISION
