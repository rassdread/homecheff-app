/**
 * Stripe test-mode evidence for NL PARTICULAR ages 13, 15, 16, 17 and an adult 18 control.
 * Refuses live keys. Does not create a legal_guardian Person.
 * Deletes the accounts after recording API state.
 *
 * Run: npx tsx scripts/certify-nl-minor-particular-connect.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';
import { buildParticularConnectAccountParams } from '../lib/stripe/connect-tracks';
import { canonicalDobToStripeParts } from '../lib/stripe/particular-dob';
import { calendarDateToStoredUtc, calendarYmdInTimeZone } from '../lib/delivery/delivery-age';

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

function dobForAge(age: number): Date {
  const today = calendarYmdInTimeZone(new Date(), 'Europe/Amsterdam');
  return calendarDateToStoredUtc({
    year: today.year - age,
    month: today.month,
    day: today.day,
  });
}

function summarize(account: Stripe.Account) {
  const requirements = account.requirements;
  const due = [
    ...(requirements?.currently_due ?? []),
    ...(requirements?.eventually_due ?? []),
    ...(requirements?.past_due ?? []),
    ...(requirements?.pending_verification ?? []),
  ];
  return {
    id: account.id,
    country: account.country,
    business_type: account.business_type,
    type: account.type,
    dashboard: account.controller?.stripe_dashboard?.type ?? null,
    requirement_collection: account.controller?.requirement_collection ?? null,
    individual_dob: account.individual?.dob ?? null,
    representative: account.individual?.relationship?.representative ?? null,
    capabilities: account.capabilities ?? null,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    currently_due: requirements?.currently_due ?? [],
    eventually_due: requirements?.eventually_due ?? [],
    past_due: requirements?.past_due ?? [],
    pending_verification: requirements?.pending_verification ?? [],
    disabled_reason: requirements?.disabled_reason ?? null,
    future_currently_due: account.future_requirements?.currently_due ?? [],
    legal_guardian_keys: due.filter((key) => key.includes('legal_guardian')),
    external_accounts: account.external_accounts?.data?.length ?? 0,
  };
}

async function main() {
  const key = process.env.STRIPE_TEST_SECRET_KEY || '';
  const outDir = path.join(process.cwd(), 'docs/audits/nl-minor-connect-13-17');
  fs.mkdirSync(outDir, { recursive: true });
  if (!key.startsWith('sk_test_')) {
    const report = {
      STRIPE_TEST_MODE: false,
      reason: key.startsWith('sk_live_')
        ? 'REFUSED_LIVE_KEY'
        : 'NO_TEST_KEY',
      note: 'No Connected Accounts were created.',
    };
    fs.writeFileSync(path.join(outDir, 'stripe-test-evidence.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    process.exit(key.startsWith('sk_live_') ? 2 : 0);
  }

  const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
  const ages = [13, 15, 16, 17, 18];
  const created: string[] = [];
  const rows: Record<string, unknown>[] = [];

  try {
    for (const age of ages) {
      const dob = canonicalDobToStripeParts(dobForAge(age));
      const params = buildParticularConnectAccountParams(
        `nl-minor-cert-${age}-${Date.now()}@homecheff-validation.test`,
        'NL',
      );
      params.individual = { dob: dob ?? undefined };
      params.business_profile = {
        mcc: '5499',
        url: 'https://homecheff.eu',
      };
      const account = await stripe.accounts.create(params);
      created.push(account.id);
      const fresh = await stripe.accounts.retrieve(account.id);
      rows.push({ age, ...summarize(fresh) });
    }
  } finally {
    for (const id of created) {
      try {
        await stripe.accounts.del(id);
      } catch {
        // test accounts may already be gone
      }
    }
  }

  const report = {
    mode: 'test',
    createdThenDeleted: created.length,
    guardianPersonsCreated: 0,
    accounts: rows,
  };
  fs.writeFileSync(path.join(outDir, 'stripe-test-evidence.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
