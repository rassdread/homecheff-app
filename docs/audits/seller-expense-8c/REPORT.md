# Phase 8C — Seller Expense Administration

Manual expenses + fiscal cost classification foundation.

---

## §0 — Migration state

**The migration named in the brief does not exist as a pending migration.** That name came
from the Phase 8B.2 report, and it was wrong: the 8B.2 pre-flight grep matched a truncated
`prisma migrate status` line and paired it with a name from an unrelated listing.

```
MIGRATION_STATE_BEFORE          = 30 local migrations; DB `_prisma_migrations` held 102 rows.
                                  Last common: 20260911120000_stripe_connect_dual_track.
                                  1 local migration unapplied, 73 DB rows absent locally,
                                  3 historical rows marked failed.

PREEXISTING_UNAPPLIED_MIGRATION = 20260911150000_community_order_fulfillment_location
                                  (NOT 20260708140000_phase_8c_pending_accepted_values)
```

### `20260708140000_phase_8c_pending_accepted_values`

| Question | Answer |
|---|---|
| WHAT_IT_CHANGES | Nothing now. Archived in `prisma/migrations-archive/pre-20260714-greenfield/`. |
| WHY_IT_EXISTS | Part of the pre-greenfield history squashed by Phase 9E on 2026-07-13. |
| WHICH_FEATURE_OWNS_IT | Marketplace "accepted values" work. The `8c` is a **name collision** with this phase. |
| EXPECTED_TO_BE_APPLIED | No — its effects are inside `20260714_greenfield_current_state_baseline`, which is present locally and applied in the DB. |
| PRODUCTION_SCHEMA_ALREADY_EQUIVALENT | Yes. |
| SAFE_TO_APPLY | N/A — nothing to apply. |
| CONFLICT_WITH_THIS_PHASE | None. |

### `20260911150000_community_order_fulfillment_location`

| Question | Answer |
|---|---|
| WHAT_IT_CHANGES | Six nullable columns on `CommunityOrder` (pickup/delivery address, confirmed schedule, location completion). |
| WHY_IT_EXISTS | Commit `914ec613`, "Add post-accept fulfillment location and schedule completion." |
| WHICH_FEATURE_OWNS_IT | Community order fulfillment. Unrelated to finance. |
| PRODUCTION_SCHEMA_ALREADY_EQUIVALENT | **Yes — all six columns verified present in production.** Applied out-of-band without a history row. |
| SAFE_TO_APPLY | Yes; SQL is `ADD COLUMN IF NOT EXISTS`, so applying it is a no-op. |
| CONFLICT_WITH_THIS_PHASE | None. |

```
PREEXISTING_MIGRATION_RESOLUTION =
  Reconciled with `prisma migrate resolve --applied`, as an explicit, separately
  reported step — NOT absorbed into this phase. Its schema effect was already live,
  so recording it as applied states a fact; executing another team's DDL as a side
  effect of a financial migration would not.
  The 73 DB-only rows are the archived pre-greenfield history (expected after the
  Phase-9E squash). The 3 "failed" rows all carry `rolled_back_at`, so Prisma treats
  them as resolved and they do not block deploy.
  `prisma migrate diff` showed ZERO drift between the live schema and the repo apart
  from this phase's own addition.

MIGRATION_STATE_AFTER = "Database schema is up to date!" — 31/31 in sync, divergence
                         fully resolved for the first time since the greenfield squash.
```

---

## §1 — Existing cost domain (reused, not duplicated)

Everything lives under `lib/verdiencheck/domain/`. There is no repo-root `domain/costs.ts`.

| Existing | Status | Decision |
|---|---|---|
| `COST_INPUT_CATEGORY_IDS` (7 buckets) | Production, `VerdienCheckCostAdvantage` | **Reused verbatim** as `EXPENSE_CATEGORIES` and the Prisma enum |
| `COST_LINE_KINDS` = `ORDINARY` / `INVESTMENT` | Production | **Names kept** as `ORDINARY_EXPENSE` / `INVESTMENT` |
| `DeductibleTaxCost {amountCents, ruleKey, packId}` | **Dead — zero imports** | Shape adopted by `DeductibleResolution`, which adds the UNKNOWN arm it lacked |
| `CONFIRMED_RECEIPT` (in `COST_SOURCES`) | **Dead — gates nothing** | Kept as a reserved `SellerExpenseSource` member; nothing writes it (Phase 8D) |
| `parseEuroInputToCents`, `toCentsRoundHalfUp` | Production | Rounding behaviour matched |

