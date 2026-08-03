# WX Phase 1C — Regression Report

| Suite | Result |
| --- | --- |
| `npm run test:adaptive-workspace-react` (incl. 1B.1–1B.5.9 + 1C) | PASS |
| `run-visible-adaptive-workspace-1c-tests.ts` | PASS (7 assertion groups) |
| Prior phase source contracts updated for `data-wx-phase="1c"` | PASS |
| Browser matrix + rotation | PASS |
| Production baseline planners | Untouched (no resolver logic edits to 1B.5.*) |

## Intentional deltas vs 1B.5.9

- Shell phase attribute: `1b.5.9` → `1c`
- Multi-col height: fixed `100dvh-5rem` → adaptive chrome inset
- Scroll owner attr reads `visiblePlan.scrollOwner` (same semantics)
- AW ON: start-rail filters filled via portal; stage compact when dual-rail
