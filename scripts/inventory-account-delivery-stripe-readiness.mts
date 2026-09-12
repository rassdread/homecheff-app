#!/usr/bin/env npx tsx
/**
 * Read-only production inventory: Stripe + delivery readiness vs expected UI warnings.
 */
import fs from 'node:fs';

function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    o[m[1]!] = v;
  }
  return o;
}
Object.assign(process.env, loadEnv('.env'), loadEnv('.env.local'));

const { PrismaClient } = await import('@prisma/client');
const { evaluateDeliveryProfileCompletion } = await import(
  '../lib/delivery/delivery-profile-completion'
);
const { resolveSellerPaymentStatus } = await import(
  '../lib/stripe/seller-payment-status'
);
const { shouldEmitStripeOnboardAction } = await import(
  '../lib/stripe/connect-account-status'
);
const { matchesCurrentMode, stripe } = await import('../lib/stripe');
const { deriveConnectAccountStatusFromStripe } = await import(
  '../lib/stripe/connect-account-status'
);
const { parseConnectTrack } = await import('../lib/stripe/connect-tracks');

const prisma = new PrismaClient();
const OUT = `docs/audits/account-readiness-ops/inventory-${Date.now()}`;
fs.mkdirSync(OUT, { recursive: true });

const users = await prisma.user.findMany({
  where: {
    accountDeletedAt: null,
    OR: [{ SellerProfile: { isNot: null } }, { DeliveryProfile: { isNot: null } }],
    NOT: {
      OR: [
        { email: { contains: 'homecheff-validation.test' } },
        { bio: { contains: 'certificationFixture=true' } },
      ],
    },
  },
  select: {
    id: true,
    email: true,
    username: true,
    stripeConnectAccountId: true,
    stripeConnectOnboardingCompleted: true,
    stripeConnectTrack: true,
    SellerProfile: { select: { id: true } },
    DeliveryProfile: {
      select: {
        id: true,
        isVerified: true,
        isActive: true,
        isOnline: true,
        providerType: true,
        homeLat: true,
        homeLng: true,
        maxDistance: true,
        nationalCoverage: true,
        pricingEnabled: true,
        baseFeeCents: true,
        pricePerKmCents: true,
        minimumFeeCents: true,
        freeDeliveryRadiusKm: true,
        companyDisplayName: true,
      },
    },
  },
  take: 150,
});

const buckets: Record<string, number> = {
  ACCOUNT_READY_CORRECT: 0,
  READY_BUT_WRONG_BANNER_RISK: 0,
  STRIPE_ACTION_REQUIRED_CORRECT: 0,
  STRIPE_WAITING_VERIFICATION: 0,
  STRIPE_CHOICE_REQUIRED: 0,
  DELIVERY_READY_CORRECT: 0,
  DELIVERY_READY_BUT_WARNING_SHOWN_RISK: 0,
  DELIVERY_INCOMPLETE_CORRECT: 0,
  DELIVERY_INCOMPLETE_BUT_NO_WARNING_RISK: 0,
  LEGACY_ONLY: 0,
  MULTIPLE_CURRENT_ACCOUNT_ANOMALY: 0,
  LIVE_STRIPE_CHECKED: 0,
  LIVE_STRIPE_FAILED: 0,
};

const samples: Record<string, unknown[]> = {
  READY_BUT_WRONG_BANNER_RISK: [],
  DELIVERY_READY_BUT_WARNING_SHOWN_RISK: [],
  DELIVERY_INCOMPLETE_SAMPLE: [],
  STRIPE_WAITING_VERIFICATION: [],
  STRIPE_DB_COMPLETED_LIVE_NOT: [],
};

