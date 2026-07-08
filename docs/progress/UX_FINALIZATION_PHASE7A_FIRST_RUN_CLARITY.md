# UX Finalization — Phase 7A — First-Run Clarity & Seller Entry Fix

Date: 2026-07-08
Type: copy / routing / visibility / microcopy only. No redesign, no new
functionality, no backend/API/marketplace/ranking/payment/performance/design-
system change.

## Report (against the 14 requested items)

1. **Homepage clarity** — `homePhase1.heroDefinition` one-liner (NL+EN) in the
   desktop hero and (for guests) the mobile ecosystem strip; guest discover
   panel body carries the value prop.
2. **Seller entry fixes** — `/sell` now leads with a free-listing block whose
   CTA routes to `/sell/new` (free create flow). Fixing the destination fixes
   all entry points.
3. **Subscription positioning** — subscription grid moved under
   `sell.businessSectionTitle`/`Subtitle` = "Optioneel: zakelijk abonnement
   (KVK / bedrijf) … een upgrade, geen verplichting". No pricing/logic change.
4. **Vocabulary definitions added** — hero definition, how-it-works steps,
   Diensten/Buurthulp defined in the services empty state, barter/accepted-
   values plain-language microcopy.
5. **Naming consistency** — leftover "props" → "Waardering"/"Appreciation"
   across stat/filter/tooltip/login-gate/error strings; requester "Gezochte" →
   "Vrager", "Gezocht door" → "Gevraagd door".
6. **Marketplace jargon removed** — "CommunityOrders" → group orders /
   groepsbestellingen.
7. **Gezocht improvements** — subtitle now signals browse **and** post; label
   fix.
8. **Diensten/Buurthulp clarity** — defined at point of use (services empty
   state), not framed as "future".
9. **Barter / value exchange clarity** — point-of-use example + explicit "nooit
   verplicht / niet gegarandeerd" (no overpromised matching).
10. **New-maker trust** — `publicProfile.newMakerReassurance` replaces the bare
    "nog geen reviews" wall on the seller profile reviews tab.
11. **Typo fixes** — "Geen geldleg" → "Geen betaling" / "No money leg" → "No
    payment" (both occurrences, NL+EN).
12. **Notification translation fixes** — `notificationsPage.*` namespace
    (NL+EN); page no longer hardcodes Dutch header/subtitle/button.
13. **Performance regression report** — none. String + guarded-render edits
    only. All prior guards green.
14. **Deferred items** — see audit §11 (chip subtitles, global /sell nav-label
    renames, remaining hardcoded profile empties, from-vercel snapshots,
    "Product ID" toast, fans/volgers & courier-role renames).

## Files changed

Copy / i18n:
- `public/i18n/nl.json`, `public/i18n/en.json` — new keys
  (`homePhase1.heroDefinition`, `homePhase1.howItWorksStep1..3`,
  `guestSalesPanels.discover.bullet1..3`, `sell.pageTitle/free*/businessSection*`,
  `notificationsPage.*`, `publicProfile.noReviewsTitle/newMakerReassurance`) and
  fixes (props→waardering/appreciation, Geen geldleg, CommunityOrders, Gezocht
  subtitle + requester label, accepted-values/barter, services empty state).

Components / pages:
- `components/home/HomeHeroSection.tsx` — renders the definition line.
- `components/home/HomeMobileEcosystemStrip.tsx` — surfaces definition to guests.
- `app/sell/page.tsx` — free-listing primary block + business section heading.
- `components/seller/PublicSellerProfileNew.tsx` — reassuring reviews empty.
- `app/notifications/page.tsx` — i18n-wired header/subtitle/button.

Deliverables:
- `docs/audits/FIRST_RUN_CLARITY_PHASE7A_AUDIT.md`
- `docs/progress/UX_FINALIZATION_PHASE7A_FIRST_RUN_CLARITY.md`
- `scripts/validate-first-run-clarity-phase7a.ts`

## Validation

```
npx tsx scripts/validate-first-run-clarity-phase7a.ts   → 64 passed, 0 failed
npx tsx scripts/validate-shared-ui-phase6b.ts           → 39 passed, 0 failed
npx tsx scripts/validate-design-system-phase6a.ts       → 53 passed, 0 failed
npx tsx scripts/validate-unified-feedback-phase5e.ts    → 35 passed, 0 failed
npx tsx scripts/validate-discovery-pillars-phase5c.ts   → 43 passed, 0 failed
npx tsx scripts/validate-runtime-performance-phase4c.ts → 26 passed, 0 failed
npm run build                                           → see run log
```
