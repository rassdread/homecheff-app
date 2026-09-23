# Phase 8D — Private Receipt Vault

Private financial evidence storage, attached to seller expenses.

```
STARTING_SHA        = ff3111ef75b55546e93728d96d8611d036c91ad6
COMMIT_SHA          = 244530a06f7a8bface96fad0bfd6fbc0a7e9541b
DEPLOYMENT_ID       = dpl_DrpSvDFXJaeFBcUNxEJxNoim82C5
DEPLOYED_SHA_MATCH  = YES (homecheff.eu serves this deployment)
```

---

## 1. Pre-flight — storage as it stood

Re-audited rather than trusting the 8A findings.

```
CURRENT_PUBLIC_STORAGE          = Vercel Blob, access: 'public', via BLOB_READ_WRITE_TOKEN
PRIVATE_STORAGE_CAPABILITY      = yes, @vercel/blob >= 2.3 (project was on 2.0.1, raised to 2.8.0)
EXISTING_SIGNED_URL_SUPPORT     = none in use
EXISTING_OWNER_BOUND_STORAGE    = none; object paths encode filenames, not owners
EXISTING_OBJECT_DELETION        = partial, per feature
ACCOUNT_DELETION_STORAGE_CLEANUP = did not remove blob objects
```

Every existing upload path — profile photos, listing media, Studio — writes public
objects whose only protection is an unguessable URL. None of it was extended.

## 2. Architecture

```
STORAGE_PROVIDER    = Vercel Blob, separate store "homecheff-receipt-vault" (fra1, EU)
ACCESS_MODEL        = access: 'private' on every call
OBJECT_VISIBILITY   = private; anonymous GET of the object URL returns 403
DELIVERY_MODEL      = bytes streamed through an authenticated HomeCheff route
URL_EXPIRY          = n/a by design — no URL is ever issued
AUTHORIZATION_LAYER = signed session -> ownerUserId in the WHERE clause
```

The vault has its own token, `RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN`. `lib/finance/evidence/vault-store.ts`
is the only module that may touch it and refuses to start without it, so a
misconfiguration cannot silently route a receipt into the public store.

Creating the store overwrote the shared `BLOB_READ_WRITE_TOKEN` in `.env.local`
and in all three Vercel environments, which would have pointed every public
upload at the private store. Corrected: the private token lives under its own
name and the shared variable was restored.

No signed URL is used at all. A private blob URL answers 403 without
credentials, but handing one to a browser would still create a permanent
identifier for a financial document, so it never leaves the server.

## 3–6. Domain model

```
EVIDENCE_MODEL      = SellerFinancialEvidence
EXPENSE_LINK_MODEL  = linkedExpenseId, nullable, ON DELETE SET NULL
MULTIPLE_FILES      = YES, up to 10 per expense
```

`id, ownerUserId, kind, status, objectKey, storeNamespace, originalFilename,
mimeType, sizeBytes, sha256, metadataStripped, linkedExpenseId, uploadedAt,
updatedAt, deletedAt, purgeAfter, purgedAt, purgeAttempts, lastPurgeError`

`kind` is `RECEIPT | INVOICE | OTHER_SUPPORTING_DOCUMENT`; the UI only produces
`RECEIPT`, but the model does not have to change for the others.

`status` is the lifecycle: `UPLOADING → STORED → PENDING_PURGE → PURGED`, with
`MISSING` for a row whose object turns out not to exist.

Ownership is enforced as a query constraint, never as a comparison after a read,
so there is no window between check and use and nothing to confuse. Removing
evidence never touches the `SellerExpense`.

## 7–12. File handling

```
FILE_TYPES            = image/jpeg, image/png, image/webp, application/pdf
MAX_SIZE              = 4 MB, enforced server-side, shown in the UI before upload
MAGIC_BYTE_VALIDATION = YES; declared type must match the bytes
EXIF_POLICY           = stripped for JPEG/PNG/WebP; PDFs stored byte-for-byte
MALWARE_POLICY        = allowlist + magic bytes + size + hostile delivery headers
HASH_POLICY           = SHA-256 over the stored bytes; duplicate warning within one owner only
```

