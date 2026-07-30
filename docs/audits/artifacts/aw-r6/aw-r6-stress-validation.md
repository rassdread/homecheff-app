# AW-R6 stress validation (pre-freeze technical)

Production-style fail-closed and continuity scenarios exercised via dedicated tests, validator, Chromium forced-negatives (85), and rollback contract.

| Scenario class | Result |
| --- | --- |
| Repeated sealed reader / probe | deterministic; no remount |
| Feed ON / promotion atomic | PASS |
| Dual authority attempt | fail closed |
| Mount / request identity change | fail closed |
| Wrong bridge / reader / MetaOk | fail closed |
| Rollback → AW-R5 | PASS |
| Single GeoFeed / single writer / single renderer | PASS |

## Verdict

**PASS**
