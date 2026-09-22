/** PHASE 8B.2 — derive the production seller year. READ ONLY. */
import { deriveSellerFinancialYear } from '../../../lib/finance/seller-financial-year.server';
import { prisma } from '../../../lib/prisma';

const SELLER = '7647bf21-e9ab-4e3a-af83-eeec23e24dcb';

async function main() {
  const y = await deriveSellerFinancialYear(SELLER, 2026);
  console.log(
    JSON.stringify(
      {
        year: y.year,
        currency: y.currency,
        grossSalesCents: y.sellerGrossSalesCents,
        refundCents: y.refundCents,
        netSalesCents: y.netSalesCents,
        platformFeesCents: y.netPlatformFeesCents,
        netProceedsCents: y.sellerNetProceedsCents,
        transactionCount: y.transactionCount,
        completeness: y.completeness,
        warnings: y.warnings,
      },
      null,
      2,
    ),
  );
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
