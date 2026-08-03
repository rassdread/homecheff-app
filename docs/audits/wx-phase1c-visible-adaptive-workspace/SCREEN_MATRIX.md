# WX Phase 1C — Screen Matrix

Source: `screen-matrix.json` + `browser-proof.json` (local probe, AW ON).

| Viewport | Size | Class | Rails (start/end) | Rail owns filters | Scroll | Result |
| --- | --- | --- | --- | --- | --- | --- |
| phone-portrait | 390×844 | phone-portrait | – / – | 0 | document | PASS |
| phone-landscape | 700×320 | phone-landscape | – / end | 0 | feed | PASS |
| tablet-portrait | 768×1024 | tablet-portrait | – / end | 0 | feed | PASS |
| tablet-landscape | 900×600 | tablet-landscape | – / end | 0 | feed | PASS |
| laptop | 1100×700 | laptop | start / end | 1 | feed | PASS |
| desktop | 1280×800 | desktop | start / end | 1 | feed | PASS |
| ultrawide | 2560×1440 | ultrawide | start / end | 1 | feed | PASS |

Rotation (390×844 → 844×390 → 390×844): primary mount stable, landscape work posture active, portrait restored.
