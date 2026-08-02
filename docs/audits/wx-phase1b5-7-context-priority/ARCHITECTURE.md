# WX Phase 1B.5.7 — Architecture

```
AvailableSpace → Mode → Capability → Presentation → Assist → Disclosure
  → Tool Action → Honesty Density → Contextual Priority
                                              ↓
                                   diagnostics-only attrs
                                   (no reorder / no render)
```

| Rule | Enforcement |
| --- | --- |
| Pure / sync / deterministic | `resolveContextPriority` |
| No DOM / CSS / UA / pixel | Forbidden source patterns |
| No reorder / layout / chrome | Layout only writes `data-*` |
| Fail closed | mismatch → `UNKNOWN` score `0` |

Sealed surfaces: `stage` · `orientation` · `command` · `assist-primary` · `assist-secondary` · `tool` · `disclosure`
