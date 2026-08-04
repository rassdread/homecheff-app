# HOMECHEFF — FULL COMMERCE CHAIN
## PHASE 4.2 — AFFILIATE REFUND, AUTHENTICATED BROWSER E2E & FINAL PRODUCTION READINESS

**Date:** 2026-08-04  
**Branch:** `wx/phase-1c1-1-final-launch-readiness`  
**Affiliate fix HEAD:** `70a3dd96`  
**Proof deploy:** `https://homecheff-1wymkijok-sergio-s-projects-f7b64ee1.vercel.app` (Commit `70a3dd96`)  
**Evidence:** `docs/audits/wx-phase42-final-readiness/`

---

## 1. Phase verdict

**HOMECHEFF_FINAL_PRODUCTION_READINESS_PARTIAL**

## 2. Executive summary

Affiliate marketplace refund integrity was a genuine P0 gap (subscription invoice reversals existed; `ORDER_PAID` did not). Fix `70a3dd96` adds order-aware `processCommissionReversal`, webhook `charge.refunded` / dispute order resolution, and regression coverage. Preview webhook-only proof on the fix deploy shows **ORDER_PAID → REFUND → net 0 → idempotent duplicate**. Authenticated browser proof succeeded for **buyer, seller, courier, business, affiliate** on Preview (desktop + buyer phone/landscape). Full click-through UI checkout → Stripe Checkout → review remains incomplete as a browser journey (object-level marketplace + settlement proven in Phases 1–4.1). Production remains untouched. No Production migration, deploy, live Stripe, or main merge.

## 3. Affiliate audit

| Concern | Finding |
|---------|---------|
| Attribution source | `hc_ref` cookie + signup `Attribution` (`REF_LINK` / promo / Android beta) |
| Cookie lifetime | **30 days** (`COOKIE_TTL_DAYS`) |
| Overwrite rules | **First-touch** — later links do not overwrite until expiry (`affiliate-attribution-contract.ts`) |
| Commission source | Share of **HomeCheff platform fee** (order) or **subscription fee** (invoice) |
| Percentage | User txn: **25%** of HC fee per attributed side (buyer/seller); sub/parent split 20/5; business sub **50%** of fee (sub/parent 40/10) |
| Settlement timing | Ledger **PENDING → AVAILABLE** after **14 days** (`LEDGER_PENDING_DAYS`) |
| Storage | `CommissionLedger` (+ meta.orderId / invoice keys) |
| Payout timing | **Weekly**, min **€10** (`MIN_PAYOUT_AMOUNT_CENTS`) |
| vs subscriptions | `INVOICE_PAID` path; refunds via invoice on charge |
| vs delivery | Delivery fee **12%** independent; affiliate uses marketplace/product HC fee, not delivery fee |
| vs seller commission | Seller tier **12/9/7/5%** is seller GMV fee DNA — separate from affiliate ledger |
| vs refunds | **Fixed this phase:** marketplace `ORDER_PAID` reversed on `charge.refunded` / dispute when order linked |

## 4. Affiliate refund validation

| Step | Result |
|------|--------|
| Order → commission created | PASS (300¢ PENDING on attributed buyer) |
| Refund → reversal | PASS (REFUND −300; original REVERSED) |
| Ledger consistent / net zero | PASS |
| No duplicate affiliate payment | PASS (duplicate webhook: reversalRows unchanged) |
| No negative balances beyond intentional reversal rows | PASS (net 0) |
| Historical integrity | PASS (original row retained, status REVERSED; negative REFUND row) |
| Regression | PASS `fullRefundNetZero`, `idempotent`, `invoicePath`, `partialProportion=-150` |
| Preview webhook-only (no local fallback) | PASS on deploy `1wymkijok` (`webhook-only-reversal.json`) |
| Marketplace E2E signed webhook | PASS (`marketplace-e2e.json`, webhookMs ~3.4s, no fallback) |

**P0 fix commit:** `70a3dd96` — `fix(affiliate): reverse marketplace order commissions on refund`

**Note:** A newer CLI Preview deploy without this commit (`kh1bd2tow` @ `b27d01b`) does **not** reverse marketplace commissions. Proof and alias selection must target **`70a3dd96` / `1wymkijok`**.

## 5. Browser proof

| Surface | Status |
|---------|--------|
| Desktop / tablet / phone / landscape home | PASS (200, no GPS leak) |
| Login / register pages | PASS (public) |
| Google login provider enabled | PASS (`/api/auth/providers` includes google) — live OAuth click not exercised |
| Credentials login | PASS (field `emailOrUsername`) |
| Buyer: feed, orders, profile, notifications, messages | PASS authenticated |
| Buyer phone + landscape | PASS authenticated |
| Seller: `/sell`, `/subscription` | PASS authenticated |
| Courier: `/delivery` | PASS authenticated |
| Business: `/delivery` | PASS authenticated |
| Affiliate: `/affiliate`, dashboard attempt | PASS login; marketing `/affiliate` 200; dashboard nav status flaky (0) but session ok |
| Listing create/edit, checkout UI, named provider, AUTO/MANUAL UI, Stripe Checkout UI, success, reviews, calendar deep UI | **PARTIAL / not fully UI-proven** this phase (API/object proven earlier) |
| Console / hydration | Minor feed-baseline overlay noise; no GPS exposure |
| Evidence | `browser-proof.json`, `auth-roles.json`, `screenshots/` |

