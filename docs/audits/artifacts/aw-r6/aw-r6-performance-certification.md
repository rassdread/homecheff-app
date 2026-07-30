# AW-R6 performance certification (vs AW-R5) — pre-freeze technical

| Metric | AW-R5 | AW-R6 | Status |
| --- | --- | --- | --- |
| Mount count | 1 | 1 | PASS |
| Render count | 1 | 1 | PASS |
| Unmount count | 0 | 0 | PASS |
| Remount on sealed read | none | none | PASS |
| Duplicate requests / observers / cache writes | none | none | PASS |
| Bridge/probe extra runtime work | none | none | PASS |

## Verdict

**PASS** — no material regression versus AW-R5.
