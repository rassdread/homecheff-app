/**
 * READ-ONLY production inventory of probable test accounts and test content.
 *
 *   npx tsx scripts/inventory-production-test-accounts.ts
 *
 * Never writes. Masks emails. Does not log DOB or Stripe secrets.
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

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

const prisma = new PrismaClient();

function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const keep = local.slice(0, Math.min(2, local.length));
  return `${keep}***@${domain}`;
}

const FIXTURE_EMAIL_RE =
  /@(homecheff-validation\.test|homecheff\.invalid|homecheff\.test)$/i;

const HIGH_USER_RE =
  /(mediacert|geauto|geoautohc|editflowcert|appcert|opsdata|finalcert|loccert|ddash|sctacta|propcert|isoprobes?|homecheff-validation|certificationfixture)/i;

const MEDIUM_USER_RE =
  /\b(testuser|test-user|dummy|seed|localhost|e2e|smoke|qa[-_]?|demo[-_]?)\b/i;

const DEDICATED_KEEP = new Set(
  [
    'mediacerthc',
    'geoautohc',
    'editflowcert',
  ].map((s) => s.toLowerCase()),
);

const DEDICATED_KEEP_EMAIL = new Set(
  ['mediacert+homecheff@example.com'].map((s) => s.toLowerCase()),
);

type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
type Class = 'A' | 'B' | 'C' | 'D';

type Candidate = {
  USER_ID: string;
  USERNAME: string | null;
  EMAIL_MASKED: string;
  CREATED_AT: string;
  LAST_ACTIVITY: string | null;
  TEST_SIGNAL: string;
  CONFIDENCE: Confidence;
  CLASS: Class;
  ROLE: string;
  DELETED: boolean;
  ADMIN: boolean;
  STRIPE_CONNECT: boolean;
  STRIPE_ONBOARDED: boolean;
  DEPS: Record<string, number>;
  FINANCIAL: boolean;
};

function signalsFor(u: {
  email: string | null;
  username: string | null;
  name: string | null;
  bio: string | null;
}): { signal: string; confidence: Confidence } {
  const email = (u.email || '').toLowerCase();
  const username = (u.username || '').toLowerCase();
  const name = (u.name || '').toLowerCase();
  const bio = (u.bio || '').toLowerCase();
  const blob = `${email} ${username} ${name} ${bio}`;

  if (FIXTURE_EMAIL_RE.test(email) || email.includes('homecheff-validation.test')) {
    return { signal: 'fixture_email_domain', confidence: 'HIGH' };
  }
  if (email.startsWith('deleted+') || email.startsWith('cleaned-')) {
    return { signal: 'scrubbed_cert_email', confidence: 'HIGH' };
  }
  if (/certificationfixture\s*=\s*true/.test(bio)) {
    return { signal: 'certificationFixture_bio', confidence: 'HIGH' };
  }
  if (DEDICATED_KEEP.has(username) || DEDICATED_KEEP_EMAIL.has(email)) {
    return { signal: 'dedicated_internal_cert_identity', confidence: 'HIGH' };
  }
  if (HIGH_USER_RE.test(blob)) {
    return { signal: 'known_cert_token', confidence: 'HIGH' };
  }
  if (email.endsWith('@example.com') || email.endsWith('@example.org') || email.endsWith('@test.com')) {
    return { signal: 'reserved_test_email_tld', confidence: 'HIGH' };
  }
  if (MEDIUM_USER_RE.test(blob) || /^(test|demo|qa|smoke)/.test(username) || /^(test|demo)@/.test(email)) {
    return { signal: 'test_demo_qa_pattern', confidence: 'MEDIUM' };
  }
  if (/\btest\b/.test(name) || /\btest\b/.test(username)) {
    return { signal: 'generic_test_token', confidence: 'LOW' };
  }
  return { signal: 'none', confidence: 'LOW' };
}

async function main() {
  const totalUsers = await prisma.user.count();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      lastLocationUpdate: true,
      accountDeletedAt: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      SellerProfile: { select: { id: true } },
      DeliveryProfile: { select: { id: true } },
      affiliate: { select: { id: true } },
    },
  });

  const flagged = users.filter((u) => signalsFor(u).signal !== 'none');

  const candidates: Candidate[] = [];

  for (const u of flagged) {
    const { signal, confidence } = signalsFor(u);
    const sellerId = u.SellerProfile?.id ?? null;

    const [
      products,
      listings,
      ordersBuyer,
      ordersSellerPaid,
      conversations,
      messages,
      proposalsBuyer,
      proposalsSeller,
      reviews,
      deliveryOrders,
      promoCodes,
      promoRedemptions,
      notifications,
      sessions,
      accounts,
      payouts,
      escrows,
      communityBuyer,
      communitySeller,
      reservationsBuyer,
    ] = await Promise.all([
      sellerId
        ? prisma.product.count({ where: { sellerId } })
        : Promise.resolve(0),
      prisma.listing.count({ where: { ownerId: u.id } }),
      prisma.order.count({ where: { userId: u.id } }),
      sellerId
        ? prisma.order.count({
            where: { items: { some: { Product: { sellerId } } } },
          })
        : Promise.resolve(0),
      prisma.conversationParticipant.count({ where: { userId: u.id } }),
      prisma.message.count({ where: { senderId: u.id } }),
      prisma.proposal.count({ where: { buyerId: u.id } }),
      prisma.proposal.count({ where: { sellerId: u.id } }),
      prisma.productReview.count({ where: { buyerId: u.id } }),
      u.DeliveryProfile
        ? prisma.deliveryOrder.count({
            where: { deliveryProfileId: u.DeliveryProfile.id },
          })
        : Promise.resolve(0),
      prisma.promoCode.count({ where: { sellerId: u.id } }),
      prisma.promoCodeRedemption.count({ where: { userId: u.id } }),
      prisma.notification.count({ where: { userId: u.id } }),
      prisma.session.count({ where: { userId: u.id } }),
      prisma.account.count({ where: { userId: u.id } }),
      prisma.payout.count({ where: { toUserId: u.id } }),
      prisma.paymentEscrow.count({ where: { sellerId: u.id } }),
      prisma.communityOrder.count({ where: { buyerId: u.id } }),
      prisma.communityOrder.count({ where: { sellerId: u.id } }),
      prisma.reservation.count({ where: { buyerId: u.id } }),
    ]);

    const paidBuyer = await prisma.order.count({
      where: {
        userId: u.id,
        OR: [
          { stripeSessionId: { not: null } },
          { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        ],
      },
    });

    const financial =
      paidBuyer > 0 ||
      payouts > 0 ||
      escrows > 0 ||
      Boolean(u.stripeConnectAccountId) ||
      ordersSellerPaid > 0;

    const admin = u.role === 'ADMIN' || u.role === 'SUPERADMIN';
    const dedicated =
      DEDICATED_KEEP.has((u.username || '').toLowerCase()) ||
      DEDICATED_KEEP_EMAIL.has((u.email || '').toLowerCase());

    let klass: Class = 'D';
    if (admin) {
      klass = 'D';
    } else if (dedicated) {
      klass = 'C';
    } else if (confidence === 'HIGH' && financial) {
      klass = 'B';
    } else if (confidence === 'HIGH' && !financial) {
      klass = 'A';
    } else if (confidence === 'MEDIUM' && financial) {
      klass = 'B';
    } else if (confidence === 'MEDIUM' && !financial) {
      klass = 'B'; // medium without finance still needs review
    } else {
      klass = 'D';
    }

    candidates.push({
      USER_ID: u.id,
      USERNAME: u.username,
      EMAIL_MASKED: maskEmail(u.email),
      CREATED_AT: u.createdAt.toISOString(),
      LAST_ACTIVITY: (u.lastLocationUpdate || u.updatedAt)?.toISOString() ?? null,
      TEST_SIGNAL: signal,
      CONFIDENCE: confidence,
      CLASS: klass,
      ROLE: u.role,
      DELETED: Boolean(u.accountDeletedAt),
      ADMIN: admin,
      STRIPE_CONNECT: Boolean(u.stripeConnectAccountId),
      STRIPE_ONBOARDED: Boolean(u.stripeConnectOnboardingCompleted),
      FINANCIAL: financial,
      DEPS: {
        products,
        listings,
        ordersBuyer,
        paidBuyer,
        ordersSeller: ordersSellerPaid,
        conversations,
        messages,
        proposalsBuyer,
        proposalsSeller,
        reviews,
        deliveryOrders,
        deliveryProfile: u.DeliveryProfile ? 1 : 0,
        affiliate: u.affiliate ? 1 : 0,
        promoCodes,
        promoRedemptions,
        notifications,
        sessions,
        oauthAccounts: accounts,
        payouts,
        escrows,
        communityBuyer,
        communitySeller,
        reservationsBuyer,
      },
    });
  }

  const titleWhere = {
    OR: [
      { title: { contains: 'MediaCert', mode: 'insensitive' as const } },
      { title: { contains: 'GeoAutoHC', mode: 'insensitive' as const } },
      { title: { contains: 'EditFlowCert', mode: 'insensitive' as const } },
      { title: { contains: 'AppCert', mode: 'insensitive' as const } },
      { title: { contains: 'FinalCert', mode: 'insensitive' as const } },
      { title: { contains: 'LocCert', mode: 'insensitive' as const } },
      { title: { contains: 'OpsData', mode: 'insensitive' as const } },
      { title: { startsWith: '[CERT' } },
      { title: { startsWith: 'CERT ' } },
      { title: { contains: 'certificationFixture', mode: 'insensitive' as const } },
      { title: { contains: 'homecheff-validation', mode: 'insensitive' as const } },
      { description: { contains: 'certificationFixture' } },
      { description: { contains: 'Private certification fixture' } },
    ],
  };

  const [testProducts, publicTestProducts, testListings, publicTestListings] =
    await Promise.all([
      prisma.product.findMany({
        where: titleWhere,
        select: {
          id: true,
          title: true,
          isActive: true,
          integrityStatus: true,
          seller: { select: { User: { select: { email: true, bio: true } } } },
        },
        take: 500,
      }),
      prisma.product.count({
        where: {
          AND: [
            titleWhere,
            {
              isActive: true,
              integrityStatus: { in: ['ACTIVE', 'REVIEW_REQUIRED'] },
              seller: {
                User: {
                  suspendedAt: null,
                  accountDeletedAt: null,
                  AND: [
                    {
                      NOT: {
                        OR: [
                          { email: { endsWith: '@homecheff-validation.test' } },
                          { email: { endsWith: '@homecheff.invalid' } },
                          { email: { endsWith: '@homecheff.test' } },
                          { email: { contains: 'homecheff-validation.test' } },
                          { email: { startsWith: 'deleted+' } },
                          { email: { startsWith: 'cleaned-' } },
                          { bio: { contains: 'certificationFixture=true' } },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      }),
      prisma.listing.findMany({
        where: {
          OR: [
            { title: { contains: 'MediaCert', mode: 'insensitive' } },
            { title: { contains: 'GeoAutoHC', mode: 'insensitive' } },
            { title: { contains: '[CERT' } },
            { title: { contains: 'certificationFixture' } },
          ],
        },
        select: { id: true, title: true, status: true, isPublic: true },
        take: 200,
      }),
      prisma.listing.count({
        where: {
          isPublic: true,
          status: { not: 'REMOVED' },
          OR: [
            { title: { contains: 'MediaCert', mode: 'insensitive' } },
            { title: { contains: 'GeoAutoHC', mode: 'insensitive' } },
            { title: { contains: '[CERT' } },
            { title: { contains: 'certificationFixture' } },
          ],
        },
      }),
    ]);

  const byClass = {
    A: candidates.filter((c) => c.CLASS === 'A'),
    B: candidates.filter((c) => c.CLASS === 'B'),
    C: candidates.filter((c) => c.CLASS === 'C'),
    D: candidates.filter((c) => c.CLASS === 'D'),
  };

  const summarize = (list: Candidate[]) =>
    list.map((c) => ({
      USER_ID: c.USER_ID,
      USERNAME: c.USERNAME,
      EMAIL_MASKED: c.EMAIL_MASKED,
      CREATED_AT: c.CREATED_AT,
      LAST_ACTIVITY: c.LAST_ACTIVITY,
      TEST_SIGNAL: c.TEST_SIGNAL,
      CONFIDENCE: c.CONFIDENCE,
      CLASS: c.CLASS,
      FINANCIAL: c.FINANCIAL,
      STRIPE_CONNECT: c.STRIPE_CONNECT,
      DEPS: c.DEPS,
      REASON:
        c.CLASS === 'A'
          ? 'HIGH fixture identity, no paid/payout/connect history'
          : c.CLASS === 'B'
            ? c.FINANCIAL
              ? 'Test-like with financial/connect history — review only'
              : 'MEDIUM confidence — review before any cleanup'
            : c.CLASS === 'C'
              ? 'Dedicated internal certification identity — keep'
              : 'Uncertain or privileged — do not touch',
    }));

  const report = {
    TOTAL_USERS: totalUsers,
    PROBABLE_TEST_USERS: candidates.length,
    SAFE_DELETE_A: byClass.A.length,
    REVIEW_REQUIRED_B: byClass.B.length,
    KEEP_INTERNAL_C: byClass.C.length,
    UNCERTAIN_D: byClass.D.length,
    PUBLIC_TEST_PRODUCTS_DISCOVERABLE: publicTestProducts,
    PUBLIC_TEST_LISTINGS: publicTestListings,
    TEST_PRODUCTS_ANY: testProducts.length,
    TEST_PRODUCTS_ACTIVE: testProducts.filter((p) => p.isActive).length,
    TEST_LISTINGS_ANY: testListings.length,
    TEST_ORDERS: candidates.reduce((n, c) => n + c.DEPS.ordersBuyer + c.DEPS.ordersSeller, 0),
    TEST_CONVERSATIONS: candidates.reduce((n, c) => n + c.DEPS.conversations, 0),
    TEST_REVIEWS: candidates.reduce((n, c) => n + c.DEPS.reviews, 0),
    TEST_DELIVERY_DATA: candidates.reduce(
      (n, c) => n + c.DEPS.deliveryProfile + c.DEPS.deliveryOrders,
      0,
    ),
    TEST_AFFILIATE_DATA: candidates.reduce((n, c) => n + c.DEPS.affiliate, 0),
    TEST_STRIPE_CONNECT_ACCOUNTS: candidates.filter((c) => c.STRIPE_CONNECT).length,
    A: summarize(byClass.A),
    B: summarize(byClass.B),
    C: summarize(byClass.C),
    D: summarize(byClass.D),
    publicTestProductSamples: testProducts
      .filter((p) => p.isActive)
      .slice(0, 20)
      .map((p) => ({
        id: p.id,
        title: p.title,
        integrityStatus: p.integrityStatus,
        emailMasked: maskEmail(p.seller?.User?.email),
      })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