**VerdienCheck persists nothing to the database** — `persistenceUsesDatabase()` returns
`false` and the wizard writes only to `sessionStorage`. No Prisma model stored any seller
expense before this phase.

---

## §3 — Official Dutch sources, tax year 2026

Verified against Belastingdienst primary pages. Only these rules are implemented.

| Rule | Finding | Used for |
|---|---|---|
| Zakelijke kosten | Costs serving business interests are fully deductible; all others are not | `ORDINARY_EXPENSE` → deduct business amount |
| Gemengde kosten | Only the business part is deductible | Business share is separate from deductibility |
| Niet-aftrekbaar | Fines, general clothing, personal care, general literature, licence A | `NON_DEDUCTIBLE` → confirmed **€0** |
| Bedrijfsmiddel | **< €450 deduct at once; ≥ €450 must be depreciated** | Threshold **prompts** the investment question |
| Afschrijving | Spread over years of use | No engine → `INVESTMENT` = **UNKNOWN** |
| Beperkt aftrekbaar | **2026 threshold €5.700**, or an 80% election for IB | Year-level choice → **UNKNOWN** |
| KIA 2026 | €2.901–€398.236, 28% | **Not implemented** — year-level regime, out of scope |
| Bewaarplicht | 7 years (10 for immovable property) | Recorded; soft delete keeps years reproducible |
| BTW | Ex-VAT if reclaimable, incl. VAT if not | HomeCheff does not know the seller's VAT position → stores spend **as paid**, documented, no split |

---

## §6–13 — Model and accounting semantics

```
EXPENSE_MODEL   = prisma model SellerExpense (additive; 17 columns, 3 indexes,
                  FK sellerUserId -> User ON DELETE CASCADE)
EXPENSE_SOURCE  = USER_PROVIDED, forced server-side on every write.
                  RECEIPT_CONFIRMED / AI_SUGGESTED / IMPORTED / PLATFORM_DERIVED
                  are reserved; no code path writes them.
CURRENCY_MODEL  = EUR only, explicitly. SUPPORTED_EXPENSE_CURRENCIES is a one-element
                  list and validation rejects anything else. No FX is invented; a
                  non-EUR row is excluded from totals and flags UNSUPPORTED_CURRENCY.
YEAR_SCOPING    = taxYear persisted, derived from expenseDate as a UTC calendar year
                  (same convention as Phase 8B and DAC7). Dates parse as bare
                  YYYY-MM-DD anchored at UTC midnight, so a timezone cannot shift a
                  31 December expense into the next year. Recomputed on every write,
                  so a date edit across a boundary reclassifies deterministically.
```

### The four values, kept apart

```
ACTUAL_SPEND     = amountCents. Integer cents. Always preserved, whatever the treatment.
BUSINESS_SHARE   = businessUseBp, basis points (10000 = 100.00%), two decimals.
                   NULL means "not stated" and resolves to fully business.
                   Labelled in the UI as the seller's own estimate, explicitly not
                   something the Belastingdienst has agreed to.
BUSINESS_AMOUNT  = roundHalfAwayFromZero(amountCents * bp / 10000).
                   Multiply before divide; no intermediate float is rounded twice.
                   €10,01 x 33% = 330 cents (verified).
FISCAL_TREATMENT = UNKNOWN | ORDINARY_EXPENSE | INVESTMENT | NON_DEDUCTIBLE |
                   LIMITED_DEDUCTIBLE
DEDUCTIBLE_AMOUNT= NOT STORED. Derived by resolveDeductible() on every read, so a
                   stale number can never outlive the rule that produced it.
                   Returned as a discriminated union: a caller cannot read `.cents`
                   without first handling the UNKNOWN arm.
```

| Treatment | Confirmation | Deductible |
|---|---|---|
| `ORDINARY_EXPENSE` | CONFIRMED | business amount (`NL_2026_ZAKELIJKE_KOSTEN_VOLLEDIG_AFTREKBAAR`) |
| `NON_DEDUCTIBLE` | CONFIRMED | **known €0** (`NL_2026_NIET_AFTREKBAAR`) |
| `INVESTMENT` | any | **UNKNOWN** / `NEEDS_DEPRECIATION` |
| `LIMITED_DEDUCTIBLE` | any | **UNKNOWN** / `YEAR_LEVEL_ELECTION` |
| `UNKNOWN` | any | **UNKNOWN** / `NOT_CLASSIFIED` |
| any | DRAFT | **UNKNOWN** / `NOT_CONFIRMED` |
| any | NEEDS_REVIEW | **UNKNOWN** / `FLAGGED_FOR_REVIEW` |