for (const u of users) {
  const track = parseConnectTrack(u.stripeConnectTrack);
  let liveUi: string | null = null;
  let liveReady = false;
  let canLink: boolean | null = null;

  if (u.stripeConnectAccountId && stripe && matchesCurrentMode(u.stripeConnectAccountId)) {
    try {
      const acct = await stripe.accounts.retrieve(u.stripeConnectAccountId);
      const snap = deriveConnectAccountStatusFromStripe(acct, {
        connectTrack: track,
      });
      liveUi = snap.uiStatus;
      liveReady = snap.paymentReady;
      canLink = snap.canCreateOnboardingLink;
      buckets.LIVE_STRIPE_CHECKED++;

      const dbSaysReady = Boolean(u.stripeConnectOnboardingCompleted);
      const wouldShowOnboardCta =
        canLink === true && shouldEmitStripeOnboardAction(snap.uiStatus);

      if (liveReady && wouldShowOnboardCta) {
        buckets.READY_BUT_WRONG_BANNER_RISK++;
        samples.READY_BUT_WRONG_BANNER_RISK.push({
          email: u.email,
          liveUi,
          track,
        });
      } else if (liveReady) {
        buckets.ACCOUNT_READY_CORRECT++;
      } else if (liveUi === 'PENDING_VERIFICATION') {
        buckets.STRIPE_WAITING_VERIFICATION++;
        samples.STRIPE_WAITING_VERIFICATION.push({
          email: u.email,
          canLink,
          ctaWouldShow: wouldShowOnboardCta,
        });
      } else if (liveUi === 'ACTION_REQUIRED' || liveUi === 'INCOMPLETE') {
        buckets.STRIPE_ACTION_REQUIRED_CORRECT++;
      }

      if (dbSaysReady && !liveReady) {
        samples.STRIPE_DB_COMPLETED_LIVE_NOT.push({
          email: u.email,
          liveUi,
          track,
        });
      }
    } catch {
      buckets.LIVE_STRIPE_FAILED++;
    }
  } else if (!u.stripeConnectAccountId && u.SellerProfile) {
    buckets.STRIPE_CHOICE_REQUIRED++;
  }

  // DB-only resolution without live (stale path risk)
  const dbResolution = resolveSellerPaymentStatus({
    stripeConnectAccountId: u.stripeConnectAccountId,
    stripeConnectOnboardingCompleted: u.stripeConnectOnboardingCompleted,
    stripeConnectTrack: track,
  });
  if (
    dbResolution.paymentsReady &&
    shouldEmitStripeOnboardAction(dbResolution.connectUiStatus)
  ) {
    // already counted if live; track DB-only anomaly
  }

  if (u.DeliveryProfile) {
    const completion = evaluateDeliveryProfileCompletion(u.DeliveryProfile);
    if (completion.isComplete) {
      buckets.DELIVERY_READY_CORRECT++;
      // Warning shown only when !activationComplete — SoT matches, no risk if UI uses SoT
    } else {
      buckets.DELIVERY_INCOMPLETE_CORRECT++;
      if (samples.DELIVERY_INCOMPLETE_SAMPLE.length < 12) {
        samples.DELIVERY_INCOMPLETE_SAMPLE.push({
          email: u.email,
          missing: completion.ok ? [] : completion.missing,
          message: completion.ok ? null : completion.message,
          pricingEnabled: u.DeliveryProfile.pricingEnabled,
          verified: u.DeliveryProfile.isVerified,
          active: u.DeliveryProfile.isActive,
        });
      }
    }
  }
}

// Multiple users pointing at same Connect account?
const accountIds = users
  .map((u) => u.stripeConnectAccountId)
  .filter(Boolean) as string[];
const counts = new Map<string, number>();
for (const id of accountIds) counts.set(id, (counts.get(id) ?? 0) + 1);
for (const [id, n] of counts) {
  if (n > 1) {
    buckets.MULTIPLE_CURRENT_ACCOUNT_ANOMALY++;
    samples.READY_BUT_WRONG_BANNER_RISK.push({
      anomaly: 'MULTIPLE_CURRENT',
      accountId: id.slice(0, 14),
      n,
    });
  }
}

const report = { usersSampled: users.length, buckets, samples };
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();
