# WX Phase 1A.1 — Post-Production Corrections

**Status:** COMPLETE — awaiting independent Production review (STOP GATE)  
**Verdict:** `WX_PHASE_1A1_PASS` (Production Browser Proof)  
**Scope:** Presentation-only corrections to WX Phase 1A. No Phase 1B. No ownership changes.

| Field | Value |
| --- | --- |
| Commit | `0c9b1d7fc8d023def4a22473df554ba896a8b517` |
| Deployment | `dpl_4PP4aVEGHaCVWaQzxTXJ3hqfhHpz` |
| Live | https://homecheff.eu |
| Proof | `docs/audits/wx-phase1a1-post-production-corrections/production/` |

## 1. Executive summary

Independent live review found four regressions that blocked freezing Phase 1A as complete. This correction phase fixes only those items — now live on Production with Browser Proof PASS on six viewports.

| Issue | Fix |
| --- | --- |
| 1 — Top nav label truncation | Desktop nav is a `shrink-0` cluster (no overflow clip / no flex-shrink). Labels `whitespace-nowrap`. Language moved to auth cluster. |
| 2 — Weak Orientation Strip | Stronger hierarchy + meta row answering Where / What / Happening — still Workspace chrome, not marketing hero (~165px on desktop). |
| 3 — Floating HomeCheff brand bar | Site footer on `/` removed; it was the footer Logo under Workspace dead space. |
| 4 — Rail continuity | Single `hc-wx-frame` surface; hairline rail dividers; softened nested cards inside rails. |

Ownership unchanged: GeoFeed sole runtime owner · Host `COMMIT_READY`.

## 2. Files changed

| File | Change |
| --- | --- |
| `components/NavBar.tsx` | Non-clipping desktop nav; denser spacing; LanguageSwitcher outside nav |
| `components/adaptive-workspace/WorkspaceOrientationStrip.tsx` | Stronger typography, spacing, orientation meta |
| `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx` | Continuous frame + rail/stage chrome |
| `components/Footer.tsx` | Hide on `/` (WX home) |
| `components/home/HomePageClient.tsx` | Tighter shell padding for frame |
| `components/home/HomeDesktopLeftSidebar.tsx` | CTA label wrap-safe |
| `app/globals.css` | Frame + rail card softening |
| `scripts/probe-wx-phase1a-workspace-foundations.mjs` | 1A.1 proof checks |

## 3. Before / after screenshots

| | Path |
| --- | --- |
| Before (1A Production) | `docs/audits/wx-phase1a-workspace-foundations/production/screenshots/` |
| After (1A.1 Production) | `docs/audits/wx-phase1a1-post-production-corrections/production/screenshots/` |

## 4. Browser Proof

| Field | Value |
| --- | --- |
| Verdict | `WX_PHASE_1A1_PASS` |
| Base URL | `https://homecheff.eu` |
| Captured | `2026-07-31T01:11:20.535Z` |
| Viewports | phone portrait/landscape · tablet portrait/landscape · desktop · ultrawide |
| Failures | 0 |

## 5. WDL compliance

| Principle | 1A.1 |
| --- | --- |
| P6 Primary action readable | Restored — full nav labels + Create CTA |
| P4 Orientation | Strengthened Workspace strip (not marketing hero) |
| P2 / P3 Continuity | Unified frame + permanent rails |
| P14 / P15 Friction / dead space | Footer brand bar removed; denser continuous chrome |

## 6. Regression resolution matrix

| Finding | Status |
| --- | --- |
| Nav labels fully readable | **PASS** |
| Orientation Strip visually stronger | **PASS** (h≈165 desktop) |
| Floating HomeCheff bar removed | **PASS** (footer null on `/`) |
| Rails visually continuous | **PASS** (`hc-wx-frame`) |
| Feed first viewport | Preserved |
| GeoFeed ownership | **geofeed** |
| Host COMMIT_READY | Unchanged |
| Hydration / console (probe) | Clean |

## Deferred (still 1B+ only)

Search model · nav IA regroup · contextual rails · landscape posture · motion/typography systems.

## STOP GATE

Do **not** begin WX Phase 1B. Wait for independent review of live Production.
