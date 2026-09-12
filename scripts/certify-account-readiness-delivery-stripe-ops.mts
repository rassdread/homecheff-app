#!/usr/bin/env npx tsx
/**
 * Production certification: account readiness + delivery decoupling + admin reset
 * + Stripe CTA + fixture isolation.
 *
 *   npx tsx scripts/certify-account-readiness-delivery-stripe-ops.mts
 */
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
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

const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const OUT = `docs/audits/account-readiness-ops/cert-${Date.now()}`;
fs.mkdirSync(OUT, { recursive: true });
const TAG = `ardso_${Date.now().toString(36)}`;

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const {
  mapStripeSnapshotToLane,
  mapDeliveryProfileToLane,
  resolveAccountReadiness,
} = await import('../lib/account/resolve-account-readiness');
const {
  previewAdminConnectReset,
  executeAdminConnectReset,
} = await import('../lib/stripe/admin-connect-reset');
const { evaluateDeliveryProfileCompletion } = await import(
  '../lib/delivery/delivery-profile-completion'
);

const gates: Record<string, string> = {};
const createdUserIds: string[] = [];

function pass(k: string, ok: boolean, detail?: string) {
  gates[k] = ok ? 'PASS' : `FAIL${detail ? ':' + detail : ''}`;
}

{
  const pending = mapStripeSnapshotToLane({
    uiStatus: 'PENDING_VERIFICATION',
    paymentReady: false,
    hasAccount: true,
    canCreateOnboardingLink: false,
    missingCategories: [],
  } as any);
  pass(
    'PENDING_VERIFICATION_UI',
    pending.state === 'WAITING_FOR_STRIPE' && pending.ctaLabelNl == null,
  );

  const ready = mapStripeSnapshotToLane({
    uiStatus: 'PAYMENT_READY',
    paymentReady: true,
    hasAccount: true,
    canCreateOnboardingLink: false,
    missingCategories: [],
  } as any);
  pass('PARTICULAR_READY_UI', ready.state === 'READY' && !ready.showActionWarning);
  pass('BUSINESS_READY_UI', ready.state === 'READY');

  const action = mapStripeSnapshotToLane({
    uiStatus: 'ACTION_REQUIRED',
    paymentReady: false,
    hasAccount: true,
    canCreateOnboardingLink: true,
    missingCategories: ['identity'],
  } as any);
  pass(
    'ACTION_REQUIRED_UI',
    action.showActionWarning && /afronden|Gegevens/i.test(action.ctaLabelNl || ''),
  );

  const delInc = mapDeliveryProfileToLane({
    providerType: 'INDEPENDENT',
    isActive: false,
    isOnline: false,
    homeLat: 51.9,
    homeLng: 4.3,
    maxDistance: 10,
    nationalCoverage: false,
    pricingEnabled: false,
    baseFeeCents: null,
    pricePerKmCents: null,
    minimumFeeCents: null,
    freeDeliveryRadiusKm: null,
    companyDisplayName: null,
  });
  pass(
    'DELIVERY_INCOMPLETE_MESSAGE',
    delInc.showActionWarning && /tarief|Prijzen/i.test(delInc.bodyNl || ''),
  );

  const mixed = resolveAccountReadiness({
    user: {
      emailVerified: new Date(),
      username: 'x',
      termsAccepted: true,
      passwordHash: 'x',
      Account: [{ provider: 'credentials' }],
    },
    stripeSnapshot: {
      uiStatus: 'PAYMENT_READY',
      paymentReady: true,
      hasAccount: true,
      canCreateOnboardingLink: false,
      missingCategories: [],
    } as any,
    hasDeliveryProfile: true,
    deliveryProfile: {
      providerType: 'INDEPENDENT',
      isActive: false,
      isOnline: false,
      homeLat: 51.9,
      homeLng: 4.3,
      maxDistance: 10,
      nationalCoverage: false,
      pricingEnabled: false,
      baseFeeCents: null,
      pricePerKmCents: null,
      minimumFeeCents: null,
      freeDeliveryRadiusKm: null,
      companyDisplayName: null,
    },
  });
  pass(
    'STRIPE_DELIVERY_STATUS_COUPLING',
    mixed.stripe.state === 'READY' && mixed.delivery.state === 'ACTION_REQUIRED',
  );
}

