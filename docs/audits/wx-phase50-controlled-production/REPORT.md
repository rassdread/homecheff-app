# HOMECHEFF — PRODUCTION RELEASE
## PHASE 5.0 — CONTROLLED PRODUCTION LAUNCH

**Date:** 2026-08-05  
**Release merge:** `a4d4c2c2`  
**Rollback tag:** `prod-phase50-pre-merge` (`4989942a`)  
**Production deploy:** `homecheff-9d2wjo73q` (redeploy with flags) aliased to `homecheff.eu` / `homecheff.nl`  
**Evidence:** `docs/audits/wx-phase50-controlled-production/`

---

## 1. Release verdict

**CONTROLLED_PRODUCTION_RELEASE_PARTIAL**

## 2. Executive summary

Validated commerce/delivery/affiliate work was merged to `main`, three additive Production migrations applied, Production redeployed, and delivery feature flags activated. Stripe Live Price IDs were repaired (trailing `\n` removed). Live Checkout Session create/expire proved Live wiring without completing a charge. A full paid Production order → webhook → settlement → refund chain was **not** completed in this window (no operator card capture). Rollback tags and prior Production deploy remain available.

## 3. Pre-release audit

| Check | Result |
|-------|--------|
| Release branch | `wx/phase-1c1-1-final-launch-readiness` @ `a4fb27f6` |
| Main before merge | `4989942a` (WX 1C.1.2) |
| Divergence | 6 ahead / 6 behind — merge-tree clean (auto-merge) |
| Migrations | 3 additive SQL files pending on Production |
| Production DB | `ep-summer-darkness` (≠ Preview) |
| Production Stripe | `sk_live_` / `pk_live_` / webhook enabled |
| P0 found | `STRIPE_PRICE_*` contained literal `\n` — **fixed before promote** |
| Failed historical migrations | Rolled-back duplicates only; last applied greenfield baseline |

## 4. Merge verification

| Item | Value |
|------|--------|
| Merge commit | `a4d4c2c2` `merge(commerce): promote delivery marketplace and affiliate refund to Production` |
| Strategy | `--no-ff` from `origin/main` + release tip |
| Conflicts | None |
| Force push | None |
| Tags | `prod-phase50-pre-merge`, `prod-phase50-release` |
| Intended scope | Delivery marketplace + affiliate refund + Phase 4.2 evidence |

## 5. Migration verification

| Migration | Applied |
|-----------|---------|
| `20260804_delivery_named_provider_selection` | ✓ |
| `20260804_delivery_provider_pricing` | ✓ |
| `20260804_delivery_quote_snapshot` | ✓ |

Post-migrate: `DeliveryBookingRequest`, `DeliveryCalendarEntry` present; snapshot/pricing/acceptance columns present. Pre-migrate fingerprint: Users 38, Orders 2, Products 7, DeliveryOrders 0, CommissionLedger 0. No destructive SQL.

## 6. Stripe Live verification

| Item | Result |
|------|--------|
| Account | NL, charges/payouts enabled, livemode |
| Prices Basic/Pro/Premium | 3900/9900/19900 monthly active (IDs cleaned) |
| Webhook | `we_1SQHOx…` enabled → `https://homecheff.nl/api/stripe/webhook` |
| Connect client | Present (`ca_…`) |
| Unsigned webhook POST | **400** |
| Live Checkout Session | Created `cs_live_…` €1.00 then **expired unpaid** (no charge) |

## 7. Feature flag activation log

Activated on Production (then redeployed):

1. `DELIVERY_COMMERCIAL_AGE_GATE_18_ENABLED=true`
2. `DELIVERY_NAMED_PROVIDER_COPY_ENABLED=true`
3. `DELIVERY_PROVIDER_PRICING_ENABLED=true`
4. `DELIVERY_NAMED_PROVIDER_SELECTION_ENABLED=true`
5. `DELIVERY_BUSINESS_PROFILES_ENABLED=true`
6. `DELIVERY_FIRST_ACCEPT_POOL_ENABLED=false`

Live `/api/delivery/alignment-flags`:

```json
{"namedProviderSelectionEnabled":true,"providerPricingEnabled":true,"namedProviderCopyEnabled":true,"firstAcceptPoolRuntimeEnabled":false}
```

## 8. Live smoke-test evidence

| Step | Result |
|------|--------|
| Home / login | 200 |
| Auth providers | 200 (credentials + google) |
| Products API | 200 (~6s) |
| Alignment flags | 200 as above |
| Admin unauthenticated | 401 |
| DeliveryProfile new fields readable | PASS |
| Live Checkout create | PASS (`livemode=true`) |
| Live Checkout expire (no charge) | PASS |
| Full paid order → delivery → affiliate → refund | **NOT RUN** (operator payment required) |

Evidence: `live-smoke-evidence.json`, `smoke-http.json`.

## 9. Monitoring results

| Signal | Observation |
|--------|-------------|
| Production deploy | Ready; aliased to `.eu`/`.nl` |
| Webhook endpoint | Enabled (Dashboard) |
| Errors (spot) | Unsigned webhook correctly rejected |
| Performance | Products API ~6s — monitor |
| Orders / transfers / refunds | No new paid traffic this window |

## 10. Rollback proof

| Layer | Action |
|-------|--------|
| Feature flags | Set pricing/selection/business to `false`; first-accept to unset/`true` |
| Deployment | Redeploy prior Ready: `homecheff-l1b60innu…` or checkout `prod-phase50-pre-merge` |
| Migrations | Additive only — forward-compatible; columns/tables can remain dormant |
| Webhooks | Existing Live endpoint compatible; affiliate reversal is additive handler |

## 11. Post-launch audit

| Area | Status |
|------|--------|
| Marketplace / Workspace / Delivery code | On Production `main` |
| Subscriptions Price IDs | Fixed + verified |
| Affiliate refund code | Deployed (ledger empty until paid attributed orders) |
| Auth | Providers live |
| SEO | Untouched (parallel OK) |
| Responsive | Not re-browsered on Production this phase (Preview proven) |

## 12. Remaining findings

### P0
- None open after Price ID repair.

### P1
- Complete one **paid** Production order + webhook + (optional) refund under operator supervision.
- Confirm Stripe Dashboard webhook deliveries to `.nl` after first live payment.
- Products API latency (~6s) under Production.

### P2
- Expose `commercialAgeGate18Enabled` on public alignment-flags payload (env set; not returned by route).
- Neon CLI backup snapshot automation (fingerprint-only this phase; Neon PITR remains).

## 13. Production recommendation

**PRODUCTION_SUCCESS_WITH_MONITORING**

## 14. Scope confirmation

- no unrelated functionality
- no architectural redesign
- no Preview resources promoted
- no secrets exposed
- only validated functionality released

## 15. Final boundary

HOMECHEFF_CONTROLLED_PRODUCTION_RELEASE_COMPLETE
