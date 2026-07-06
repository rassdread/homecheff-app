# Local Discovery Activations

**Phase:** 3G  
**Category:** `LOCAL_DISCOVERY`  
**Count:** 8

---

| ID | Activation | Trigger signal | 3C ref |
|----|------------|----------------|--------|
| LD01 | Buy from a new maker | `newMakersNearbyCount >= 1` | C07 |
| LD02 | Visit a workshop | workshops nearby/upcoming | W04 |
| LD03 | Pick up order in person | open pickup / pickup nearby | L03 |
| LD04 | Visit local business | `activeNeighboursCount >= 2` | — |
| LD05 | Meet new community member | `newUsersNearby7d > 0` | C01 |
| LD06 | Discover hidden creator | new makers nearby | D01 |
| LD07 | Visit trusted maker | completed deals + location | D07 |
| LD08 | Explore favorite maker | favorites without chat | S02 |

**i18n:** `activations.realWorld.discovery.*`  
**Virality tier:** conversation

---

## Allowed signals

Distance, workshops, orders, favorites, seller relationships, trust tiers (display/eligibility only — not feed rank).

**Forbidden:** views, followers, HCP gates, recommendation ML.