```
UNKNOWN_HANDLING    = The UNKNOWN arm carries NO cents field at all, so it is
                      structurally impossible to read it as zero. Unknown amounts are
                      reported in their own total and are never subtracted from a
                      result. Validation additionally rejects CONFIRMED + UNKNOWN,
                      the one combination that could deduct an unknown amount.
INVESTMENT_HANDLING = Actual spend stored in full; reported separately in
                      investmentAmountCents; never enters current-year deduction, even
                      when CONFIRMED. The official €450 threshold only decides whether
                      the UI asks the question — it never answers it, and a seller may
                      still classify a €1.000 item as an ordinary cost.
DELETE_MODEL        = Soft delete (deletedAt). Year-end reproducibility outweighs
                      tidiness before a close process exists. Deleted rows leave every
                      total and every list; the tombstone remains.
```

---

## §21–23 — Derivations

```
EXPENSE_YEAR_DERIVATION = deriveSellerExpenseYear(sellerUserId, year)
    actualSpendCents, businessRelatedSpendCents, confirmedDeductibleCostCents,
    unknownOrReviewAmountCents, investmentAmountCents, byCategory,
    completeness ∈ COMPLETE | NEEDS_CLASSIFICATION | UNSUPPORTED_CURRENCY,
    provenance = SELLER_ADMINISTERED

FINANCIAL_RESULT_FOUNDATION = deriveSellerFiscalResult(sellerUserId, year)
    partialResultCents = sellerNetProceedsCents − confirmedDeductibleCostCents
    Never clamped. Unknown and investment amounts are reported, not subtracted.
    completeness ∈ PARTIAL_COSTS_RESOLVED | PARTIAL_COSTS_UNRESOLVED |
                   PARTIAL_SALES_INCONSISTENT
    EXTERNAL_REVENUE_NOT_INCLUDED is emitted ALWAYS — the result is incomplete by
    construction even when every cost is classified.
    UI copy: "Geschat resultaat" / "Resultaat tot nu toe, ... Dit is geen
    belastingaangifte." Certification asserts the words "belastbare winst" never appear.

PLATFORM_FEE_DOUBLE_COUNT_PROTECTION =
    Structural, not a check. The result starts from sellerNetProceedsCents, which
    ALREADY has the commission removed, so the platform fee is simply not a term in
    the subtraction and there is no code path that could add it twice. The seller is
    never asked to enter it. Treatment is recorded as PLATFORM_DERIVED with the
    verified zakelijke-kosten rule key and alreadyDeductedInNetProceeds = true.
    If a seller nevertheless files spend under the PLATFORM category, the result
    emits PLATFORM_COSTS_MAY_BE_DUPLICATED with the exact amount, and the UI says
    the HomeCheff fee is already included.
```

---

## §24 — Refund semantic hardening (8B.2 P2 closed)

```
REFUND_SEMANTIC_HARDENING = scripts/test-refund-write-boundary.ts (8 checks)
```

A database constraint cannot solve this. `127` and `100` are both valid integers and no
`CHECK` can tell a buyer refund from a seller consideration refund — the amount is only
wrong relative to a plan the database cannot see. A scope enum was rejected because it
would legitimise mixed-semantic rows.

The strongest enforceable boundary is therefore **the set of files allowed to write
`Refund` at all**, pinned by test:

- allowlist of exactly three writers (`refund-settlement.ts`, `marketplace-hc-delivery-refund.ts`, the GDPR erasure cascade), each with a stated reason;
- bidirectional — a new writer fails, and a stale allowlist entry fails;
- the two writers removed in 8B.2 are asserted not to have returned;
- the schema comment and the single `sellerConsiderationRefundRows` factory are asserted present.

**Negative control performed:** a probe file writing `prisma.refund.create` was added and
the test failed, naming the file; removing it restored green. The guard genuinely catches
new writers rather than passing vacuously.

---

## §18–20, 27 — Authorization and privacy

