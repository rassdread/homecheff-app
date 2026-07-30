# AW-R5 stress validation

Production-style fail-closed and continuity scenarios exercised via dedicated tests, validator, and Chromium forced-negatives (82 cases).

| Scenario class | Result |
| --- | --- |
| Invalid / partial predecessor | fail closed |
| Feed ON attempt | fail closed |
| Dual owner/writer/renderer attempt | fail closed |
| Zero authority attempt | fail closed |
| Mount / request identity change | fail closed |
| Pipeline / transaction mismatch | fail closed |
| Wrong bridge / reader / MetaOk | fail closed |
| Repeated Workspace certification evaluation | deterministic immutable descriptor |
| Rollback simulation → AW-R4 | PASS (workspace authority preserved; Feed ON false) |
| Single GeoFeed / single writer / single renderer | PASS |

## Verdict

**PASS** — no duplicate requests/observers/cache writers/renderers; no remount.
