# HCP Anti-Gaming

**Phase:** 3K  
**Last updated:** 2026-07-06

---

## Blocked patterns

| Pattern | Detection | Example |
|---------|-----------|---------|
| `self_referral` | Invitee === user or source owner === user on invite actions | User invites own business |
| `fake_workshop_loop` | `workshopRepeatCount >= 3` | Repeated workshop host claims |
| `review_farming` | Review linked to HELP_NEIGHBOR completion | Help-for-review loops |
| `invitation_spam` | `invitationCount24h > 5` | Mass invite farming |
| `trust_manipulation` | Forbidden in contract validation | Any trust-tier side effect |
| `duplicate_source` | Suppress duplicate actions in resolver | Same action twice per session |
| `velocity_farming` | Daily + weekly caps + cooldowns | Rapid repeat awards |

---

## Verification requirement

Most opportunity and helper rewards require `isVerifiedCompletion === true`.

Generic `COMPLETE_ACTIVATION` may track unverified starts; payout evaluation still runs anti-gaming.

---

## Caps (anti-farming)

- Per-category **daily** and **weekly** caps
- Per-source **maxPerSourcePerDay** = 1
- Cooldown hours between awards per ledger key

---

## What HCP must never do

- Boost discovery feed ranking
- Alter trust tiers or seller reputation
- Inflate reviews or review visibility
- Increase listing visibility or recommendation slots
- Gate activations or opportunities (no `hcp_gate`)

---

## Evaluator

`passesAntiGaming()` → `evaluateHcpRewardEligibility()` → resolver returns `null` when unsafe.
