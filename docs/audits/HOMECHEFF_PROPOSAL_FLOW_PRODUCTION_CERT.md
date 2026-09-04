# HomeCheff Proposal / Offer Flow — Audit, Repair & Certification

**Date:** 2026-09-04  
**Scope:** Marketplace buyer↔seller proposal lifecycle (`homecheff-app`)  
**Workspace note:** Commerce proposals live in `homecheff-app`, not the Studio video-AI repo.

---

## Lifecycle map (as implemented)

```
Listing/Product
  → Chat (StartChatButton / openProposal=1)
  → CreateProposalSheet (configure + review summary)
  → POST /api/conversations/{id}/proposals  (explicit submit only)
  → Message(PROPOSAL) + ProposalCard in chat
  → Counterparty: accept / reject / counter  |  Creator: cancel
  → Accept → Agreement + CommunityOrder (+ checkout / delivery / chat next step)
```

**Statuses (Prisma `ProposalStatus`):**  
`PENDING | ACCEPTED | REJECTED | COUNTERED | EXPIRED | CANCELLED`

No separate Offer/Bid tables. Payment paths: `HOMECHEFF_CHECKOUT | DIRECT_CONTACT | NONE`.

---

## ROOT_CAUSES

1. **Editable listing title** — `ProposalFieldsSection` exposed `marketplace.form.titleLabel` as a free-text input prefilled with the product title, so buyers thought they were editing the listing identity.
2. **Mobile submit unreachable / unclear** — Submit lived at the end of a scrollable `max-h-[90vh]` sheet with **no sticky footer / safe-area**, so on phone (keyboard + bottom nav) the primary CTA could sit below the fold with no persistent action bar.
3. **“Bekijk aanbod” → product page** — Chat context header CTA (`chat.context.viewOffer`) always linked to `/product/{id}`. Users reading a proposal card interpreted that as “open this proposal,” but it opened the listing.
4. **Apparent silent send** — Close did **not** POST; likely confusion from (a) Enter key submitting the HTML form from an input, and/or (b) successful send without a clear “sent” distinction after leaving the sheet. Sheet close = send was never coded; Enter-submit and missing sticky CTA caused the perception.
5. **Proposal detail vs listing** — Proposal terms already render in `ProposalCard`, but there was no clear “Bekijk item” vs proposal framing, so the listing header CTA dominated the mental model.

---

## Fixes shipped

| Area | Change |
|------|--------|
| Listing identity | Product-bound title locked in UI; server forces `product.title`; optional message field separate |
| Snapshot | `proposalSummary` now stores `listingTitle`, `listingImageUrl`, `listingPriceCents` |
| Mobile CTA | Sticky footer + `safe-area-inset-bottom` + `dvh` sheet height |
| Accidental send | Enter in inputs no longer submits; discard confirm on dirty close; submit lock + `Idempotency-Key` |
| Review | Existing `ProposalSummaryPreview` + review hint before send |
| Chat header | CTA → **Bekijk item** |
| Proposal card | “Dit voorstel gaat over” + **Bekijk item** secondary link; card = proposal detail (`#proposal-{id}`) |
| Copy NL | Voorstel versturen / accepteren / afwijzen / Tegenvoorstel / Bekijk voorstel / Bekijk item |

---

## Certification matrix

| Gate | Result |
|------|--------|
| ROOT_CAUSES | Documented above |
| REPORTED_MOBILE_SUBMIT_PROBLEM | **PASS** (code repair: sticky CTA + safe-area + blocked-reason under button) — live device retest still required |
| EDITABLE_LISTING_TITLE_CAUSE | **PASS** (locked + server override) |
| ACCIDENTAL_OR_IMPLICIT_SUBMISSION | **PASS** (Enter blocked; close ≠ send; discard confirm) |
| CHAT_PROPOSAL_CARD | **PASS** (voorstel framing + status + Bekijk item) |
| VIEW_PROPOSAL_ROUTING | **PASS** (proposal = in-chat card; listing = Bekijk item) |
| BUYER_ACTIONS | **PASS** (view + cancel when PENDING creator; server auth) |
| SELLER_ACTIONS | **PASS** (accept/reject/counter when PENDING non-creator; server auth) |
| PROPOSAL_SNAPSHOT_INTEGRITY | **PASS** (listing fields snapshotted; commercial terms in row + summary) |
| DOUBLE_SUBMIT_PROTECTION | **PASS** (client lock + Idempotency-Key header; server race on accept/counter already CAS) |
| PAYMENT_FLOW_PRESERVED | **PASS** (paths unchanged; HC/direct still via accept routing) |
| CASH_FLOW_PRESERVED | **PASS** (`DIRECT_CONTACT` unchanged) |
| BARTER_FLOW_PRESERVED | **PASS** (VALUE_ONLY / MONEY_AND_VALUE + photos unchanged) |
| MOBILE_PORTRAIT | **NOT TESTABLE** in this run (no device session) — static/layout fix applied |
| MOBILE_LANDSCAPE | **NOT TESTABLE** |
| APP_PWA | **NOT TESTABLE** |
| DESKTOP | **NOT TESTABLE** (layout uses `lg:` centered modal; code reviewed) |
| E2E_BUYER_TO_SELLER | **NOT TESTABLE** (no live buyer/seller credentials in this run) |
| PRODUCTION_DEPLOYMENT | **NOT TESTABLE** / pending intentional BCPD after human sign-off |
| TEST_RESULTS | Static validators: `validate-proposal-flow-ux-cert.ts` PASS; `validate-marketplace-proposal-flow.ts` **102/102** PASS |
| KNOWN_LIMITATIONS | No Playwright live buyer→seller on production; Idempotency-Key not yet server-deduped (client-only); EXPIRY automation not re-audited |

---

## Verdict

**HOMECHEFF_PROPOSAL_FLOW_NOT_PRODUCTION_READY**

Release-critical **code defects from the reported journey are repaired and statically certified**, but production certification requires a live mobile buyer→seller proof (portrait + sticky CTA + Bekijk item + accept path) that was **not** executed in this session.
