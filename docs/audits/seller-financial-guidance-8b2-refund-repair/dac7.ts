/** PHASE 8B.2 §17 — DAC7 parity after repair. READ ONLY. */
import { deriveSellerDac7Year } from '../../../lib/compliance/dac7-derive';
import { deriveSellerFinancialYear } from '../../../lib/finance/seller-financial-year.server';
import { prisma } from '../../../lib/prisma';

const SELLER = '7647bf21-e9ab-4e3a-af83-eeec23e24dcb';

async function main() {
  const [dac7, fy] = await Promise.all([
    deriveSellerDac7Year(SELLER, 2026),
    deriveSellerFinancialYear(SELLER, 2026),
  ]);
  console.log(JSON.stringify({ dac7, financialYearRefundCents: fy.refundCents, financialYearGrossCents: fy.sellerGrossSalesCents }, null, 2));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
