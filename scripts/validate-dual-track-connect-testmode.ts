/**
 * FASE 1 — disposable Stripe TEST MODE Connect matrix (A/B/C).
 * Read/create only against test keys. No production/live mutations.
 *
 * Run: npx tsx scripts/validate-dual-track-connect-testmode.ts
 */
import Stripe from 'stripe';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

function loadTestKey(): string {
  const fromEnv =
    process.env.STRIPE_TEST_SECRET_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY_TEST?.trim() ||
    (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test')
      ? process.env.STRIPE_SECRET_KEY.trim()
      : undefined);
  if (fromEnv) return fromEnv;

  const cfg = readFileSync(join(homedir(), '.config/stripe/config.toml'), 'utf8');
  // Prefer full sk_test from logged-in CLI profile; skip claimable rkcs_* keys.
  const preferredSections = [
    'homecheff-main',
    'default',
    'homecheff-hc-test',
    'homecheff-dual-track-fase1',
  ];
  for (const section of preferredSections) {
    const re = new RegExp(
      `\\[${section}\\][\\s\\S]*?test_mode_api_key\\s*=\\s*['"]([^'"]+)['"]`,
    );
    const key = cfg.match(re)?.[1];
    if (key?.startsWith('sk_test')) return key;
  }
  const anySk = [...cfg.matchAll(/test_mode_api_key\s*=\s*['"](sk_test_[^'"]+)['"]/g)].map(
    (m) => m[1],
  )[0];
  if (anySk) return anySk;
  throw new Error('No Stripe sk_test key found (env or ~/.config/stripe)');
}

function summarize(label: string, acct: Stripe.Account | null, err: any = null) {
  if (err) {
    return {
      label,
      ok: false,
      error_type: err.type,
      error_code: err.code,
      error_param: err.param,
      error_message: String(err.message || '').slice(0, 400),
    };
  }
  const c: any = (acct as any).controller || {};
  const due = [
    ...(acct!.requirements?.currently_due ?? []),
    ...(acct!.requirements?.eventually_due ?? []),
  ];
  return {
    label,
    ok: true,
    id: acct!.id,
    type: acct!.type,
    country: acct!.country,
    business_type: acct!.business_type,
    company_structure: (acct as any).company?.structure ?? null,
    company_tax_id_provided: Boolean((acct as any).company?.tax_id_provided),
    charges_enabled: acct!.charges_enabled,
    payouts_enabled: acct!.payouts_enabled,
    details_submitted: acct!.details_submitted,
    capabilities: acct!.capabilities,
    controller: {
      type: c.type ?? null,
      losses_payments: c.losses?.payments ?? null,
      fees_payer: c.fees?.payer ?? null,
      requirement_collection: c.requirement_collection ?? null,
      stripe_dashboard_type: c.stripe_dashboard?.type ?? null,
    },
    tos_service_agreement: (acct as any).tos_acceptance?.service_agreement ?? null,
    currently_due: acct!.requirements?.currently_due ?? [],
    eventually_due: acct!.requirements?.eventually_due ?? [],
    past_due: acct!.requirements?.past_due ?? [],
    pending_verification: acct!.requirements?.pending_verification ?? [],
    errors: (acct!.requirements?.errors ?? []).map((e: any) => ({
      code: e.code,
      requirement: e.requirement,
    })),
    future_currently_due: (acct as any).future_requirements?.currently_due ?? [],
    future_eventually_due: (acct as any).future_requirements?.eventually_due ?? [],
    future_errors: ((acct as any).future_requirements?.errors ?? []).map((e: any) => ({
      code: e.code,
      requirement: e.requirement,
    })),
    kvk_or_tax_id_required: due.some((r) =>
      /tax_id|kvk|company\.verification\.document|proof_of_registration/i.test(r),
    ),
    company_doc_required: due.some((r) =>
      /company\.verification\.document|proof_of_registration/i.test(r),
    ),
    person_kyc_present: due.some((r) =>
      /individual\.|representative\.|external_account|dob|address|first_name|last_name/i.test(
        r,
      ),
    ),
    external_account_due: due.some((r) => /external_account/i.test(r)),
  };
}