Rejected: HTML, SVG, scripts, executables, archives, truncated files, and
polyglots whose head looks like markup. Filenames never reach the object key —
keys are `ev/{uuid}`, containing no user, expense, filename or extension. The
original name is sanitised for display only, with path separators flattened.

**EXIF.** Stripping is real and verified: a canary string embedded in the APP1,
comment and text chunks is absent from the bytes that come back out of
production. JPEG APP1–APP15 and COM, PNG `tEXt/zTXt/iTXt/eXIf/tIME`, and WebP
`EXIF`/`XMP` chunks are removed, and all three formats still decode afterwards.

The honest consequence is recorded rather than glossed over: the Belastingdienst
only accepts a scan in place of a paper original if it is a complete and faithful
reproduction including its authenticity features, so a stripped raster in this
vault is **not** guaranteed to qualify as a substitute for the original. PDFs are
untouched and do not have this problem. Sellers are told this in the panel.

**Malware.** No scanning infrastructure exists in this stack and none was
invented. There is no "virus scanned" status anywhere.

## 13–15. Flows

Upload: expense → *Bonnetje toevoegen* → file picker or camera → attached. Never
required; an expense exists perfectly well without one.

View: authenticated request, ownership check, streamed response. Delivered with
`Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`,
`Content-Security-Policy: default-src 'none'; sandbox`, `Referrer-Policy: no-referrer`,
`Cross-Origin-Resource-Policy: same-origin`, `Vary: Cookie`. PDFs go out as
`Content-Disposition: attachment` and are never rendered inside HomeCheff's origin.

Delete: the row is marked `PENDING_PURGE` first, which makes the bytes
unreachable through every route immediately, and the object is removed second. A
failure in the second step is therefore a storage-cleanup problem and never an
access-control one. `deleteVaultObject` treats an already-absent object as
success, so retries converge; `/api/cron/evidence-purge` runs every 30 minutes
to retry failures and to sweep uploads that never completed.

## 16–18. Lifecycle

```
EXPENSE_DELETE_POLICY = attached evidence enters the purge lifecycle with the expense
EVIDENCE_DELETE_POLICY = unreadable immediately, object removed, row ends PURGED
ACCOUNT_DELETE_POLICY  = all of that owner's evidence purged; objects removed outside the transaction
RETENTION_POLICY       = kept only while the seller keeps it — no expiry, no silent retention
                         NEEDS_LEGAL_REVIEW on offering a bewaarplicht-grade archive mode
```

`performUserAccountDeletion` marks the rows inside its transaction and purges the
objects after it commits. Admin hard-delete reads the object keys *before* its
transaction, because the rows cascade away with the user and the keys would
otherwise be lost — the one place where best-effort is unavoidable, handled
deliberately.

Retention research is written up in `docs/architecture/RECEIPT-VAULT-RETENTION.md`.
The short version: the 7-year `bewaarplicht` binds the entrepreneur, not a
platform holding a copy, and HomeCheff has no retention basis of its own over a
seller's supplier receipt. So nothing is kept after the seller deletes it.
`RECEIPT_VAULT_PURGE_GRACE_HOURS` exists to introduce a recovery window without a
code change; it does not delay unreadability.

## 19–21. Evidence is not a fiscal fact

```
RECEIPT_CHANGES_DEDUCTIBILITY       = NO
RECEIPT_CHANGES_INVESTMENT          = NO
CONFIRMED_RECEIPT_SEMANTICS_PRESERVED = YES
```

`lib/finance/seller-expense.ts` has no idea evidence exists. Verified in
production on a live expense: after attaching a JPEG and a PDF, `fiscalTreatment`
was still `UNKNOWN`, `confirmationStatus` still `DRAFT`, `source` still
`USER_PROVIDED`, amount and business-use unchanged, and the whole-year fiscal
derivation was byte-identical before and after.

`CONFIRMED_RECEIPT` keeps its stronger meaning — human-confirmed extraction — and
is never set by attaching a file. Phase 8D's concept is only "the seller attached
something". The panel says so: HomeCheff does not check the receipt, and an
attachment proves nothing about the amount, the date or the business share.

## 22–24. No OCR, no analytics, no leaky logs

No OCR, no AI, no extraction, no Studio handoff. No external provider receives
receipt bytes. Asserted by source-level fixtures, not just by intent.

No analytics events were added. The 8D modules contain no analytics call of any
kind.

