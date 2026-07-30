# AW-R2 Category C preservation

## Before implementation (baseline)

```
afc2b6839416f846212d48eed6d85ee994213af4  docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json
3f4997faec00a0d5ab61be140dc938c342faca08  docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof-summary.md
b64ca1356837e92ebd6407853228ec54c759d901  docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json
```

Source: `/tmp/phase3b2-catc-awr2-baseline.txt` captured at AW-R2 branch creation from freeze `c281c271`.

## Classification

| Class | Paths | Action |
| --- | --- | --- |
| Category C | `docs/audits/artifacts/phase3b2/*` | Preserved dirty; never staged |
| Category C | Unrelated untracked docs/scripts | Left untracked; never staged |
| Category A | AW-R2 sealed modules, bridge, gate, tests, probes, artifacts | Staged in AW-R2 commits only |

## After proof

Category C phase3b2 paths may regenerate during sealed-baseline Chromium proof. They remain **unstaged** and are not part of the AW-R2 freeze.
