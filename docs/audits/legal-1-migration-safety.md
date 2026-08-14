# LEGAL-1 — Migration safety note

**Migration:** `20260814120000_legal1_seller_commerce_declaration`  
**Type:** additive only (`ADD COLUMN IF NOT EXISTS`, indexes `IF NOT EXISTS`)  
**Backfill:** NONE — no `UPDATE` of declaration values  
**Defaults:** `commerceDeclaration='UNDECLARED'`, `commerceReviewState='NONE'`  
**Rollback:** deploy previous app revision, then `ALTER TABLE "SellerProfile" DROP COLUMN IF EXISTS ...` for the five commerce* columns (and drop indexes)

## Production data mutation

**NONE** at migrate time (defaults only on new columns for existing rows → UNDECLARED).

## Deploy order (required)

1. Merge PR to main  
2. Explicit approved: `npm run db:migrate:shared` (Neon PITR retained by platform; no auto-migrate in Vercel build)  
3. Production deploy (`npx vercel --prod`)  
4. Smoke: declaration API + create paid offer gate + feed homepage

If migrate cannot be approved → **NO-GO** for production cutover of this feature (code depends on columns).

## Neon / PITR

HomeCheff shared Neon historically retains point-in-time recovery; this migration does not DROP/TRUNCATE/DELETE. Risk class: **low** (additive defaults).
