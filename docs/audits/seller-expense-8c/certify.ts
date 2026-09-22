/**
 * PHASE 8C §36 — production certification.
 *
 * Exercises the real production table through the real derivations against a
 * controlled certification seller. Deliberately creates NO Order, NO
 * Transaction and NO Stripe object: this phase only adds seller-administered
 * rows, so only those are created.
 *
 * Every row written here carries CERT_MARKER and is hard-deleted at the end,
 * and the cleanup is verified rather than assumed. A non-zero residue fails
 * the run.
 *
 *   npx tsx --env-file=.env.local docs/audits/seller-expense-8c/certify.ts
 */
import fs from 'node:fs';
import { prisma } from '../../../lib/prisma';
import {
  deriveSellerExpenseYear,
  deriveSellerFiscalResult,
  listSellerExpenses,
} from '../../../lib/finance/seller-expense.server';
import { deriveSellerFinancialYear } from '../../../lib/finance/seller-financial-year.server';

const CERT_MARKER = 'HC_8C_CERT_DO_NOT_KEEP';
const YEAR = 2026;

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail?: string) {
  if (ok) results.push(`  PASS  ${name}`);
  else {
    failures += 1;
    results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  // Two real accounts, used only as owners. Nothing about them is modified.
  const [sellerA, sellerB] = await prisma.user.findMany({
    where: { SellerProfile: { isNot: null } },
    orderBy: { createdAt: 'asc' },
    take: 2,
    select: { id: true, email: true },
  });
  if (!sellerA || !sellerB) throw new Error('need two seller accounts to certify cross-owner access');

  // Baseline: the seller's canonical sales figures BEFORE any expense exists.
  const financialBefore = await deriveSellerFinancialYear(sellerA.id, YEAR);

  const createdIds: string[] = [];
  const mk = async (data: any) => {
    const row = await prisma.sellerExpense.create({
      data: { sellerUserId: sellerA.id, currency: 'EUR', notes: CERT_MARKER, ...data },
      select: { id: true },
    });
    createdIds.push(row.id);
    return row.id;
  };

  const report: Record<string, unknown> = {
    certMarker: CERT_MARKER,
    year: YEAR,
    sellerA: sellerA.id,
    sellerB: sellerB.id,
    ordersCreated: 0,
    transactionsCreated: 0,
    stripeObjectsCreated: 0,
  };

  try {
    // --- CREATE -----------------------------------------------------------
    const ordinaryId = await mk({
      expenseDate: new Date(Date.UTC(2026, 4, 12)),
      amountCents: 10_000,
      category: 'MATERIALS',
      fiscalTreatment: 'ORDINARY_EXPENSE',
      confirmationStatus: 'CONFIRMED',
      taxYear: 2026,
      description: 'cert ordinary',
    });
    const unknownId = await mk({
      expenseDate: new Date(Date.UTC(2026, 4, 13)),
      amountCents: 5_000,
      category: 'OTHER',
      fiscalTreatment: 'UNKNOWN',
      confirmationStatus: 'DRAFT',
      taxYear: 2026,
      description: 'cert unknown',
    });
    const investmentId = await mk({
      expenseDate: new Date(Date.UTC(2026, 4, 14)),
      amountCents: 100_000,
      category: 'EQUIPMENT',
      fiscalTreatment: 'INVESTMENT',
      confirmationStatus: 'CONFIRMED',
      taxYear: 2026,
      description: 'cert investment',
    });
    const mixedId = await mk({
      expenseDate: new Date(Date.UTC(2026, 4, 15)),
      amountCents: 10_001,
      businessUseBp: 3_300,
      category: 'DELIVERY',
      fiscalTreatment: 'ORDINARY_EXPENSE',
      confirmationStatus: 'CONFIRMED',
      taxYear: 2026,
      description: 'cert mixed',
    });

    check('PRODUCTION_CREATE', createdIds.length === 4);

    // --- READ -------------------------------------------------------------
    const listed = await listSellerExpenses(sellerA.id, YEAR);
    const mine = listed.filter((e) => createdIds.includes(e.id));
    check('PRODUCTION_READ', mine.length === 4);

    const mixed = mine.find((e) => e.id === mixedId)!;
    check(
      'PRODUCTION_ROUNDING',
      mixed.businessAmountCents === 3_300,
      `10.01 x 33% expected 3300 cents, got ${mixed.businessAmountCents}`,
    );

    const inv = mine.find((e) => e.id === investmentId)!;
    check(
      'PRODUCTION_INVESTMENT',
      inv.deductible.status === 'UNKNOWN' &&
        (inv.deductible as any).reason === 'NEEDS_DEPRECIATION',
      'a confirmed investment must still not produce a current-year deduction',
    );

    const unk = mine.find((e) => e.id === unknownId)!;
    check(
      'PRODUCTION_UNKNOWN',
      unk.deductible.status === 'UNKNOWN' && !('cents' in unk.deductible),
      'UNKNOWN must not carry a zero',
    );

    // --- YEAR AGGREGATION -------------------------------------------------
    const yr = await deriveSellerExpenseYear(sellerA.id, YEAR);
    check('PRODUCTION_YEAR_ACTUAL_SPEND', yr.actualSpendCents >= 125_001);
    check(
      'PRODUCTION_YEAR_DEDUCTIBLE_EXCLUDES_UNRESOLVED',
      yr.confirmedDeductibleCostCents < yr.actualSpendCents,
    );
    check('PRODUCTION_YEAR_UNKNOWN_SURFACED', yr.unknownOrReviewAmountCents >= 5_000);
    check('PRODUCTION_YEAR_INVESTMENT_SURFACED', yr.investmentAmountCents >= 100_000);
    check('PRODUCTION_YEAR_NEEDS_CLASSIFICATION', yr.completeness === 'NEEDS_CLASSIFICATION');

    // --- FISCAL RESULT + NO DOUBLE COUNT ----------------------------------
    const fiscal = await deriveSellerFiscalResult(sellerA.id, YEAR);
    check(
      'PRODUCTION_SALES_UNCHANGED_BY_EXPENSES',
      fiscal.grossSalesCents === financialBefore.sellerGrossSalesCents &&
        fiscal.refundCents === financialBefore.refundCents &&
        fiscal.platformFeeCents === financialBefore.netPlatformFeesCents,
      'adding expenses must not move a single sales figure',
    );
    check(
      'PRODUCTION_RESULT_IS_PROCEEDS_MINUS_CONFIRMED',
      fiscal.partialResultCents ===
        financialBefore.sellerNetProceedsCents - yr.confirmedDeductibleCostCents,
    );
    check(
      'PRODUCTION_PLATFORM_FEE_NOT_DOUBLE_COUNTED',
      fiscal.sources.platformFee.alreadyDeductedInNetProceeds === true,
    );
    report.fiscalResult = {
      grossSalesCents: fiscal.grossSalesCents,
      platformFeeCents: fiscal.platformFeeCents,
      sellerNetProceedsCents: fiscal.sellerNetProceedsCents,
      sellerDeductibleCostCents: fiscal.sellerDeductibleCostCents,
      partialResultCents: fiscal.partialResultCents,
      unresolvedCostCents: fiscal.unresolvedCostCents,
      investmentCostCents: fiscal.investmentCostCents,
      completeness: fiscal.completeness,
      notices: fiscal.notices,
    };

    // --- EDIT -------------------------------------------------------------
    const beforeEdit = yr.confirmedDeductibleCostCents;
    await prisma.sellerExpense.updateMany({
      where: { id: ordinaryId, sellerUserId: sellerA.id, deletedAt: null },
      data: { amountCents: 20_000 },
    });
    const afterEdit = await deriveSellerExpenseYear(sellerA.id, YEAR);
    check(
      'PRODUCTION_EDIT',
      afterEdit.confirmedDeductibleCostCents === beforeEdit + 10_000,
      `expected ${beforeEdit + 10_000}, got ${afterEdit.confirmedDeductibleCostCents}`,
    );

    // Moving the date across the year boundary reclassifies deterministically.
    await prisma.sellerExpense.updateMany({
      where: { id: ordinaryId, sellerUserId: sellerA.id },
      data: { expenseDate: new Date(Date.UTC(2027, 0, 1)), taxYear: 2027 },
    });
    const after2026 = await deriveSellerExpenseYear(sellerA.id, 2026);
    const after2027 = await deriveSellerExpenseYear(sellerA.id, 2027);
    check(
      'PRODUCTION_YEAR_BOUNDARY_MOVE',
      after2026.confirmedDeductibleCostCents === afterEdit.confirmedDeductibleCostCents - 20_000 &&
        after2027.actualSpendCents >= 20_000,
    );
    await prisma.sellerExpense.updateMany({
      where: { id: ordinaryId, sellerUserId: sellerA.id },
      data: { expenseDate: new Date(Date.UTC(2026, 4, 12)), taxYear: 2026 },
    });

    // --- CROSS-OWNER BLOCK ------------------------------------------------
    // Exactly the WHERE the API uses, with the other seller as the owner.
    const bRead = await prisma.sellerExpense.findMany({
      where: { id: { in: createdIds }, sellerUserId: sellerB.id, deletedAt: null },
    });
    const bUpdate = await prisma.sellerExpense.updateMany({
      where: { id: ordinaryId, sellerUserId: sellerB.id, deletedAt: null },
      data: { amountCents: 999_999 },
    });
    const bDelete = await prisma.sellerExpense.updateMany({
      where: { id: ordinaryId, sellerUserId: sellerB.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    check('PRODUCTION_CROSS_OWNER_READ_BLOCKED', bRead.length === 0);
    check('PRODUCTION_CROSS_OWNER_EDIT_BLOCKED', bUpdate.count === 0);
    check('PRODUCTION_CROSS_OWNER_DELETE_BLOCKED', bDelete.count === 0);

    const stillIntact = await prisma.sellerExpense.findUnique({
      where: { id: ordinaryId },
      select: { amountCents: true, deletedAt: true },
    });
    check(
      'PRODUCTION_CROSS_OWNER_LEFT_ROW_UNTOUCHED',
      stillIntact?.amountCents === 20_000 && stillIntact?.deletedAt === null,
    );

    // B's own year must not see A's rows.
    const bYear = await deriveSellerExpenseYear(sellerB.id, YEAR);
    check(
      'PRODUCTION_CROSS_OWNER_TOTALS_ISOLATED',
      bYear.actualSpendCents === 0 || bYear.expenseCount === 0,
      `seller B year shows ${bYear.expenseCount} rows / ${bYear.actualSpendCents} cents`,
    );

    // --- SOFT DELETE ------------------------------------------------------
    const beforeDelete = await deriveSellerExpenseYear(sellerA.id, YEAR);
    await prisma.sellerExpense.updateMany({
      where: { id: unknownId, sellerUserId: sellerA.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    const afterDelete = await deriveSellerExpenseYear(sellerA.id, YEAR);
    check(
      'PRODUCTION_SOFT_DELETE_LEAVES_TOTALS',
      afterDelete.actualSpendCents === beforeDelete.actualSpendCents - 5_000 &&
        afterDelete.unknownOrReviewAmountCents ===
          beforeDelete.unknownOrReviewAmountCents - 5_000,
    );
    const tombstone = await prisma.sellerExpense.findUnique({
      where: { id: unknownId },
      select: { deletedAt: true },
    });
    check('PRODUCTION_SOFT_DELETE_KEEPS_TOMBSTONE', tombstone?.deletedAt != null);
    check(
      'PRODUCTION_SOFT_DELETE_HIDDEN_FROM_LIST',
      (await listSellerExpenses(sellerA.id, YEAR)).every((e) => e.id !== unknownId),
    );
  } finally {
    // --- CLEANUP (hard delete, verified) ----------------------------------
    const removed = await prisma.sellerExpense.deleteMany({
      where: { id: { in: createdIds } },
    });
    const residue = await prisma.sellerExpense.count({ where: { notes: CERT_MARKER } });
    const anyLeft = await prisma.sellerExpense.count();

    check('PRODUCTION_DELETE_CLEANUP', removed.count === createdIds.length);
    check('PRODUCTION_CLEANUP_VERIFIED_NO_RESIDUE', residue === 0);
    check(
      'PRODUCTION_TABLE_EMPTY_AFTER_CERT',
      anyLeft === 0,
      `${anyLeft} SellerExpense rows remain; certification must not leave data behind`,
    );

    // The seller's canonical financial year must be exactly as it was.
    const financialAfter = await deriveSellerFinancialYear(sellerA.id, YEAR);
    check(
      'PRODUCTION_FINANCIAL_YEAR_UNTOUCHED',
      JSON.stringify({
        g: financialBefore.sellerGrossSalesCents,
        r: financialBefore.refundCents,
        f: financialBefore.netPlatformFeesCents,
        n: financialBefore.sellerNetProceedsCents,
        c: financialBefore.completeness,
      }) ===
        JSON.stringify({
          g: financialAfter.sellerGrossSalesCents,
          r: financialAfter.refundCents,
          f: financialAfter.netPlatformFeesCents,
          n: financialAfter.sellerNetProceedsCents,
          c: financialAfter.completeness,
        }),
    );

    report.cleanup = { created: createdIds.length, removed: removed.count, residue, tableRows: anyLeft };
    report.checks = results;
    report.failures = failures;
    report.verdict = failures === 0 ? 'PRODUCTION_CERTIFIED' : 'PRODUCTION_FAILED';

    fs.writeFileSync(
      'docs/audits/seller-expense-8c/certification.json',
      JSON.stringify(report, null, 2),
    );
    console.log(`\nPHASE 8C production certification — ${results.length} checks, ${failures} failed\n`);
    console.log(results.join('\n'));
    if (failures > 0) process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
