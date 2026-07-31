# WX Phase 1A — Workspace Foundations

**Status:** COMPLETE — awaiting independent review (STOP GATE)  
**Verdict:** `WX_PHASE_1A_PASS` (local Chromium proof)  
**Constitution:** WDL 1.0  
**Architecture:** AWA frozen · GeoFeed remains data owner · Host `COMMIT_READY` unchanged  

---

## 1. Executive summary

WX Phase 1A changes the **immediate feeling** of the Adaptive Workspace homepage from a marketing-centered responsive page toward a professional Workspace shell — without touching runtime ownership.

| Change | Effect |
| --- | --- |
| Full-width `WorkspaceOrientationStrip` inside the AW grid | Hero becomes Workspace chrome spanning start · stage · end (P4) |
| Marketing `HomeHeroSection` removed from AW ON path | Legacy OFF keeps marketing hero |
| Progressive discovery chrome | Chips first; filters collapsed by default (P5 / P7 lite / P14) |
| Permanent rail + stage chrome frames | Rails remain visually present even when modules are short (P3 / P15) |
| Nav Create CTA | Dominant, `whitespace-nowrap`, `data-wx-primary-action` (P6) |
| Hollow left-rail filters removed on AW | No empty “Ontdekken” chrome (P15 / S1) |
| Tighter shell padding / gaps | Less dead space (P14 / P15) |

**Not done (deferred):** search model redesign, nav IA regroup, contextual rail intelligence, landscape behaviour redesign, motion/typography systems (WX 1B+).

---

## 2. Files changed

| File | Change |
| --- | --- |
| `components/adaptive-workspace/WorkspaceOrientationStrip.tsx` | **New** — compact full-width orientation chrome |
| `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx` | Orientation row; rail/stage chrome; denser gaps |
| `components/home/HomePageClient.tsx` | AW uses orientation strip; marketing hero only when OFF; tighter shell |
| `components/feed/GeoFeed.tsx` | Progressive filter disclosure; `useHasFeedFiltersPanel` |
| `components/home/HomeDesktopLeftSidebar.tsx` | Hide hollow filters; denser stack |
| `components/home/HomeDesktopSidebar.tsx` | Denser gap |
| `components/NavBar.tsx` | Non-truncating dominant Create CTA |
| `app/globals.css` | `.hc-wx-shell` / rail / stage continuity helpers |
| `scripts/probe-wx-phase1a-workspace-foundations.mjs` | **New** browser proof |
| `docs/audits/wx-phase1a-workspace-foundations/*` | Proof artifacts |

---

## 3. Browser proof

| Field | Value |
| --- | --- |
| Verdict | `WX_PHASE_1A_PASS` |
| Base URL | `http://127.0.0.1:3081` with `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on` |
| Viewports | phone portrait/landscape · tablet portrait/landscape · desktop 1440 · ultrawide 2560 |
| Artifact | `docs/audits/wx-phase1a-workspace-foundations/browser-proof.json` |
| Screenshots | `docs/audits/wx-phase1a-workspace-foundations/screenshots/` |

Validated:

- Orientation spans workspace on desktop/tablet  
- First tile in first viewport on desktop / ultrawide  
- Primary CTA present and not truncated  
- Rail chrome present  
- Filters default-collapsed on desktop progressive path  
- `data-aw-feed-data-owner="geofeed"`  
- Visibility tests `20/20` · production build PASS  

---

## 4. Before / after (conceptual)

| Before (AW ON) | After (WX 1A) |
| --- | --- |
| Marketing hero capped at ~720px above grid | Orientation strip spans full workspace grid |
| Fat filter card above listings | Chips + collapsed Filters toggle |
| Hollow left “Ontdekken” | Section omitted when no composed panel |
| Rails end as card stacks | Rail chrome frame fills column height |
| Create could truncate with peers | Dedicated dominant Create button |

Screenshots captured after change (no archived before set in this run): see `screenshots/`.

---

## 5. WDL compliance matrix

### Implemented in 1A

| Principle | Status |
| --- | --- |
| **P1** Workspace first | Partial → feed-first chrome; orientation demoted from billboard |
| **P2** One continuous Workspace | Improved — shell + rail/stage frames |
| **P3** Permanent rails | Improved — chrome frames remain; modules may still be sparse |
| **P4** Full-width orientation | **Done** |
| **P5** Feed immediately visible | **Done** on desktop/ultrawide proof |
| **P6** One primary action | **Done** for Nav Create dominance / no truncate |
| **P14** Reduce vertical friction | **Done** (hero + filter wall + padding) |
| **P15** No dead space | Improved — gutters reduced; stage/rail fill |

### Remaining WDL violations (not 1A)

| Principle | Remaining issue |
| --- | --- |
| P7 Progressive discovery | Only filter collapse; full search mental model still later |
| P8 Clear mental models | Ik zoek / bied / accepted values still compete when expanded |
| P9 Context over navigation | Nav IA unchanged |
| P10 Responsive modes | Behaviour not yet mode-specific beyond layout bands |
| P11 AvailableSpace | Feed still capped; productivity density incomplete |
| P12 Visual hierarchy | Better but nav peers remain |
| P13 Rails contextual | Still mostly static modules |
| P16–P19 | System polish / HomeCheff test deferred |

### Intentionally deferred (STOP GATE)

- WX Phase 1B+ search model / IA  
- Contextual rails / surface-plan bridge (S3 full fix)  
- Landscape work-posture redesign  
- Motion / typography / visual identity systems  
- Nav regroup beyond Create dominance  

---

## Ownership confirmation

| Concern | Owner after 1A |
| --- | --- |
| Requests / cache / pagination / observers / scroll / tiles | **GeoFeed** |
| Presentation layout / AvailableSpace / rails | Adaptive Workspace |
| Controlled Host | **COMMIT_READY** (unchanged) |

---

## STOP GATE

**Do not start WX Phase 1B** until:

1. Independent architecture review  
2. WDL compliance review  
3. UX review  
4. Browser proof review  
5. Explicit approval  

No assumptions about future phases.
