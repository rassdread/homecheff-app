# Empty-state validation

| Check | Result |
| --- | --- |
| Guided empty when nearby needs location | PASS (`data-wx-empty-guidance` + `data-wx-nearby-empty`) |
| Guided empty when zero confirmed | PASS (create / request / trade / search / widen / invite) |
| Searching without eternal skeletons | PASS (spinner + hint only) |
| Curiosity vs disappointment | PASS — “Nog niets geplaatst…” framing |

Source: `browser-proof.json` · 7/7 `emptyGuidance` or nearby-empty path observed as guidance.
