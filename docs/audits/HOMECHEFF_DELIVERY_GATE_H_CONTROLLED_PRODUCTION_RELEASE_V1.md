# HOMECHEFF_DELIVERY_GATE_H_CONTROLLED_PRODUCTION_RELEASE_V1

## Verdict

**READY_FOR_RESTRICTED_PILOT_DEPLOY = YES**

Production remains unchanged. No push to main. No deploy performed.
Approval gate is required before any production action.

## Verified production base

| Field | Value |
|---|---|
| PRODUCTION_DEPLOYMENT_ID | `dpl_2KbkFaNaAfMg26tbNWnc3whjKNdj` |
| Deployment URL | `homecheff-23tqcx8nq-sergio-s-projects-f7b64ee1.vercel.app` |
| Aliases | homecheff.eu, www.homecheff.eu, homecheff.nl, www.homecheff.nl |
| Status | Ready (production) |
| Created | 2026-10-31 ~00:05 CET (redeploy of `dpl_E6EytdRkBrXtyiSMhfHXMpS6iapC`) |
| VERIFIED_PRODUCTION_COMMIT | `f7baf9414ffbfca3cd9d1cf47fd1f06600ec5c28` |
| Production branch ref | `release/homecheff-business-multi-location-v2` |
| origin/main | `169526bc103857523ac368055bb08cd11c75bf32` (diverged) |

Gate G was integrated onto `origin/main`. Live production was **not** that commit.
Gate H re-based the certified Delivery port onto the verified production SHA.

## Release candidate

| Field | Value |
|---|---|
| RELEASE_BRANCH | `gate-h-delivery-release` |
| WORKTREE | `/tmp/gate-h-delivery-release` |
| GATE_G_INTEGRATION_COMMIT | `0196662f4d49a7f95e40ad44280e660388eb8694` |
| FINAL_RELEASE_COMMIT | `e4762212b15d1cb60421d09e10d0e90ea4bd52b5` |
| WORKTREE_CLEAN | YES (after evidence commit) |
| DIRTY_FEATURES_EXCLUDED | YES (primary workspace `hc-campaign-cert-v3` left dirty, 289 files) |
| Files vs production | 17 (16 Gate G + mobile harness) |
| NEW_MIGRATIONS | NO |
| DATABASE_COMPATIBILITY | YES (no schema change) |

## Mobile browser certification

Evidence: `/tmp/gate-h-mobile-e2e.json`

| Check | Result |
|---|---|
| MOBILE_BROWSER | PASS |
| MOBILE_CHECKOUT | PASS |
| MOBILE_COURIER_SELECTION | PASS (not stuck Searching) |
| MOBILE_TIME_SELECTION | PASS |
| MOBILE_STRIPE_PAYMENT | PASS (test mode) |
| MOBILE_DELIVERY_COMPLETION | PASS |
| MOBILE_UI (overflow / controls) | PASS |
| Buyer viewport | 375×667 touch iPhone |
| Courier viewport | 390×844 touch iPhone |
| Booking | `cmvy21rra00012jz6p1dr9vpm` CONSUMED |
| DeliveryOrder | DELIVERED |
| Seller transfer | `tr_3UX1nWRpYdPVF6LP0tyiTVdp` €5.28 |
| Courier transfer | `tr_3UX1nWRpYdPVF6LP0Qfxurha` €5.81 |

## Connect live (read-only)

### Seller Sergio
- DB user `7647bf21-e9ab-4e3a-af83-eeec23e24dcb`
- Account `acct_1Sj52gRyMYBvOmov`
- charges_enabled=true, payouts_enabled=true, transfers=active
- currently_due=[], disabled_reason=null
- SELLER_CONNECT_LIVE = READY

