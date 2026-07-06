# Activation Taxonomy

**Phase:** 3C — Architecture only  
**Last updated:** 2026-07-06

---

## Ten canonical categories

Each activation in the library belongs to **exactly one** primary category. Secondary tags allowed (e.g. `local` + `social`).

| ID | Category | Intent | Real-world outcome |
|----|----------|--------|-------------------|
| `COMMUNITY` | Community | Strengthen neighbourhood fabric | Meet, help, celebrate, belong |
| `LOCAL` | Local | Anchor behaviour in place | Visit, pickup, attend locally |
| `SOCIAL` | Social | Human connection | Message, fan, share, introduce |
| `DISCOVERY` | Discovery | Explore local offer & need | Find maker, request, workshop, inspiration |
| `EARN` | Earn | Enable income & value exchange | Sell, deliver, barter, volunteer contribution |
| `PARTNER` | Partner | Grow platform roles | Courier, ambassador, host, institutional invite |
| `HELP` | Help | Mutual aid | Respond to request, neighbour support |
| `WORKSHOP` | Workshop | Knowledge & skill in person | Attend, host, teach, join class |
| `CREATOR` | Creator | Publish & showcase | First listing, inspiration, workspace, media |
| `BUSINESS` | Business | Local commerce & orgs | Invite shop, club, school, municipality |

---

## Category rules

### COMMUNITY
- Emphasis: belonging, repeat interaction, local pride
- Examples: welcome new neighbour, attend community moment, thank a helper
- Avoid: generic “follow us” social media pushes

### LOCAL
- Emphasis: geography, radius, place name, on-site
- Requires: `has_location` or session geo for eligibility (when implemented)
- Boost when feed `scope=nearby`

### SOCIAL
- Emphasis: conversation, introduction, QR share, invite individual
- Must not use follower counts as **eligibility** (forbidden signal)
- Pair with existing messaging / fan flows

### DISCOVERY
- Emphasis: explore inventory of local offer — **not** algorithmic recommendations
- Triggers: specialization overlap, category interest, unfilled local need
- Never re-rank feed listings

### EARN
- Emphasis: first sale, first delivery fee, barter completion, Stripe connect
- Distinct from BUSINESS (individual maker vs organisation)

### PARTNER
- Emphasis: platform roles and institutional growth
- Sub-roles: `courier`, `workshop_host`, `ambassador`, `business_inviter`, `institution_inviter`
- See partner activation catalog in library IDs `P01`–`P10`

### HELP
- Emphasis: REQUEST listings, neighbour need, voluntary aid
- Pair with `NEARBY_HELP_REQUEST` (3B) and help-request pool signals

### WORKSHOP
- Emphasis: dated events, capacity, location, host preparation
- Signals: `availabilityDate`, workshop listing kind, attendance confirmation

### CREATOR
- Emphasis: profile & catalog completeness for makers
- Maps 3B: `UPLOAD_FIRST_LISTING`, `UPLOAD_FIRST_INSPIRATION`, `COMPLETE_WORKSPACE`, `PROFILE_COMPLETION`

### BUSINESS
- Emphasis: B2B2C local — shops, clubs, schools, gemeente
- Invites are **opt-in** for invitee; no cold spam

---

## Priority bands (cross-category)

| Band | Score range | Use |
|------|-------------|-----|
| Critical | 95–100 | Account safety, legal, first transaction blockers |
| High | 75–94 | Trust, help nearby, post-deal review |
| Normal | 50–74 | Growth, social, discovery exploration |
| Low | 1–49 | Evergreen invites, ambassador nudges |

Inherited from 3B `ActivityCardContract.priority`; activations map 1:1 when surfaced as cards.

---

## Mapping: 3B types → taxonomy

| ActivityCardType (3B) | Primary category |
|-----------------------|------------------|
| `PROFILE_COMPLETION` | CREATOR |
| `REQUEST_REVIEW` | COMMUNITY |
| `SHARE_QR` | SOCIAL |
| `NEARBY_HELP_REQUEST` | HELP |
| `UPLOAD_FIRST_LISTING` | CREATOR |
| `UPLOAD_FIRST_INSPIRATION` | CREATOR |
| `COMPLETE_WORKSPACE` | CREATOR |
| `VERIFY_ACCOUNT` | CREATOR |
| `ADD_WORKSHOP` | WORKSHOP |
| `BECOME_COURIER` | PARTNER |
| `INVITE_FRIEND` | SOCIAL |

---

## Forbidden activation patterns

- Pay-to-boost visibility
- HCP-gated prompts (“earn points to see…”)
- Harassment loops (repeat after dismiss < cooldown)
- Fake urgency (“only 2 minutes left” without real deadline)
- Ranking manipulation (“boost your listing in feed”)
- Sponsored masquerading as activation

---

## Tags (secondary, multi-select)

`first_time`, `repeat`, `seasonal`, `radius`, `post_deal`, `post_workshop`, `partner`, `viral_safe`, `institution`, `barter`, `volunteer`

---

## ID convention (library)

`{CATEGORY_PREFIX}{NN}` — e.g. `L03` = LOCAL #3, `P07` = PARTNER #7.

Full catalog: [ACTIVATION_LIBRARY_100.md](../audits/ACTIVATION_LIBRARY_100.md).
