/**
 * Completes one NL age-16 PARTICULAR test account as far as Stripe test mode allows.
 * Refuses live keys. Does not set charges_enabled or payouts_enabled by hand.
 * Deletes the account afterwards.
 *
 * Run: npx tsx scripts/certify-nl-minor-onboarding-complete.ts
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

function summarize(account: Stripe.Account) {
  const requirements = account.requirements;
  const due = [
    ...(requirements?.currently_due ?? []),
    ...(requirements?.eventually_due ?? []),
    ...(requirements?.past_due ?? []),
    ...(requirements?.pending_verification ?? []),
    ...(account.future_requirements?.currently_due ?? []),
  ];
  const external = account.external_accounts?.data ?? [];
  return {
    id: account.id,
    country: account.country,
    business_type: account.business_type,
    type: account.type,
    dashboard: account.controller?.stripe_dashboard?.type ?? null,
    requirement_collection: account.controller?.requirement_collection ?? null,
    individual_dob: account.individual?.dob ?? null,
    representative: account.individual?.relationship?.representative ?? null,
    verification_status: account.individual?.verification?.status ?? null,
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
    external_accounts: external.map((item) => ({
      object: item.object,
      country: 'country' in item ? item.country : null,
      currency: 'currency' in item ? item.currency : null,
      status: 'status' in item ? item.status : null,
      last4: 'last4' in item ? item.last4 : null,
    })),
  };
}

async function main() {
  const key = process.env.STRIPE_TEST_SECRET_KEY || '';
  const outDir = path.join(process.cwd(), 'docs/audits/nl-minor-connect-13-17');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'stripe-onboarding-completion.json');
  if (!key.startsWith('sk_test_')) {
    const report = {
      STRIPE_TEST_MODE: false,
      reason: key.startsWith('sk_live_') ? 'REFUSED_LIVE_KEY' : 'NO_TEST_KEY',
      note: 'No Connected Account was created.',
    };
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    process.exit(key.startsWith('sk_live_') ? 2 : 0);
  }

  const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
  const today = calendarYmdInTimeZone(new Date(), 'Europe/Amsterdam');
  const dob = canonicalDobToStripeParts(
    calendarDateToStoredUtc({ year: today.year - 16, month: today.month, day: today.day }),
  );
  let accountId: string | null = null;
  const steps: Record<string, unknown> = {};

  try {
    const params = buildParticularConnectAccountParams(
      `nl-minor-complete-16-${Date.now()}@homecheff-validation.test`,
      'NL',
    );
    params.individual = {
      first_name: 'Test',
      last_name: 'Minor',
      email: params.email,
      phone: '+31612345678',
      dob: dob ?? undefined,
      address: {
        line1: 'Keizersgracht 1',
        city: 'Amsterdam',
        postal_code: '1015CN',
        country: 'NL',
      },
    };
    params.business_profile = { mcc: '5499', url: 'https://homecheff.eu' };
    params.tos_acceptance = { date: Math.floor(Date.now() / 1000), ip: '127.0.0.1' };
    const created = await stripe.accounts.create(params);
    accountId = created.id;
    steps.beforeExternalAccount = summarize(await stripe.accounts.retrieve(accountId));

    try {
      const bank = await stripe.accounts.createExternalAccount(accountId, {
        external_account: {
          object: 'bank_account',
          country: 'NL',
          currency: 'eur',
          account_holder_name: 'Test Minor',
          account_holder_type: 'individual',
          account_number: 'NL91ABNA0417164300',
        },
      });
      steps.externalAccountCreate = {
        ok: true,
        id: bank.id,
        object: bank.object,
        status: 'status' in bank ? bank.status : null,
      };
    } catch (error) {
      steps.externalAccountCreate = {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }

    try {
      await stripe.accounts.update(accountId, {
        individual: {
          verification: { document: { front: 'file_identity_document_success' } },
        },
      });
      steps.identityDocumentToken = { ok: true };
    } catch (error) {
      steps.identityDocumentToken = {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }

    const persons = await stripe.accounts.listPersons(accountId, { limit: 20 });
    steps.persons = persons.data.map((person) => ({
      id: person.id,
      representative: person.relationship?.representative ?? null,
      legal_guardian: person.relationship?.legal_guardian ?? null,
    }));
    steps.after = summarize(await stripe.accounts.retrieve(accountId));
    await new Promise((resolve) => setTimeout(resolve, 12000));
    steps.afterWait = summarize(await stripe.accounts.retrieve(accountId));
  } finally {
    if (accountId) {
      try {
        await stripe.accounts.del(accountId);
        steps.deleted = true;
      } catch (error) {
        steps.deleted = false;
        steps.deleteError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const report = {
    mode: 'test',
    age: 16,
    testIban: 'NL91ABNA0417164300',
    note: 'Example IBAN accepted or rejected by Stripe test mode. This does not confirm a real minor-owned IBAN.',
    manuallyMarkedReady: false,
    steps,
  };
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