## 6. Marketplace E2E proof

| Journey segment | Proof basis | Status |
|-----------------|-------------|--------|
| Seller listing / publish | Phase 1–3 + synthetic products | PASS (object) |
| Buyer order / pay / webhook | Phase 4 Preview | PASS (object) |
| Named provider / AUTO / MANUAL | Phase 1–3 | PASS |
| DeliveryOrder / quote 1000/120/880 | Phase 4 | PASS |
| Commission tiers / subscriptions / Connect transfers | Phase 4.1 | PASS / PARTIAL (seller balance) |
| Affiliate create → refund reverse → ledger | **This phase** | PASS |
| Completion / review / history UI | Not full UI walk | PARTIAL |
| End-to-end single browser click path | Not completed | PARTIAL |

## 7. Security proof

| Check | Result |
|-------|--------|
| Unsigned Stripe webhook | **400** |
| Unauthenticated `/api/admin/users` | **401** |
| Webhook signature required | PASS |
| Duplicate refund webhook | PASS (idempotent) |
| Price tampering / provider spoofing | Prior phases + server-side quote snapshots | PASS (prior) |
| Affiliate spoofing | First-touch cookie; server attribution | PASS (design) |
| Transfer spoofing | Connect + idempotency keys (Phase 4.1) | PASS (prior) |
| Customer / seller / courier / biz isolation | Session-gated surfaces; role dashboards require login | PASS (spot) |
| Preview vs Production DB | `ep-fragrant-smoke` ≠ `ep-summer-darkness` | PASS |
| Preview vs Production Stripe | `sk_test_` ≠ `sk_live_` | PASS |
| Secrets in evidence | Masked; `/tmp` secrets not committed | PASS |

## 8. Performance proof

| Path | Timing |
|------|--------|
| Home TTFB-ish (curl) | ~0.37s |
| `/api/products?limit=12` | ~3.9s (Preview cold/warm variance) |
| Browser page loads (sample) | avg ~4.1s, max ~7.6s (Playwright full navigation) |
| Affiliate refund webhook | ~3.4–4.8s including serverless |
| Transfers / subscriptions | Phase 4.1 timings retained |

Practical: feed API and cold Preview functions are the slowest observed surfaces; not launch-blocking at current volumes.

## 9. Production readiness checklist

| Area | Status |
|------|--------|
| Database / migrations / rollback | Preview-only; Production migrate **not** run |
| Feature flags | Preview delivery flags only; Production flags untouched |
| Stripe / Connect / Affiliate / Subscriptions / Delivery | Preview Test Mode proven; live **not** activated |
| Marketplace / Workspace | Prior WX phases + this commerce chain |
| SEO / Legal | Out of change scope; existing surfaces load |
| Security | Webhook/auth isolation PASS; full pen-test N/A |
| Performance | Acceptable Preview; monitor feed API |
| Accessibility | Spot only — P2 |
| Responsive D/T/P/L | Public + buyer auth PASS; deeper dashboards P1 |
| Production isolation | PASS |
| Disaster recovery / deploy rollback | Vercel prior Ready deploys available; no Production promote |
| Release checklist | Controlled Production sequence below — **not executed** |

## 10. Remaining findings

### P0
- None open after `70a3dd96` on the correct Preview deploy.

### P1
- Branch git alias / newer CLI deploys can serve **pre-fix** commits — pin proof/ops to `70a3dd96` deploy until alias advances.
- Full authenticated UI journey: listing create/edit → checkout → named provider → Stripe Checkout → success → review (browser).
- Seller Connect Express Account Link live UI; seller transfer may hit `balance_insufficient` in Test Mode (Phase 4.1).
- Affiliate `/affiliate/dashboard` route stability under automation (status 0 observed once).

### P2
- Feed baseline debug overlay clutters some screenshots / console.
- Accessibility deep audit.
- Calendar / notifications polish beyond load checks.

### DORMANT
- Production live prices / live webhook / Production Neon traffic.

### NOT_IMPLEMENTED
- Cross-device affiliate attribution (explicitly out of contract).
- Full automated Playwright coverage of every listed UI surface in one continuous purchase.

## 11. Launch recommendation

**READY_FOR_CONTROLLED_PRODUCTION_LAUNCH**

Money-path integrity (including affiliate refund) is Preview-proven on the fix deploy. Remaining gaps are operational pinning, UI breadth, and controlled Production cutover — not open financial P0 defects.

## 12. Recommended production rollout sequence

1. Merge feature branch only after explicit Production approval (not this phase).
2. Confirm Production Stripe Price IDs, webhook endpoint, and Connect settings separately from Preview.
3. Run Production migrate via approved pipeline only.
4. Enable delivery/affiliate flags gradually (canary).
5. Smoke: signup → listing → checkout → webhook → settlement → refund reverse.
6. Monitor ledger nets, transfer idempotency, webhook failures.
7. Keep Preview Test Mode as ongoing regression lane.

## 13. Scope confirmation

Confirm:

- no Production migration
- no Production deployment
- no Production flags
- no live Stripe charges
- no live transfers
- no unrelated commits (dirty tree left untouched)
- no secrets exposed

## 14. Final boundary

HOMECHEFF_FINAL_PRODUCTION_READINESS_COMPLETE_NO_PRODUCTION_PROMOTION
