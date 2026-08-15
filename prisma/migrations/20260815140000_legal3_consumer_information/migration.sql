-- LEGAL-3: consumer information flags (additive, no backfill of legal facts).
-- Defaults false = no personalised/perishable exception claimed for legacy listings.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "madeToConsumerSpecifications" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rapidlyPerishable" BOOLEAN NOT NULL DEFAULT false;
