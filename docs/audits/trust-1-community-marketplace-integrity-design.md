# TRUST-1 — Community Marketplace Integrity (DESIGN ONLY)

LEGAL-2 deliverable appendix. **No implementation in LEGAL-2.**

## A. Existing report/moderation infrastructure

| Piece | Notes |
|-------|--------|
| `Report` Prisma model | `listingId?` → legacy `Listing`; statuses OPEN/UNDER_REVIEW/RESOLVED/DISMISSED |
| `AdminAction` | Links to reports |
| `POST /api/reports/create` | Writes `AnalyticsEvent` `USER_REPORT` — **not** Report rows for Products |
| `ReportContentButton` | User-facing report UI |
| Admin | `ContentModerationDashboard`, `TrustQueuePanel`, `/api/admin/trust-queue` |
| Image moderation | Separate ML/category path |

**Gap:** Product marketplace offers lack a first-class report owner tied to `Product.id`.

## B. Existing listing lifecycle

- `Product.isActive` (boolean) — seller pause/hide; **must not overload** with community moderation
- Legacy `ListingStatus`: DRAFT/ACTIVE/PAUSED/REMOVED/MODERATED
- `DishStatus`: PRIVATE/PUBLISHED

## C. Recommended report owner/model

New `ListingIntegrityReport` (name TBD) keyed by:

- `productId` (canonical for marketplace offers)
- optional `dishId` for inspiration-only
- `reporterId`, `reason`, `explanation?`, `status`, timestamps
- **Do not** reuse legacy `Report.listingId` alone

## D. Recommended moderationStatus

Separate from seller lifecycle:

`ACTIVE | UNDER_COMMUNITY_REVIEW | MODERATOR_HIDDEN | REMOVED`

Store on Product (or side table) — **not** sold/paused/draft.

## E. Proposed report reasons

`NOT_SELF_MADE`, `GENERIC_RESALE`, `UNTRANSFORMED_SECOND_HAND`, `SERVICE_NOT_PERSONALLY_OFFERED`, `MISLEADING_DESCRIPTION`, `UNSAFE_OR_PROHIBITED`, `SPAM`, `SCAM`, `WRONG_CATEGORY`, `OTHER`

## F. NOT_SELF_MADE

Primary HomeCheff-specific reason: mass-produced / AliExpress / untouched second-hand presented as homemade/personal. Signal only — HomeCheff decides.

## G. Reporter deduplication

- One active report per `(reporterId, productId, reason)` (or per listing while OPEN)
- No self-report
- Hide reporter identity from seller

## H–J. Anti-brigading / thresholds

Do **not** ship `3 raw reports = takedown`.

Weighted signals: unique accounts, age, verified email, prior valid reports, reason severity/diversity, duplicate device/IP (privacy-aware), seller/listing history.

Suggested **configurable** thresholds (ops-tunable, not hard-coded forever):

1 credible → record  
2 independent credible → moderation priority  
3+ → temporary `UNDER_COMMUNITY_REVIEW` hide  

High-severity (`UNSAFE_OR_PROHIBITED`, `SCAM`) → immediate priority / optional fast hide with human review.

## K–Q. Hide / notify / restore / remove / appeal

- Temporary hide reversible via moderator RESTORE
- Seller notified only when action warranted (“tijdelijk verborgen…”) — never “User X reported you”
- Internal alert via admin queue + support@ / operator config (no personal emails)
- REMOVE / WARN / REQUEST_CHANGES / optional seller suspend via existing suspension
- Appeal path: seller can request review; moderator resolves

## R–T. Feed / search / profile exclusion

Filter via eligibility (`moderationStatus in discoverable set`) — **do not rebuild GeoFeed**. Same boundary for search and profile listing grids.

## U–W. Privacy / abuse / false reports

- Reports not public counts
- Reporter PII not exposed to seller
- False-report abuse itself moderated
- Retention policy for report text (LEGAL-6 adjacent)

## X. DB/schema proposal (future)

```
ListingIntegrityReport { id, productId, reporterId, reason, explanation, status, createdAt, … }
Product.moderationStatus String @default("ACTIVE")
Product.moderationHiddenAt DateTime?
// unique(reporterId, productId, reason) where status OPEN
```

## Y. Expected files (future)

`lib/trust/…`, `app/api/listings/[id]/report`, admin integrity queue UI, notification templates, eligibility helpers used by feed/search/profile.

## Z. Recommended TRUST-1 phases

1. Schema + report API + dedupe + admin queue (no auto-hide)  
2. Weighted priority + temporary hide + seller/admin notifications  
3. Restore/remove/appeal + eligibility filters (feed/search/profile)  
4. Abuse analytics / false-report moderation  

**Do not auto-start TRUST-1 after LEGAL-2.**
