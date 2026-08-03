# Location consistency validation

| Check | Result |
| --- | --- |
| Default scope | `nearby` (UI + legacy persist without explicit scope) |
| Copy vs chips | “dichtbij eerst” aligns with default nearby |
| Wider scope explanation | National / international show `data-wx-scope-hint` |
| Nearby without coords | Location-required empty — not silent national dump |

Probe: `nearbyFirst` PASS on all 7 viewports.