```
AUTHORIZATION = Server-derived owner only. sellerUserId comes from the session and a
                sellerUserId in a request body is ignored (asserted by fixture).
                Every mutation scopes by BOTH id AND sellerUserId inside the WHERE of
                an updateMany, so no window exists between check and write. A miss
                returns 404, not 403 — a 403 would confirm the row exists.
                No admin path. No public path.
PRIVACY       = No analytics of any kind added; asserted by fixture that the route
                contains no analytics call. Expense data never reaches URLs, query
                parameters, share links, public profiles, the feed or listings.
RECEIPT_VAULT_UNTOUCHED = No upload, no Blob, no Media, no OCR, no LLM. The UI says
                "Bonnetje toevoegen komt later." CONFIRMED_RECEIPT remains unwritten.
VERDIENCHECK_ZERO_PERSISTENCE_PRESERVED = Untouched. No VerdienCheck file was modified;
                persistenceUsesDatabase() still returns false; all 34 suites pass.
                No CTA integration was built (deferred to 8G as instructed).
```

---

## §28–29 — Fixtures

`scripts/test-seller-expense-8c.ts` — **134 checks, 0 failed.**

| | Case | Result |
|---|---|---|
| A | €100, 100%, confirmed ordinary | deductible exactly 10000 cents |
| B | €100 at 60% | business €60; deductible **UNKNOWN** until treatment confirms, then €60 |
| C | Non-deductible | spend €100 preserved, deductible **known €0**, not counted as unresolved |
| D | Unknown treatment | UNKNOWN carries no cents field; year reports it separately |
| E | €1.000 investment | 0 deducted, €1.000 in investmentAmountCents, still UNKNOWN when CONFIRMED |
| F | Rounding | €10,01 × 33% = 330; half-away-from-zero; 1bp and 0% edges |
| G | Wrong owner | derivation seller-scoped; route ownership asserted in the WHERE |
| H | Year boundary | 2026-12-31 vs 2027-01-01 never mix; invalid dates rejected |
| I | Delete | soft-deleted row leaves actual, deductible AND unknown totals; tombstone kept |
| J | Edit | amount, share, treatment and category changes all recompute |
| K | Invalid input | negative, zero, non-integer, absurd, >100%, bad enum/currency/date, overlong text, CONFIRMED+UNKNOWN |
| L | Platform fee | counted once; a re-entered fee is flagged with its exact amount |

§29 financial result: sales €1.000, fee €120, proceeds €880, confirmed costs €200 →
**€680**. Adding a €100 UNKNOWN expense leaves the result at **€680** and moves
completeness to `PARTIAL_COSTS_UNRESOLVED` with the €100 named. Investment gets its own
notice, distinct from "please classify". Sales, refunds, fees and net proceeds asserted
unchanged by the existence of expenses.

> Two assertions in the first draft were vacuous (`a.b !== false` on a nonexistent
> property, and a short-circuiting `x === undefined ||`). Both were rewritten to test
> something real before this count was recorded.

---

## §32–33 — Migration and responsive

```
MIGRATION = prisma/migrations/20260922180000_phase_8c_seller_expense
            Additive only: 1 table, 4 enums, 3 indexes, 1 FK. Nothing existing is
            touched. Guarded (IF NOT EXISTS / pg_type / pg_constraint) so a partial or
            repeated run is safe.

REHEARSAL = No staging DB and no Docker, so the controlled environment was a
            transaction — Postgres DDL is transactional. The real file was applied to
            the real schema, applied a SECOND time to prove idempotence, verified, then
            ROLLED BACK. Result: 17 columns with correct types and defaults, 4 indexes,
            FK confdeltype='c' (CASCADE), financial row counts byte-identical before and
            after (Transaction 7, Refund 1, RefundSettlement 1, Payout 7, Order 36),
            and the table gone after rollback.
```

Production UI certification at four viewports — **66 checks, 0 failed**:

```
DESKTOP     = 1280x900  PASS
MOBILE_390  = 390x844   PASS
LANDSCAPE   = 844x390   PASS
ZOOM_200    = 640x450 @ deviceScaleFactor 2  PASS
```

Each viewport verified: panel renders, no horizontal overflow, dialog has
`aria-modal="true"` and `aria-labelledby`, every field has a real `<label for>`, dialog
does not overflow, Escape closes, and the save button is **not occluded**.