Logging carries opaque evidence IDs and error *names* only — never messages,
filenames, object keys, URLs or bytes.

## 25–29. Security results

```
OWNER_AUTHORIZATION   = server-side, from the signed session, never from input
CROSS_OWNER_LINK_BLOCK = PASS (404)
LOGGED_OUT_BLOCK      = PASS
DIRECT_OBJECT_ACCESS  = PASS — anonymous GET of the real object URL returns 403
PUBLIC_MEDIA_LEAK     = NO
URL_SECRET_LEAK       = NO
CACHE_ACCOUNT_SWITCH  = PASS
CACHE_POLICY          = private, no-store, must-revalidate, Vary: Cookie
```

The direct-object test used a genuine uploaded object: its key was read from the
database, its real storage URL resolved with the vault token, and both that URL
and its `?download=1` form were then fetched with no credentials. Both returned
**403**. After deletion the same URL still did not return the bytes.

Leak sweep over feed, public profile, sitemap and search for the evidence IDs,
the object key and the filenames: nothing. The page source contains no
`.private.blob.vercel-storage.com` address, no blob token and no object key. The
public store does appear in the page — it serves profile and listing images — and
that is expected and unrelated.

Account switch: seller A fetched their receipt (200), cookies cleared, seller B
signed in, same URL returned **404**, and a `cache: 'force-cache'` request also
returned 404.

Wrong owner is blocked separately for view, download, delete, list and link, and
the owner's own access is unaffected by all the rejected attempts.

## 30–31. Fixtures

`scripts/test-evidence-vault-8d.ts` — **542/542 checks pass**.

```
JPEG = PASS    PNG = PASS    WEBP = PASS    PDF = PASS
WRONG_MIME = REJECTED (415)  SVG = REJECTED (415)  OVERSIZE = REJECTED (413)
PATH_TRAVERSAL = SAFE        WRONG_OWNER = BLOCKED (404)
LOGGED_OUT = BLOCKED         DELETED = BLOCKED
MULTIPLE_FILES = PASS        DUPLICATE = stored, flagged to that owner only
STORAGE_FAILURE_RECOVERY = PASS
```

Storage-failure cases are exercised, not described: upload succeeding while the
database write fails, a row whose object is missing, a failing object delete, and
repeated deletes. Nothing is orphaned silently — a row that loses its object
becomes `MISSING`, a failed purge records its attempt count and is retried.

Account deletion is proven on a disposable account that touches no Stripe object.

## 32–34. Interface

```
DESKTOP = PASS   MOBILE_390 = PASS   LANDSCAPE = PASS   ZOOM_200 = PASS
BOTTOM_NAV = PASS
```

The expense row grows a paperclip with a count; expanding it reveals the drawer.
Nothing here resembles document management software.

All four viewports verified on production by real browser: no horizontal
overflow, the size limit stated before upload, `aria-modal` viewer with an
accessible name, focus landing on the close control, Escape closing it, error
and status messages in live regions, and the delete confirmation naming the file.

Bottom-nav clearance was hit-tested with `elementFromPoint`, not bounding boxes,
which is what caught the defect described below.

## 35. Regression

```
PHASE_8C_REGRESSION   = PASS
PHASE_8B_REGRESSION   = PASS
PHASE_8B2_REGRESSION  = PASS
DAC7_REGRESSION       = PASS
VERDIENCHECK_REGRESSION = PASS
SETTLEMENT/REFUND/DISPUTE/MULTI-RECIPIENT = PASS
BUILD                 = PASS
MIGRATION             = clean, no drift, no unrelated DDL
```

Full suite compared against a clean checkout of the starting commit in a separate
worktree: **48 suites failed at the starting commit, 47 with this work applied.**
Nothing regressed. The 47 are pre-existing failures in the adaptive-workspace,
orientation and final-acceptance domains, unrelated to finance, and the build
reports the same unresolved imports behind them.

## 36. Migration

One additive migration, `20260922210000_phase_8d_private_receipt_vault`: one
table, two enums, indexes and two foreign keys, all guarded so a re-run is
harmless. Validated first as a transactional dry run, then applied. No historical
migration was edited. `prisma migrate status` reports up to date and
`migrate diff` against the live database is empty.

## 37–38. Production certification

