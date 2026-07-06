# Streak System Audit

**Phase:** 3L  
**Last updated:** 2026-07-06

---

## Streak kinds (5)

| Kind | Title | Counts when |
|------|-------|-------------|
| `weekly_helper` | Weekly helper streak | Verified HELPER category action in ISO week |
| `workshop` | Workshop streak | Verified WORKSHOP category action |
| `community` | Community streak | COMMUNITY or SUPPORT action |
| `local_discovery` | Local discovery streak | LOCAL_DISCOVERY action |
| `support` | Support streak | SUPPORT or HELPER action |

---

## Rules

1. **Real actions only** — `requiresVerification: true` on all milestones feeding streaks
2. **No passive activity** — scroll/login/session depth never counts
3. **Weekly granularity** — consecutive ISO weeks with ≥1 verified action
4. **Anti-inflation** — `maxInflationPerWeek: 1` per streak kind
5. **Cooldown** — milestone cooldowns prevent rapid re-counting

---

## State fields

| Field | Meaning |
|-------|---------|
| `currentWeeks` | Active consecutive week count (capped) |
| `longestWeeks` | Historical best |
| `lastVerifiedAt` | Last week key with verified action |
| `active` | Action in linked categories this week |

---

## Primary streak (sidebar)

`primaryStreak()` — highest `currentWeeks` among active streaks; shown in sidebar plan.

---

## Anti-gaming

| Pattern | Block |
|---------|-------|
| `streak_inflation` | >5 actions counted in one week |
| `fake_loop` | ≥3 repeat loops on same source |
| `passive_farming` | `isPassiveActivity: true` |
| `self_completion` | Actor === source owner |

---

## Evaluator

`resolveStreakState()` → `passesStreakAntiInflation()` → included in `resolveCommunityProgress()`.
