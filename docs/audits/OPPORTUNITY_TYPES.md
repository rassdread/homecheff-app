# Opportunity Types Audit

**Phase:** 3I  
**Last updated:** 2026-07-06

---

## Canonical types (10)

| ID | Category | Priority | Show cooldown | Surfaces |
|----|----------|----------|---------------|----------|
| `PARTNER` | GROW | 90 | 14d | sidebar, profile |
| `AMBASSADOR` | GROW | 72 | 14d | sidebar, mobile, profile |
| `COURIER` | EARN | 85 | 14d | sidebar, mobile, profile |
| `WORKSHOP_HOST` | LEARN | 78 | 14d | sidebar, profile |
| `COMMUNITY_HELPER` | HELP | 88 | 7d | sidebar, mobile |
| `LOCAL_BUSINESS_INVITER` | PARTNER | 65 | 30d | sidebar, profile |
| `SPORTS_CLUB_INVITER` | COMMUNITY | 58 | 30d | sidebar, profile |
| `SCHOOL_INVITER` | COMMUNITY | 55 | 30d | profile |
| `MUNICIPALITY_INVITER` | GROW | 50 | 60d | profile |
| `EVENT_ORGANIZER` | LEARN | 60 | 14d | mobile, profile |

---

## Mapping to SurfaceRouter modules (3E)

| 3I type | 3E module ID (legacy) |
|---------|----------------------|
| `PARTNER` | `BECOME_PARTNER` |
| `AMBASSADOR` | `BECOME_AMBASSADOR` |
| `WORKSHOP_HOST` | `HOST_WORKSHOP` |
| `LOCAL_BUSINESS_INVITER` | `INVITE_LOCAL_BUSINESS` |
| `SPORTS_CLUB_INVITER` | `INVITE_SPORTS_CLUB` |
| `COMMUNITY_HELPER` | `SUPPORT_NEARBY` |

New in 3I (no 3E module yet): `COURIER`, `SCHOOL_INVITER`, `MUNICIPALITY_INVITER`, `EVENT_ORGANIZER`.

---

## Reward types per type

| Type | rewardTypes |
|------|-------------|
| PARTNER | recognition, badge, future_partner_reward |
| AMBASSADOR | recognition, community_status, badge |
| COURIER | recognition, badge, future_commission |
| WORKSHOP_HOST | recognition, badge, community_status |
| COMMUNITY_HELPER | recognition, community_status, badge |
| LOCAL_BUSINESS_INVITER | recognition, future_partner_reward, badge |
| SPORTS_CLUB_INVITER | recognition, community_status, badge |
| SCHOOL_INVITER | recognition, community_status, badge |
| MUNICIPALITY_INVITER | recognition, community_status, future_partner_reward |
| EVENT_ORGANIZER | recognition, badge, community_status |

---

## i18n namespace

All copy: `opportunities.economy.{camelCaseType}.*`

Benefit keys: `opportunities.economy.{type}.benefit.*`  
Requirement keys: `opportunities.economy.{type}.req.*`