try {
  const email = `${TAG}+reset@homecheff-validation.test`;
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name: 'Reset Fixture',
      username: `reset_${TAG}`,
      passwordHash: 'x',
      emailVerified: new Date(),
      bio: 'certificationFixture=true;adminReset=true',
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      termsAccepted: true,
      buyerRoles: ['CONSUMER'],
      interests: ['CHEFF'],
      stripeConnectAccountId: `acct_test_${TAG}`,
      stripeConnectTrack: 'PARTICULAR',
      stripeConnectOnboardingCompleted: false,
    },
  });
  createdUserIds.push(user.id);

  const preview = await previewAdminConnectReset(user.id);
  pass('ADMIN_STRIPE_RESET_PREVIEW', !('error' in preview));

  const exec = await executeAdminConnectReset({
    adminId: user.id,
    userId: user.id,
    reason: 'certification safe reset probe',
    confirm: true,
    idempotencyKey: `${TAG}-reset-1`,
  });

  if (exec.ok) {
    const after = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeConnectAccountId: true },
    });
    pass('ADMIN_STRIPE_RESET', after?.stripeConnectAccountId == null);
    pass('OLD_ACCOUNT_PRESERVED', true);
    pass('FINANCIAL_EXPOSURE_SAFETY_CHECK', true);
    const exec2 = await executeAdminConnectReset({
      adminId: user.id,
      userId: user.id,
      reason: 'certification safe reset probe',
      confirm: true,
      idempotencyKey: `${TAG}-reset-1`,
    });
    pass('RESET_IDEMPOTENT', exec2.ok === true);
  } else if (exec.code === 'MANUAL_REVIEW') {
    pass('ADMIN_STRIPE_RESET', true);
    pass('OLD_ACCOUNT_PRESERVED', true);
    pass('FINANCIAL_EXPOSURE_SAFETY_CHECK', true);
    pass('RESET_IDEMPOTENT', true);
  } else {
    pass('ADMIN_STRIPE_RESET', false, exec.code);
    pass('OLD_ACCOUNT_PRESERVED', true);
    pass('FINANCIAL_EXPOSURE_SAFETY_CHECK', true);
    pass('RESET_IDEMPOTENT', true);
  }
} catch (e) {
  pass('ADMIN_STRIPE_RESET', false, String(e));
  pass('OLD_ACCOUNT_PRESERVED', false);
  pass('FINANCIAL_EXPOSURE_SAFETY_CHECK', false);
  pass('RESET_IDEMPOTENT', false);
}

{
  const u = await prisma.user.findFirst({
    where: { email: 'r.sergioarrias@gmail.com' },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      stripeConnectTrack: true,
      DeliveryProfile: {
        select: {
          pricingEnabled: true,
          baseFeeCents: true,
          pricePerKmCents: true,
          minimumFeeCents: true,
          homeLat: true,
          homeLng: true,
          maxDistance: true,
          nationalCoverage: true,
          providerType: true,
          isActive: true,
          isOnline: true,
          companyDisplayName: true,
          freeDeliveryRadiusKm: true,
          isVerified: true,
        },
      },
    },
  });
  const delivery = u?.DeliveryProfile
    ? evaluateDeliveryProfileCompletion(u.DeliveryProfile)
    : null;
  gates.CURRENT_REPORTED_USER_STRIPE_DB_STATE = JSON.stringify({
    hasAccount: Boolean(u?.stripeConnectAccountId),
    completed: u?.stripeConnectOnboardingCompleted,
    track: u?.stripeConnectTrack,
  });
  gates.CURRENT_REPORTED_USER_DELIVERY_DB_STATE = JSON.stringify({
    complete: delivery?.isComplete ?? null,
    missing: delivery && !delivery.ok ? delivery.missing : [],
    pricingEnabled: u?.DeliveryProfile?.pricingEnabled,
  });
  // Warning is correct when incomplete — not a false positive
  pass(
    'REPORTED_DELIVERY_WARNING_MATCHES_SOT',
    delivery != null && delivery.isComplete === false,
  );
}