### Courier Tes (Natercia Silva / TesSilva)
- User `c2ae8bae-343f-4f59-bc0e-15562b97f87e`
- DeliveryProfile `cmtuj15up0001gm0avj2ssuy1`
- Account `acct_1UFilMRr3y6l7PjE`
- charges_enabled=true, payouts_enabled=true, transfers=active
- Agreement accepted 2026-10-30 (`delivery-agreement-2026-10-20-2`)
- Identity VERIFIED; isOnline=false (not a Connect fault)
- On pilot allowlist (profile id + user id)
- COURIER_CONNECT_LIVE = READY
- TES_COURIER_PROFILE = FOUND
- TES_AGREEMENT_STATUS = ACCEPTED

## Safety gates

| Gate | Result |
|---|---|
| CONNECT_NON_WIPE | PASS (7/7 unit tests + classifyConnectAccountRetrieve retained) |
| STRIPE_WEBHOOK | PASS (`we_1SQHOx2KvmKfeN9t0uwLGujx` enabled → https://homecheff.eu/api/stripe/webhook; required events present; signing secret configured in Vercel) |
| FINANCIAL_IDEMPOTENCY | PASS (main implementation retained; mobile E2E transfers once) |
| PUBLIC_DELIVERY_DISABLED | PASS (`HOMECHEFF_DELIVERY_ENABLED` absent in production → defaults false) |
| RESTRICTED_PILOT_INTACT | PASS (`HOMECHEFF_DELIVERY_PILOT=restricted`; allowlists unchanged; unauth booking 401) |
| PRODUCTION_BUILD | PASS (~223s, max RSS ≈ 1.92 GiB, NODE_OPTIONS=4096) |
| MARKETPLACE_SMOKE | PASS (/, login, checkout, product 200 on release candidate) |

## Rollback plan

| Item | Value |
|---|---|
| ROLLBACK_DEPLOYMENT | Redeploy/promote `dpl_2KbkFaNaAfMg26tbNWnc3whjKNdj` (or original `dpl_E6EytdRkBrXtyiSMhfHXMpS6iapC`) |
| ROLLBACK_COMMIT | `f7baf9414ffbfca3cd9d1cf47fd1f06600ec5c28` |
| PROPOSED_RELEASE_COMMIT | `e4762212b15d1cb60421d09e10d0e90ea4bd52b5` |
| Env vars needed | No new required vars; keep `HOMECHEFF_DELIVERY_ENABLED` unset/false; keep pilot restricted allowlists |
| DB | No migration in this release → app rollback does not require DB rollback |
| Stop criteria | Connect wipe regression, public Delivery ON, payment/transfer failures, marketplace checkout break, build failure |

### Rollback procedure (do not execute now)
1. In Vercel, instant rollback to deployment `dpl_2KbkFaNaAfMg26tbNWnc3whjKNdj` (aliases already point here today).
2. Confirm aliases still serve homecheff.eu.
3. Smoke homepage, marketplace, checkout, Connect status.
4. Confirm `HOMECHEFF_DELIVERY_ENABLED` still off / absent.

## Future deployment procedure (prepared, NOT executed)

### Phase A — Release (requires approval)
1. Explicit approval received.
2. Verify FINAL_RELEASE_COMMIT `e4762212b15d1cb60421d09e10d0e90ea4bd52b5`.
3. Re-check live production commit/aliases.
4. Deploy only this commit (no dirty workspace merge).
5. Keep public Delivery OFF.

### Phase B — Immediate smoke
Homepage, marketplace, product, cart, checkout, Connect status, restricted pilot auth, public Delivery OFF.

### Phase C — Pilot
Confirm Tes live Connect; schedule Sergio/Steve/Tes practice; separate approval before real money; pickup/deliver/settlement.

### Phase D — Evaluation
Record results; keep public Delivery OFF until separate approval.

## Open blockers

None for restricted-pilot deploy readiness.

## Required approvals

1. Explicit permission to deploy this release candidate to production for the existing restricted pilot only, with public Delivery disabled.
2. Separate later permission for real charges/transfers.
3. Separate later permission for public Delivery activation.

## Next action

STOP. Ask for deploy approval. Do not push main / deploy / migrate / charge live.
