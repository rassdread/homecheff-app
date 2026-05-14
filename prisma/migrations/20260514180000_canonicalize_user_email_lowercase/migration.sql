-- Canonicalize User.email to trimmed lowercase so application-level uniqueness matches human intent.
-- If this fails with a unique violation, duplicate accounts normalize to the same string — run
-- `node scripts/audit-duplicate-emails.mjs` and resolve before re-applying.
UPDATE "User" SET email = lower(trim(email)) WHERE email IS NOT NULL AND email <> lower(trim(email));
