# HomeCheff V22 business profile comparison

## Existing difference

A private seller has no subscription plan badge. A business with a Basic, Pro, or Premium subscription name is rendered by `components/ui/BusinessBadge.tsx` with the plan name and company name. Plan colors differ for Basic, Pro, and Premium. Those colors and the plan names come from the existing visibility profile. Fees and prices were not changed.

`verifiedBusiness` inside the plan config is a plan flag. It is not `Business.verified`. `Business.verified` is set only by the admin compliance action after an attestation. The public legal label "Geverifieerd bedrijf" still depends on that record, not on the paid plan.

## Repair

The badge previously printed "Verified" for every paid plan and "KVK Bedrijf" when no plan matched. Paid plans now say "Abonnement" next to the tier name. The unmatched badge says "Bedrijf". Neither label claims identity verification or a KvK number.

## Not verified in a browser

Desktop and mobile profile pages were not opened. Preview database counts: 2 business records, 0 business subscriptions, 0 workspace projects, 0 marketplace video jobs. There is no paid Basic, Pro, or Premium subscription row in the preview database to compare visually.
