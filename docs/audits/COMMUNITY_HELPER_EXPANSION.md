# Community Helper Expansion

**Phase:** 3J  
**Last updated:** 2026-07-06

---

## Parent opportunity

`COMMUNITY_HELPER` — category `HELP`, surfaces: desktop sidebar + mobile insert.

When eligible, resolver picks highest-priority **variant** for copy and icon.

---

## Variants (8)

| ID | Focus | Priority |
|----|-------|----------|
| `CHV_BIKE_REPAIR` | Bicycle repair | 86 |
| `CHV_SMALL_JOBS` | Small neighborhood jobs | 84 |
| `CHV_COMPUTER_HELP` | Computer / tech help | 82 |
| `CHV_MOVING` | Moving assistance | 80 |
| `CHV_ELDERLY` | Elderly support | 88 |
| `CHV_GARDEN` | Garden help | 78 |
| `CHV_WIFI_PRINTER` | Wifi / printer help | 76 |
| `CHV_VOLUNTEER` | Local volunteer actions | 74 |

---

## Eligibility signals

| Variant | Primary signal |
|---------|----------------|
| Bike repair, computer, elderly, wifi | `nearbyRequestCount > 0` |
| Small jobs, moving, garden | `practicalServiceRequestCount > 0` |
| Volunteer | `communityActivityScore` or nearby requests |

---

## i18n

`opportunities.economy.communityHelper.variants.{camelCase}.*`

---

## Boundaries

- Opportunity contracts only — **no** service marketplace schema or listing changes
- No payments or ranking
- Variants do not create separate opportunity types in the economy registry
