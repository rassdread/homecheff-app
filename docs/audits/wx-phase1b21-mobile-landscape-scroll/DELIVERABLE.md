# WX Phase 1B.2.1 — Mobile Landscape Scroll Freeze (Incident Fix)

**Incident verdict:** `WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_PASS`  
**Severity:** PRODUCTION UX BLOCKER  
**Status:** `READY_FOR_INCIDENT_REVIEW`
**Implementation commit:** `d1e9b90b8b473f8c31e2234afcf2df7638ad0fee`  
**Branch:** `wx/phase-1b2-1-mobile-landscape-scroll`  
**Production runtime (rollback):** `5fe0da7855ab7bbf9c4bd6a03f3dca80a423acc4`  
**Branch base:** `a17cbbf6ff58d3010d3911a5917c7706c0bc6524` (1B.2 freeze docs tip on main)  
**Deployment at incident:** `dpl_B7wxJFSfdYuTg3nBTRQzcDLH71Et`

**Not authorized:** merge · deploy · WX Phase 1B.3 · WX Phase 1B.4 · landscape menu redesign

---

## 1. Incident Verdict

Live production reproduced a mobile-landscape feed freeze when the multi-column Workspace frame activated (`supportingPanelCount ≥ 1`). The root `<section>` used fixed `100dvh` height + `overflow: hidden` while the intended feed scroll owner (`#homecheff-feed-desktop`) was not height-bounded, so content was clipped with no working vertical scroll.

Minimum safe fix: propagate bounded height through primary/rail slot hosts and Region/Slot/Panel wrappers so `#homecheff-feed-desktop` becomes the scroll owner under the multiCol frame.

Local browser proof: **all landscape fixtures** show `feedCanScroll=true`, `feedMoved=true`, and touch-drag movement where exercised. Portrait keeps window/document scroll. Mount IDs stable across orientation journey.

---

## 2. Live Reproduction Matrix

Source: `docs/audits/wx-phase1b21-mobile-landscape-scroll/live-reproduction.json` against `https://homecheff.eu`.

| Viewport | Mode / layout | Panels | Workspace | Feed scroll | Result |
| --- | --- | --- | --- | --- | --- |
| 390×844 | browse / mobile-portrait | 0 | overflow visible | not owner (window) | scrolls (window) |
| 844×390 | hybrid / tablet-landscape | 1 | `overflow:hidden` ~310px | `ch===sh`, not scrollable | window may move; **feed frozen** |
| 430×932 | browse / mobile-portrait | 0 | visible | — | short-content edge |
| 932×430 | hybrid / tablet-landscape | 1 | `overflow:hidden` | not scrollable | feed frozen risk |
| 360×740 | browse / mobile-portrait | 0 | visible | — | short-content edge |
| **740×360** | hybrid / tablet-landscape | 1 | `overflow:hidden` ~280px | not scrollable | **frozen** |
| 375×812 | browse / mobile-portrait | 0 | visible | — | short-content edge |
| 812×375 | hybrid / tablet-landscape | 1 | `overflow:hidden` | not scrollable | feed frozen risk |

Key live chain (740×360): primary host ~113px; feed ~393px unconstrained; section `overflow:hidden` clips → freeze.

---

## 3. Scroll-Owner Map

| Context | Scroll owner (intended) | Pre-fix actual | Post-fix |
| --- | --- | --- | --- |
| Phone portrait | `window` / document | window (workspace `overflow:visible`) | unchanged |
| Phone landscape (multiCol) | `#homecheff-feed-desktop` | **none** (section clips; feed unbounded) | feed (`overflow-y:auto`, bounded) |
| Tablet landscape | feed column | broken same way when multiCol | feed |
| Desktop multiCol | feed column | same height-chain gap | feed |

Ancestor chain (GeoFeed → root): feed → stage → panel → slot → region → **primary host** → **workspace section** → controlled-host (`contents`) → page shell → main → body → html.

Freeze element: workspace `<section.hc-wx-frame>` with `overflow:hidden` without a working inner scroller.

---

## 4. Root Cause

See `ROOT_CAUSE.md`.

| Field | Value |
| --- | --- |
| File | `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx` |
| Rule | `multiCol` → `h-[calc(100dvh-5rem)] overflow-hidden` |
| Condition | Landscape width ≥ 640 → `supportingPanelCount = 1` |
| Computed | Section clips; Region/Slot/Panel lacked `h-full min-h-0`; feed `clientHeight === scrollHeight` |
| Portrait OK | No multiCol frame → document scroll |
| Landscape fail | MultiCol frame without height propagation |
| Proof gap | Prior 1B.2 probes accepted window scroll as success |
| Scope | Fresh landscape load **and** portrait→landscape |

