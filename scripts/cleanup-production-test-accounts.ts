/**
 * Anonymize proven disposable production cert fixtures (category A only).
 * Soft-hides leftover cert-titled products. Does not delete Stripe, orders, or keep identities.
 *
 * Default: dry run
 * Apply:   npx tsx scripts/cleanup-production-test-accounts.ts --apply
 */
import fs from 'node:fs';

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]!]) process.env[m[1]!] = v;
  }
}
loadEnv('.env');
loadEnv('.env.local');

const APPLY = process.argv.includes('--apply');

const CERT_TITLE = {
  OR: [
    { title: { startsWith: 'EditFlowCert' } },
    { title: { startsWith: 'MediaCert' } },
    { title: { startsWith: 'GeoAutoHC' } },
    { title: { startsWith: '[CERT' } },
    { title: { startsWith: 'CERT ' } },
    { title: { contains: 'AppCert' } },
    { title: { contains: 'FinalCert' } },
    { title: { contains: 'OpsData' } },
    { title: { contains: 'LocCert' } },
    { description: { contains: 'certificationFixture' } },
    { description: { contains: 'Private certification fixture' } },
  ],
};

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const { performUserAccountDeletion } = await import('../lib/account-deletion');
  const {
    isDisposableCertEmail,
    isInternalTestKeepEmail,
    isInternalTestKeepUsername,
    INTERNAL_TEST_BIO,
  } = await import('../lib/certification/internal-test-identities');
  const prisma = new PrismaClient();
  try {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      accountDeletedAt: true,
      stripeConnectAccountId: true,
      SellerProfile: { select: { id: true } },
    },
  });

  const aIds: string[] = [];
  const skipped = { alreadyDeleted: 0, keep: 0, stripe: 0, paid: 0, realDomain: 0 };

  for (const u of users) {
    if (isInternalTestKeepEmail(u.email) || isInternalTestKeepUsername(u.username)) {
      skipped.keep += 1;
      continue;
    }
    if (!isDisposableCertEmail(u.email)) continue;
    if (u.accountDeletedAt) {
      skipped.alreadyDeleted += 1;
      continue;
    }
    if (u.stripeConnectAccountId) {
      skipped.stripe += 1;
      continue;
    }

    const sellerId = u.SellerProfile?.id;
    const [paidBuyer, sellerOrders, payouts] = await Promise.all([
      prisma.order.count({
        where: {
          userId: u.id,
          OR: [
            { stripeSessionId: { not: null } },
            { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
          ],
        },
      }),
      sellerId
        ? prisma.order.count({
            where: { items: { some: { Product: { sellerId } } } },
          })
        : Promise.resolve(0),
      prisma.payout.count({ where: { toUserId: u.id } }),
    ]);
    if (paidBuyer > 0 || sellerOrders > 0 || payouts > 0) {
      skipped.paid += 1;
      continue;
    }
    aIds.push(u.id);
  }

  const activeCertProducts = await prisma.product.findMany({
    where: { isActive: true, ...CERT_TITLE },
    select: { id: true, title: true },
  });

  const keepUser = await prisma.user.findFirst({
    where: { username: { equals: 'MediaCertHC', mode: 'insensitive' } },
    select: { id: true },
  });

  const result = {
    dryRun: !APPLY,
    anonymizeCandidates: aIds.length,
    skipped,
    certProductsToHide: activeCertProducts.map((p) => ({ id: p.id, title: p.title })),
    anonymized: 0,
    anonymizeErrors: [] as Array<{ id: string; error: string }>,
    productsHidden: 0,
    mediaCertMarked: false,
  };

  if (APPLY) {
    if (keepUser) {
      await prisma.user.update({
        where: { id: keepUser.id },
        data: { bio: INTERNAL_TEST_BIO },
      });
      result.mediaCertMarked = true;
    }

    if (activeCertProducts.length) {
      const hide = await prisma.product.updateMany({
        where: { id: { in: activeCertProducts.map((p) => p.id) } },
        data: { isActive: false, integrityStatus: 'TEMPORARILY_HIDDEN' },
      });
      result.productsHidden = hide.count;
    }

    for (const id of aIds) {
      try {
        await performUserAccountDeletion(id);
        result.anonymized += 1;
      } catch (err) {
        result.anonymizeErrors.push({
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