async function main() {
  const key = loadTestKey();
  const keyKind = key.startsWith('rkcs_test')
    ? 'restricted_test'
    : key.startsWith('sk_test')
      ? 'secret_test'
      : 'other';
  if (!key.includes('test')) {
    throw new Error('Refusing to run FASE 1 against a non-test key');
  }

  const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
  const stamp = Date.now();

  async function tryCreate(label: string, params: Stripe.AccountCreateParams) {
    try {
      const acct = await stripe.accounts.create(params);
      const full = await stripe.accounts.retrieve(acct.id);
      return summarize(label, full);
    } catch (e: any) {
      return summarize(label, null, e);
    }
  }

  const results: any[] = [];

  results.push(
    await tryCreate('PROBE_FULL_CONTROLLER', {
      country: 'NL',
      email: `probe-full-${stamp}@example.com`,
      business_type: 'individual',
      controller: {
        stripe_dashboard: { type: 'none' },
        fees: { payer: 'application' },
        losses: { payments: 'application' },
        requirement_collection: 'application',
      },
      capabilities: { transfers: { requested: true } },
    } as any),
  );

  results.push(
    await tryCreate('PROBE_DASHBOARD_NONE_ONLY', {
      country: 'NL',
      email: `probe-dash-${stamp}@example.com`,
      business_type: 'individual',
      controller: { stripe_dashboard: { type: 'none' } },
      capabilities: { transfers: { requested: true } },
    } as any),
  );

  results.push(
    await tryCreate('A_DASHBOARD_NONE_INDIVIDUAL_TRANSFERS', {
      country: 'NL',
      email: `hc-dual-a-${stamp}@example.com`,
      business_type: 'individual',
      controller: {
        stripe_dashboard: { type: 'none' },
        fees: { payer: 'application' },
        losses: { payments: 'application' },
        requirement_collection: 'application',
      },
      capabilities: { transfers: { requested: true } },
    } as any),
  );

  results.push(
    await tryCreate('B_RECIPIENT_DASHBOARD_NONE_INDIVIDUAL_TRANSFERS', {
      country: 'NL',
      email: `hc-dual-b-${stamp}@example.com`,
      business_type: 'individual',
      controller: {
        stripe_dashboard: { type: 'none' },
        fees: { payer: 'application' },
        losses: { payments: 'application' },
        requirement_collection: 'application',
      },
      capabilities: { transfers: { requested: true } },
      tos_acceptance: { service_agreement: 'recipient' },
    } as any),
  );

  // recipient without tos at create — set via param only if B failed on tos shape
  results.push(
    await tryCreate('B2_RECIPIENT_WITH_TYPE_CUSTOM', {
      type: 'custom',
      country: 'NL',
      email: `hc-dual-b2-${stamp}@example.com`,
      business_type: 'individual',
      capabilities: { transfers: { requested: true } },
      tos_acceptance: { service_agreement: 'recipient' },
    } as any),
  );

  results.push(
    await tryCreate('C_EXPRESS_CONTROL', {
      type: 'express',
      country: 'NL',
      email: `hc-dual-c-${stamp}@example.com`,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    }),
  );

  results.push(
    await tryCreate('C2_EXPRESS_INDIVIDUAL_EXPLICIT', {
      type: 'express',
      country: 'NL',
      email: `hc-dual-c2-${stamp}@example.com`,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    }),
  );

  // Full SA dashboard=none with transfers only (explicit, no recipient)
  results.push(
    await tryCreate('A2_FULL_SA_IMPLICIT_DASHBOARD_NONE', {
      country: 'NL',
      email: `hc-dual-a2-${stamp}@example.com`,
      business_type: 'individual',
      controller: {
        stripe_dashboard: { type: 'none' },
        fees: { payer: 'application' },
        losses: { payments: 'application' },
        requirement_collection: 'application',
      },
      capabilities: { transfers: { requested: true } },
    } as any),
  );

  const a =
    results.find((r) => r.label === 'A_DASHBOARD_NONE_INDIVIDUAL_TRANSFERS' && r.ok) ||
    results.find((r) => r.label === 'PROBE_FULL_CONTROLLER' && r.ok) ||
    results.find((r) => r.label === 'A2_FULL_SA_IMPLICIT_DASHBOARD_NONE' && r.ok);

  const particularPass = Boolean(
    a?.ok &&
      a.business_type === 'individual' &&
      a.controller?.stripe_dashboard_type === 'none' &&
      !a.kvk_or_tax_id_required &&
      !a.company_doc_required &&
      a.person_kyc_present,
  );

  const acceptedControllerParams: string[] = [];
  for (const r of results) {
    if (r.ok && r.controller) {
      acceptedControllerParams.push(
        `${r.label}: dashboard=${r.controller.stripe_dashboard_type}, fees=${r.controller.fees_payer}, losses=${r.controller.losses_payments}, req=${r.controller.requirement_collection}`,
      );
    }
  }

  const report = {
    key_kind: keyKind,
    api_version: '2025-08-27.basil',
    PARTICULAR_NO_KVK_TEST: particularPass ? 'PASS' : 'FAIL',
    accepted_controller_summaries: acceptedControllerParams,
    results,
  };

  const outDir = join(
    process.cwd(),
    'docs/audits/dual-track-connect',
    `testmode-${stamp}`,
  );
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log('\nWROTE', join(outDir, 'report.json'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