> A real defect was found and fixed here. The sheet used `z-50` while the bottom
> navigation sits at `z-[65]`, so on mobile the nav covered the foot of the form. Fixed
> to `z-[100]`, matching the app's existing modal convention. The original check only
> asserted the save button had a bounding box — which a covered button still has — so it
> was strengthened to ask the browser what is actually at the button's centre point.

---

## §34 — Regression

| Suite | Result |
|---|---|
| Phase 8B financial year | **19/19 pass** |
| Phase 8B.2 refund source semantics | **42/42 pass** |
| Refund write boundary (new) | **8/8 pass** |
| Seller expense 8C (new) | **134/134 pass** |
| VerdienCheck | **34/34 suites pass** |
| Settlement (refund, dispute, seller, multi-recipient, router) | **5/5 pass** |
| DAC7 / legal-4a compliance | **pass** |
| `tsc --noEmit` | **0 errors** |
| `npm run build` | **pass**, both new routes emitted |

Financial-year figures did not change. Production certification asserts this directly:
`PRODUCTION_SALES_UNCHANGED_BY_EXPENSES` and `PRODUCTION_FINANCIAL_YEAR_UNTOUCHED`
compare the seller's derivation before and after expenses existed.

> Build warnings (`lib/adaptive-workspace/sealed/**`, `app/reservations`) are
> pre-existing and untouched by this phase.

---

## §36 — Production certification

`docs/audits/seller-expense-8c/certify.ts` — **27 checks, 0 failed**.
`scripts/certify-seller-expense-8c-ui.mts` — **66 checks, 0 failed**.

No Order, no Transaction and no Stripe object was created.

```
PRODUCTION_CREATE           = PASS  4 rows via derivation + 1 via the real form
                                    (€12,34 -> exactly 1234 cents, taxYear 2026,
                                     source USER_PROVIDED, CONFIRMED)
PRODUCTION_EDIT             = PASS  amount change moved the deductible total by exactly
                                    the delta; a date moved to 2027 left 2026 and
                                    appeared in 2027
PRODUCTION_YEAR_TOTAL       = PASS  deductible strictly less than actual spend while
                                    unresolved rows exist
PRODUCTION_UNKNOWN          = PASS  UNKNOWN carried no cents; surfaced separately
PRODUCTION_INVESTMENT       = PASS  confirmed investment still produced no current-year
                                    deduction (NEEDS_DEPRECIATION)
PRODUCTION_ROUNDING         = PASS  €10,01 x 33% = 3300 cents through the real DB
PRODUCTION_DELETE_CLEANUP   = PASS  soft delete left totals and kept the tombstone;
                                    hard cleanup removed every row
PRODUCTION_CROSS_OWNER_BLOCK= PASS  seller B read 0 rows, updated 0, deleted 0; A's row
                                    verified byte-identical afterwards; B's own year
                                    totals isolated
CLEANUP_VERIFIED            = PASS  SellerExpense row count in production: 0
```

> One certification run left a row behind: the marker landed in `description` rather
> than `notes`, so the cleanup predicate missed it. The row was removed manually and
> the predicate now matches the marker in either field, so cleanup cannot miss again.
> Final verified state is 0 rows.

---

## Remaining

```
P0_REMAINING = none
P1_REMAINING = none
P2_REMAINING =
  1. No depreciation engine, so INVESTMENT deductibility stays UNKNOWN. This is correct
     and disclosed, but a seller with equipment cannot yet see a real figure.
  2. LIMITED_DEDUCTIBLE stays UNKNOWN because the €5.700 threshold and the 80% election
     are year-level choices; no year-level cost engine exists.
  3. No receipt evidence. Bewaarplicht is 7 years and nothing here helps a seller meet
     it (Phase 8D).
  4. VAT is not separated. Spend is stored as paid; whether the correct basis is ex- or
     incl. VAT depends on the seller's VAT position, which HomeCheff does not know.
  5. Refund semantics rest on a code-ownership boundary, not a database constraint.
     Unavoidable: the invariant is not expressible as a value check.
  6. Vercel CLI is unauthorized locally; deploys rely on the GitHub integration.

NEXT_PHASE = 8D — private receipt vault (the current upload architecture is public and
             is forbidden for receipts)
```

---

## FINAL_DECISION

```
HOMECHEFF_SELLER_EXPENSE_FOUNDATION_PRODUCTION_CERTIFIED
```
