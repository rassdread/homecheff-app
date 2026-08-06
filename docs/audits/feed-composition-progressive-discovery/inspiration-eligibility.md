# Inspiration Eligibility Review

| Path | Before | After |
|---|---|---|
| Alles + no location | Nearby eligibility → empty | `resolveInspirationCompositionScope` → national |
| Alles + sparse local | Nearby-only Inspiration | National widen when local sales &lt; 8 |
| Alles + dense local Nearby | Nearby coords-in-radius | Unchanged Nearby |
| Inspiration chip | Inspiration slots only | Unchanged |
| Sale chip | Hidden | Unchanged |
| Search under Alles | Side-effect empty if geo empty | Text match on restored Inspiration pools |

Inspiration still does not require coordinates under national mainland eligibility (place-based OK).
