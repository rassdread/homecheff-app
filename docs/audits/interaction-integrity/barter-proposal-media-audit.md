# Barter proposal media audit + minimal extension

**Mode:** audit + smallest safe reuse  
**Main at audit start:** `e7e245fa`  
**Verdict:** `HOMECHEFF_BARTER_MEDIA_NEEDS_MINIMAL_EXTENSION`

## Existing upload

| Fact | Finding |
|---|---|
| Owner | `app/api/upload/route.ts` + `lib/upload.ts` |
| Generic? | **YES** — auth session; no Product ID |
| Storage | Vercel Blob (`uploads/…`); base64 fallback only without token |
| Validation | image MIME jpg/png/webp/gif; size ≤50MB server; client compress |
| EXIF | Canvas recompress → EXIF typically stripped as side effect |
| Orphan cleanup | **No dedicated blob GC** (same as product photos) |

**Classification:** `GENERIC_UPLOAD_REUSABLE` for bytes; persistence needed for proposal linkage → **minimal extension**.

## Persistence chosen

- No Product coupling
- No new Media table / migration
- URLs (max 2, https only) in `proposalSummary.barterOfferImageUrls`
- Copied into `agreementSummary` on accept
- CommunityOrder does **not** duplicate

## Lifecycle (minimal)

- Draft cancel before submit: blob may orphan (existing platform pattern)
- Reject/expire: URLs remain on Proposal row; Agreement absent
- Accept: Agreement snapshot retains URLs even if proposal later edited via counter chain
- Counter: photos **cleared** (not inherited)
- Feed: not loaded

## Security

- Auth upload
- Server rejects non-images
- Persist only `https://` URLs (no `data:` in DB)
