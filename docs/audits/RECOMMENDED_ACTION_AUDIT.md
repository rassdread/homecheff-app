# Recommended Action Audit — Phase 3M

**Date:** 2026-07-06  
**Resolver:** `resolveRecommendedActionPair()`

---

## Sources (priority order)

| Source | Priority basis |
|--------|----------------|
| Activity cards | `critical` 98 → `low` 50 |
| Opportunity economy | `effectivePriority` (default ~75) |
| Community progress | Registry priority 55–95 |
| HCP economy | Fixed 58 |

---

## Output

| Field | Rule |
|-------|------|
| `primary` | Highest priority after dedup |
| `secondary` | Next distinct href+source |

---

## Deduplication

- Same `href` + `source` collapsed  
- Primary and secondary must differ by id  
- Profile module may include up to 3 ranked actions  

---

## Examples (eligible user)

| Condition | Likely primary |
|-----------|----------------|
| Profile &lt; 80% | `FINISH_PROFILE` (community progress) |
| Nearby requests, no helps | `HELP_ONE_NEIGHBOR` |
| Economy opportunity visible | Opportunity CTA |
| High-priority activity card | Activity card |

---

## Anti-gaming

- No passive screen-time actions  
- No self-completion loops  
- Cooldowns inherited from source contracts (`GROWTH_ACTION_COOLDOWN_DAYS` default 7)  

---

## No effects on

- Feed ranking  
- Trust tiers  
- Discovery sections  
- Sponsored inventory  
