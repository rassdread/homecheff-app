/**
 * Live cert: stuck Express → user-confirmed PARTICULAR replacement via HC API.
 * npx tsx --env-file=.env.local scripts/certify-connect-migration-live.ts
 */
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { assertCertCleanupCompleted, disposeTempCertificationUsers } from '../lib/certification/dispose-temp-fixtures';
import { assertProductionCertMutationAllowed } from '../lib/certification/production-cert-guard';

const BASE = 'https://homecheff.eu';
let createdCertUserId: string | null = null;

async function login(email: string, password: string) {
  const jar: Record<string, string> = {};
  const store = (res: Response) => {
    for (const c of res.headers.getSetCookie?.() || []) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) jar[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
  };
  const cookie = () =>
    Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  store(csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      cookie: cookie(),
    },
    body: new URLSearchParams({
      csrfToken,
      emailOrUsername: email,
      password,
      callbackUrl: BASE,
      json: 'true',
    }),
  });
  store(loginRes);
  return { cookie: cookie(), jar };
}

async function main() {
  assertProductionCertMutationAllowed();
  const key = process.env.STRIPE_SECRET_KEY!.trim();
  if (!key.startsWith('sk_live')) throw new Error('live key required');
  const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
  const prisma = new PrismaClient();
  const stamp = Date.now();
  const email = `mig-cert-${stamp}@homecheff.invalid`;
  const password = `Mig-${stamp}-Zz7!`;
  const username = `migcert${stamp}`.slice(0, 20);

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      username,
      name: 'Migration Cert',
      passwordHash: await bcrypt.hash(password, 10),
      emailVerified: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      sellerRoles: ['chef'],
    },
  });
  createdCertUserId = user.id;

  // Create stuck Express (legacy shape) and link — simulates stuck user.
  const oldExpress = await stripe.accounts.create({
    type: 'express',
    country: 'NL',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeConnectAccountId: oldExpress.id,
      stripeConnectOnboardingCompleted: false,
      stripeConnectTrack: null,
    },
  });

  const { cookie } = await login(email, password);

  const get1 = await (
    await fetch(`${BASE}/api/stripe/connect/onboard`, {
      headers: { cookie, Accept: 'application/json' },
    })
  ).json();

  const postReplace = await fetch(`${BASE}/api/stripe/connect/onboard`, {
    method: 'POST',
    headers: {
      cookie,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ track: 'PARTICULAR', forceReplace: true }),
  });
  const replaceBody = await postReplace.json();

  const postAgain = await fetch(`${BASE}/api/stripe/connect/onboard`, {
    method: 'POST',
    headers: {
      cookie,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ track: 'PARTICULAR', forceReplace: true }),
  });
  const againBody = await postAgain.json();

  const newId = replaceBody.accountId as string | undefined;
  let newAcct: Stripe.Account | null = null;
  let requirements: Record<string, unknown> = {};
  if (newId) {
    newAcct = await stripe.accounts.retrieve(newId);
    const due = [
      ...(newAcct.requirements?.currently_due ?? []),
      ...(newAcct.requirements?.eventually_due ?? []),
    ];
    requirements = {
      KVK: due.some((r) => /kvk/i.test(r)) ? 'YES' : 'NO',
      COMPANY_TAX_ID: due.some((r) => /company\.tax_id/i.test(r)) ? 'YES' : 'NO',
      COMPANY_DOCS: due.some((r) =>
        /company\.verification\.document|proof_of_registration/i.test(r),
      )
        ? 'YES'
        : 'NO',
      BUSINESS_REG: due.some((r) =>
        /business_registration|registration_number/i.test(r),
      )
        ? 'YES'
        : 'NO',
      PERSONAL: due.some((r) => /individual\./i.test(r)) ? 'YES' : 'NO',
      BANK: due.some((r) => /external_account/i.test(r)) ? 'YES' : 'NO',
      currently_due: newAcct.requirements?.currently_due ?? [],
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      stripeConnectAccountId: true,
      stripeConnectTrack: true,
      stripeConnectOnboardingCompleted: true,
    },
  });

  const audit = await prisma.auditLog.findFirst({
    where: {
      userId: user.id,
      action: 'STRIPE_CONNECT_PARTICULAR_MIGRATE',
    },
    orderBy: { createdAt: 'desc' },
  });

  const report = {
    LIVE_CERT_REPLACEMENT: postReplace.ok && newId ? 'PASS' : 'FAIL',
    OLD_ACCOUNT: oldExpress.id,
    LIVE_NEW_ACCOUNT_ID: newId ?? null,
    LIVE_NEW_BUSINESS_TYPE: newAcct?.business_type ?? null,
    LIVE_NEW_DASHBOARD:
      (newAcct as any)?.controller?.stripe_dashboard?.type ?? null,
    LIVE_NEW_CARD_PAYMENTS: newAcct?.capabilities?.card_payments ?? null,
    LIVE_NEW_TRANSFERS: newAcct?.capabilities?.transfers ?? null,
    requirements,
    GET_BEFORE: {
      migrationClass: get1.migrationClass,
      recoveryEligible: get1.recoveryEligible,
      needsTrackSelection: get1.needsTrackSelection,
    },
    REPLACE_STATUS: postReplace.status,
    DOUBLE_CLICK_SAME_ACCOUNT:
      againBody.accountId === newId ? 'PASS' : 'FAIL',
    DB_TRACK: dbUser?.stripeConnectTrack,
    DB_ACCOUNT: dbUser?.stripeConnectAccountId,
    PAYMENT_READY: dbUser?.stripeConnectOnboardingCompleted === true,
    AUDIT_PRESENT: Boolean(audit),
    OLD_PRESERVED_IN_AUDIT:
      (audit?.meta as any)?.oldStripeAccountId === oldExpress.id,
    ONBOARDING_URL_PRESENT: Boolean(replaceBody.onboardingUrl),
  };

  const dir = `docs/audits/dual-track-connect/migration-live-cert-${stamp}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log('WROTE', dir);
  const cleanup = await disposeTempCertificationUsers([user.id]);
  assertCertCleanupCompleted(cleanup);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : 'cert_failed');
  if (createdCertUserId) {
    const cleanup = await disposeTempCertificationUsers([createdCertUserId]).catch(() => null);
    if (!cleanup) console.error('cert_cleanup_incomplete');
    else {
      try {
        assertCertCleanupCompleted(cleanup);
      } catch {
        console.error('cert_cleanup_incomplete');
      }
    }
  }
  process.exit(1);
});
