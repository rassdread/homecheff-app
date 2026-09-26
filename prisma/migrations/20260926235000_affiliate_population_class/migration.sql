-- Identity class is separate from program enrollment history.
-- Existing rows start as technical. Known production classes are set below.
-- Tombstoned affiliate users from the forensic audit stay in place; they are excluded, not deleted.

ALTER TABLE "Affiliate" ADD COLUMN "populationClass" TEXT NOT NULL DEFAULT 'TECHNICAL';

CREATE INDEX "Affiliate_populationClass_idx" ON "Affiliate"("populationClass");

UPDATE "Affiliate" AS a
SET "populationClass" = 'EXCLUDED_TEST'
FROM "User" AS u
WHERE a."userId" = u.id
  AND u."accountDeletedAt" IS NOT NULL;

UPDATE "Affiliate" AS a
SET "populationClass" = 'COMMERCIAL'
FROM "User" AS u
WHERE a."userId" = u.id
  AND u."accountDeletedAt" IS NULL
  AND lower(u.email) IN (
    'michelle_veronique@hotmail.com',
    'leandrokalop@gmail.com',
    'goldensoulc@gmail.com',
    'junior-collins@live.nl',
    'silvanatercia87@gmail.com',
    'wioleta-siwo@outlook.com'
  );

UPDATE "Affiliate" AS a
SET "populationClass" = 'REVIEW_REQUIRED'
FROM "User" AS u
WHERE a."userId" = u.id
  AND u."accountDeletedAt" IS NULL
  AND lower(u.email) IN (
    'mahmudkahn1@gmail.com',
    'jumholika@gmail.com'
  );

UPDATE "Affiliate" AS a
SET "populationClass" = 'INTERNAL'
FROM "User" AS u
WHERE a."userId" = u.id
  AND u."accountDeletedAt" IS NULL
  AND lower(u.email) IN (
    'admin@homecheff.eu',
    'r.sergioarrias@gmail.com'
  );

UPDATE "Affiliate" AS a
SET "populationClass" = 'TECHNICAL'
FROM "User" AS u
WHERE a."userId" = u.id
  AND u."accountDeletedAt" IS NULL
  AND lower(u.email) = 'sergio@homecheff.eu';