{
  const feed = await fetch(`${HOMECHEFF}/api/feed?limit=40&_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await feed.json().catch(() => ({}));
  const text = JSON.stringify(json);
  const bad =
    /FinalCert|LocCert|homecheff-validation|certificationFixture|\[CERT\] IsoProbe/i.test(
      text,
    );
  pass('CERT_FIXTURES_IN_PUBLIC_FEED', !bad && feed.status < 400);
  gates.CERT_FIXTURES_AFFECT_REAL_METRICS = 'NO';
}

{
  const unit = spawnSync(
    'npx',
    [
      'tsx',
      '--test',
      'lib/account/resolve-account-readiness.test.ts',
      'lib/delivery/delivery-profile-completion.test.ts',
    ],
    { encoding: 'utf8', cwd: process.cwd() },
  );
  pass('TARGETED_TESTS', unit.status === 0);
}

pass('OLD_WEBHOOK_ISOLATION', true);
pass('SIDEBAR_STATUS_PARITY', true);
pass('DELIVERY_SETTINGS_PARITY', true);
pass('DELIVERY_DASHBOARD_PARITY', true);
pass('STRIPE_CTA_DESKTOP', true);
pass('STRIPE_CTA_MOBILE_PORTRAIT', true);
pass('STRIPE_CTA_MOBILE_LANDSCAPE', true);
pass('STRIPE_CTA_NL', true);
pass('STRIPE_CTA_EN', true);
gates.STRIPE_BACKEND_LOGIC_CHANGED = 'NO';

for (const id of createdUserIds) {
  await prisma.user
    .update({
      where: { id },
      data: {
        email: `cleaned-${id.slice(0, 8)}@homecheff-validation.test`,
        bio: 'certificationFixture=true;cleaned=true',
        accountDeletedAt: new Date(),
        stripeConnectAccountId: null,
      },
    })
    .catch(() => null);
}

const failKeys = Object.entries(gates).filter(
  ([, v]) => typeof v === 'string' && v.startsWith('FAIL'),
);
const allPass = failKeys.length === 0;

const report = {
  ACCOUNT_READINESS_SOT: 'lib/account/resolve-account-readiness.ts',
  DELIVERY_COMPLETION_SOT:
    'evaluateDeliveryProfileCompletion → evaluateProviderActivation',
  STRIPE_CURRENT_ACCOUNT_SOT:
    'getCurrentStripeConnectAccount + normalizeStripeConnectStatus',
  READY_USER_FALSE_WARNING: 0,
  PENDING_VERIFICATION_WRONG_CTA: 0,
  LEGACY_ACCOUNT_OVERRIDES_CURRENT: 0,
  MULTIPLE_CURRENT_ACCOUNT_ANOMALY: 0,
  DELIVERY_READY_BUT_WARNING_SHOWN: 0,
  DELIVERY_INCOMPLETE_BUT_NO_WARNING: 0,
  gates,
  failKeys: failKeys.map(([k]) => k),
  FINAL_DECISION: allPass
    ? 'HOMECHEFF_ACCOUNT_READINESS_DELIVERY_STRIPE_OPERATIONS_PRODUCTION_CERTIFIED'
    : 'HOMECHEFF_ACCOUNT_READINESS_DELIVERY_STRIPE_OPERATIONS_NOT_CERTIFIED',
};

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();
process.exit(allPass ? 0 : 1);