Ran against `https://homecheff.eu` on a controlled seller. **36/36 checks pass.**

Created: one `SellerExpense` and four evidence objects. Created: **zero** orders,
transactions, Stripe charges, refunds or transfers. All content synthetic.

```
OBJECT_PUBLIC        = NO
PERMANENT_PUBLIC_URL = NO
OWNER_VIEW           = PASS
WRONG_OWNER_VIEW     = BLOCKED
LOGGED_OUT_VIEW      = BLOCKED
DELETED_VIEW         = BLOCKED
PUBLIC_MEDIA_LEAK    = NO
ANALYTICS_LEAK       = NO
LOG_SECRET_LEAK      = NO

PRODUCTION_UPLOAD       = PASS   PRODUCTION_PRIVATE_VIEW = PASS
PRODUCTION_WRONG_OWNER  = PASS   PRODUCTION_LOGGED_OUT   = PASS
PRODUCTION_PDF          = PASS   PRODUCTION_DELETE       = PASS
PRODUCTION_CLEANUP      = PASS
```

Cleanup verified rather than assumed: **0** evidence rows and **0** expenses
remain, and the private store itself holds **0 objects**.

## Defects found and fixed during certification

Four, all in Phase 8D's own code, all found by testing production rather than by
reading it.

**Refetch loop.** `useTranslation` rebuilds `t` on every render, so listing it as
a dependency of the `load` callback gave it a new identity each render and the
effect calling it refired without end — a browser sitting on an expanded expense
issued list requests continuously. `load` now depends on the expense id alone.
The certification asserts the request count stays in single digits.

**Bottom nav covering the upload control.** At 390×844 the browser scrolled the
control to the bottom edge, where the fixed nav sits on top of it — the same
class of defect Phase 8C hit. Fixed with scroll margins derived from the app
chrome's own `--hc-bottom-nav-offset`; a bottom-only margin then pushed it under
the top bar on a 844×390 screen, so `--hc-top-nav-height` is reserved too.

**Receipt views were slow and erratic.** Measured on production, a single view
ranged from 175 ms to nearly 13 seconds. `auth()` runs HomeCheff's session
callback, which refetches the user and its relations on every call, and the
owner lookup then queried the same user again: three database round trips before
a byte moved, on a route a viewer calls once per image. The content route now
verifies the signed session token directly and takes the id from it — the same
credential, the same signature check, the same `ownerUserId` match on the row,
without paying for profile data it never reads. Upload, list and delete still go
through `auth()`.

**Viewer deadlock.** The loading state I added hid the image until it loaded, and
a `display:none` image is not fetched — so the load event that would reveal it
never fired. The image now stays in the layout with the spinner over it.

## Remaining

```
P0_REMAINING = none
P1_REMAINING = 1
P2_REMAINING = 2
```

**P1 — receipt reads still vary with cold starts.** The three-query authentication
cost is gone, but a cold function plus a cold database connection still puts the
occasional first view above a second. Nothing is broken and the viewer now shows
its loading state honestly, but the route deserves a latency budget.

**P2 — a hard database delete of an expense outside the application leaves its
evidence stored and unlinked.** `ON DELETE SET NULL` detaches it and the sweeper
ignores it, because its status is still `STORED`. The application never does this
— the expense API purges evidence, proven in production — but an operator running
raw SQL could. A periodic check for `STORED` rows with no expense would close it.

**P2 — `NEXT_PUBLIC_VERCEL_BLOB_READ_WRITE_TOKEN` exists in the Vercel project.**
Nothing references it, so nothing is inlined and the shipped client bundle
contains no token — verified. But the `NEXT_PUBLIC_` prefix means the first line
of code that reads it would ship a read-write storage token to every browser. It
predates this phase and should be renamed or removed.

```
NEXT_PHASE = receipt review — extraction or human confirmation, the point at
             which CONFIRMED_RECEIPT finally means something
```

---

```
FINAL_DECISION = HOMECHEFF_PRIVATE_RECEIPT_VAULT_PRODUCTION_CERTIFIED
```

Certified on the evidence above: the object is private in production, the only
route to the bytes authorises every request against the signed session, and a
wrong owner, a signed-out browser, a deleted item and a direct request to the
real storage URL were each proven to come away with nothing.
