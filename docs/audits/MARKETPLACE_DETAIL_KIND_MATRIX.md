# Marketplace Detail Kind Matrix — Phase 4C

**SSOT:** `lib/marketplace/detail/detail-kind-matrix.ts`  
**Last updated:** 2026-07-06

---

## Kind behavior matrix

| Kind | Person role | Route | Review channel | Availability | Value exchange | Desired exchange |
|------|-------------|-------|----------------|--------------|----------------|------------------|
| PRODUCT | seller | `/product/[id]` | product | stock | full | no |
| SERVICE | provider | `/product/[id]` | deal | calendar | full | no |
| TASK | provider | `/product/[id]` | deal | calendar | full | no |
| WORKSHOP | host | `/product/[id]` | deal | event_date | full | no |
| COACHING | coach | `/product/[id]` | deal | calendar | full | no |
| REQUEST | requester | `/request/[slug]` | deal | needed_by | full | **yes** |
| INSPIRATION | creator | `/inspiratie/*` etc. | dish | meta | hidden | no |
| DELIVERY | courier | `/bezorger/[username]` | delivery | none | hidden | no |

---

## Section visibility matrix

Legend: **show** · **hide** · **collapsible** (mobile value_exchange only)

| Section | PRODUCT | SERVICE | TASK | WORKSHOP | COACHING | REQUEST | INSPIRATION | DELIVERY |
|---------|---------|---------|------|----------|----------|---------|-------------|----------|
| hero_media | show | show | show | show | show | show | show | show |
| person_row | show | show | show | show | show | show | show | show |
| value_exchange | show | show | show | show | show | show | **hide** | **hide** |
| trust_block | show | show | show | show | show | show | **hide** | show |
| description | show | show | show | show | show | show | show | show |
| availability | show | show | show | show | show | show | show | hide |
| reviews | show | show | show | show | show | show | show | show |
| related_listings | show | show | show | show | show | show | **hide** | **hide** |
| action_block | show | show | show | show | show | show | show | show |

Mobile: `value_exchange` → collapsible for PRODUCT, SERVICE, TASK, WORKSHOP, COACHING, REQUEST.

---

## Action matrix

| Kind | Actions (in order) | Primary | Mobile sticky |
|------|-------------------|---------|---------------|
| PRODUCT | order, message, save, share, edit | order | order |
| SERVICE | contact, request_proposal, message, save, share, edit | request_proposal | contact, request_proposal |
| TASK | contact, request_proposal, message, save, share, edit | request_proposal | contact, request_proposal |
| WORKSHOP | order, contact, message, save, share, edit | order | order, contact |
| COACHING | contact, request_proposal, message, save, share, edit | request_proposal | contact, request_proposal |
| REQUEST | request_proposal, message, save, share, edit | request_proposal | request_proposal |
| INSPIRATION | save, share, print, message, edit | — | — |
| DELIVERY | message, contact, share | — | message, contact |

---

## Trust primary channel

| Kind | `primaryTrustChannelForKind` |
|------|------------------------------|
| PRODUCT | product |
| SERVICE, TASK, WORKSHOP, COACHING, REQUEST | deal |
| INSPIRATION, DELIVERY | product (fallback; inspiration uses dish reviews outside contract) |

Trust lines: product reviews ⭐ · deal reviews 🤝 · completed agreements 🤝 · deliveries 🚚 · repeat customers 🔁 · badges.

---

## Layout flags

| Kind | Mobile sticky bar | Value exchange collapsible | Desktop sidebar sticky |
|------|-------------------|---------------------------|------------------------|
| PRODUCT–COACHING, REQUEST, DELIVERY | yes | yes (not DELIVERY) | yes |
| INSPIRATION | no | n/a | yes |

---

## Code references

- Behaviors: `DETAIL_KIND_BEHAVIORS`  
- Sections: `buildDetailSectionPlan(kind)`  
- Actions: `DETAIL_ACTION_MATRIX`  
- Layout: `buildMobileDetailLayout` / `buildDesktopDetailLayout`
