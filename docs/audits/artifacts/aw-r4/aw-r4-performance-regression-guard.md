# AW-R4 performance regression guard (vs AW-R3)

Comparative sealed-baseline Chromium evidence on port 3072.

| Metric | AW-R3 | AW-R4 | Status |
| --- | --- | --- | --- |
| GeoFeed mount count | 1 | 1 | PASS |
| GeoFeed render count | 1 | 1 | PASS |
| Unmount count | 0 | 0 | PASS |
| Instance count | 1 | 1 | PASS |
| Remount during transition | none | none | PASS |
| Duplicate initial/filter/pagination request | none | none | PASS |
| Observer duplication | none | none | PASS |
| Cache write duplication | none | none | PASS |
| Stable mount id | preserved | preserved | PASS |
| Scroll / filter / pagination state | preserved | preserved | PASS |

## Verdict

**PASS** — no material regression vs AW-R3. Not final AW-R5 certification.
