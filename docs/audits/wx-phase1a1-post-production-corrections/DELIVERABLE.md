# WX Phase 1A.1 — Post-Production Corrections

**Status:** COMPLETE — awaiting independent Production review (STOP GATE)  
**Verdict:** pending live Production Browser Proof  
**Scope:** Presentation-only corrections to WX Phase 1A. No Phase 1B. No ownership changes.

## 1. Executive summary

Independent live review found four regressions that blocked freezing Phase 1A as complete. This correction phase fixes only those items:

| Issue | Fix |
| --- | --- |
| 1 — Top nav label truncation | Desktop nav is a `shrink-0` cluster (no `overflow-hidden` / no flex-shrink). Labels `whitespace-nowrap`. Language moved to auth cluster. |
| 2 — Weak Orientation Strip | Stronger hierarchy + meta row answering Where / What / Happening — still Workspace chrome, not marketing hero. |
| 3 — Floating HomeCheff brand bar | Site footer on `/` removed; it was the footer Logo sitting under the Workspace dead space. |
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

## 3. Regression resolution matrix

| Finding | Status |
| --- | --- |
| Nav labels fully readable | Fixed |
| Orientation Strip visually stronger | Fixed |
| Floating HomeCheff bar removed/integrated | Fixed (footer suppressed on home) |
| Rails visually continuous | Fixed |
| Feed first viewport | Preserved |
| GeoFeed ownership | Preserved |
| Host COMMIT_READY | Preserved |

## 4. Deferred (still 1B+ only)

Search model · nav IA regroup · contextual rails · landscape posture · motion/typography systems.

## STOP GATE

Do **not** begin WX Phase 1B. Wait for independent review of live Production.