---

## 5. Files Changed

| File | Change |
| --- | --- |
| `FeedWorkspaceVisibleLayout.tsx` | multiCol slot hosts: `h-full overflow-hidden` |
| `WorkspaceRegion.tsx` | `h-full min-h-0` |
| `WorkspaceSlot.tsx` | `h-full min-h-0` |
| `WorkspacePanel.tsx` | `h-full min-h-0` |
| `run-mobile-landscape-scroll-tests.ts` | contract regression |
| `probe-wx-phase1b21-mobile-landscape-scroll.mjs` | live + local proof |
| `package.json` | `test:mobile-landscape-scroll` |
| `docs/audits/wx-phase1b21-mobile-landscape-scroll/*` | evidence |

**Not changed:** GeoFeed · Controlled Host · Mode Engine · Continuity contract · navigation · menu · capabilities (1B.3).

---

## 6. Fix Description

When the multiCol Workspace frame is active:

1. Primary / start / end slot hosts use `h-full overflow-hidden` so the grid row height is a definite containing block.
2. Region / Slot / Panel wrappers use `h-full min-h-0` so height reaches the stage.
3. Existing `#homecheff-feed-desktop` (`flex-1 min-h-0 overflow-y-auto`) becomes the real vertical scroll owner.

Portrait (`supportingPanelCount === 0`) keeps the non-framed layout and window scroll. No JS scroll hacks. No remount. No menu redesign.

---

## 7. Regression Tests

```bash
npm run test:mobile-landscape-scroll
```

| Check | Result |
| --- | --- |
| Landscape carve-out → panels ≥ 1 | PASS |
| Portrait → 0 panels | PASS |
| multiCol host `h-full overflow-hidden` | PASS |
| Region/Slot/Panel height fill | PASS |
| Continuity suite | PASS |

---

## 8. Mobile Browser Proof

Artifact: `browser-proof.json` · local production build · port 3092.

| Viewport | feedMoved | feedCanScroll | touch | frozen |
| --- | --- | --- | --- | --- |
| 390×844 | — (window) | false | — | false |
| 844×390 | true | true | true | false |
| 430×932 | — (window) | false | — | false |
| 932×430 | true | true | true | false |
| 360×740 | — (window) | false | — | false |
| 740×360 | true | true | true | false |
| 375×812 | — (window) | false | — | false |
| 812×375 | true | true | true | false |
| 768×1024 | true | true | true | false |
| 1024×768 | true | true | true | false |

Verdict: `WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_PASS`

---

## 9. Orientation Journey Result

Continuous (no reload): 390×844 → 844×390 → scroll → 390×844 → scroll → 932×430 → scroll → 430×932.

| Claim | Result |
| --- | --- |
| Landscape steps feed-scroll | PASS |
| Mount / shell identity stable | PASS |
| No reload between steps | PASS |

---

## 10. Mount and Ownership Result

| Check | Result |
| --- | --- |
| Shell mount stable | PASS |
| Primary mount stable | PASS |
| GeoFeed owner | unchanged |
| Controlled Host | unchanged |
| Remount on orientation | none observed |

---

## 11. Performance Impact

Negligible: CSS class additions only. No extra observers, remounts, or network identity changes.

---

## 12. Production Readiness Verdict

| Gate | Status |
| --- | --- |
| Root cause evidenced | PASS |
| Minimum safe fix | PASS |
| Contract tests | PASS |
| Local mobile landscape browser proof | PASS |
| Touch/feed scroll proven | PASS |
| Independent review | **PENDING** |
| Merge / prod deploy / live re-proof | **NOT PERFORMED** |
| Incident freeze | **PENDING** |

---

## 13. Rollback Plan

| Item | Value |
| --- | --- |
| Rollback runtime | `5fe0da7855ab7bbf9c4bd6a03f3dca80a423acc4` |
| Action | Revert only the incident-fix merge; redeploy `homecheff-app` |
| DB / data migration | None |
| After rollback | Do **not** continue to 1B.3 until scroll is re-fixed |

---

## 14. Remaining Landscape Requirements (deferred → WX 1B.4)

Explicitly deferred:

- Button/menu removal or compaction in landscape  
- Expanded landscape Workspace capability  
- Contextual landscape rails  

---

## STOP GATE

**STOP.** Do not begin WX Phase 1B.3. Do not begin WX Phase 1B.4. Do not implement landscape button-menu removal.

Wait for incident review → promotion authorization → production deploy → live mobile-landscape proof → incident freeze.
