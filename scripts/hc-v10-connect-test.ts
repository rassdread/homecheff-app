/**
 * One Dutch Connect test account, using the existing Particular account shape
 * and the official Stripe test tokens. Refuses live keys. Keeps the account.
 */
import fs from "node:fs";
import path from "node:path";

import Stripe from "stripe";

import { createStripeHcTreasuryTransferAdapter } from "../lib/hc/seller-payout/treasury-transfer-adapter";
import { buildParticularConnectAccountParams } from "../lib/stripe/connect-tracks";

function readTestKey(): string {
  const file = path.join(process.cwd(), ".env.local");
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("STRIPE_TEST_SECRET_KEY=")) continue;
    let value = trimmed.slice("STRIPE_TEST_SECRET_KEY=".length).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return "";
}

function eurAvailable(balance: Stripe.Balance): { available: number | null; pending: number | null } {
  const available = balance.available.find((row) => row.currency === "eur");
  const pending = balance.pending.find((row) => row.currency === "eur");
  return {
    available: available ? available.amount : null,
    pending: pending ? pending.amount : null,
  };
}

function snapshot(account: Stripe.Account) {
  return {
    id: account.id,
    livemode: account.livemode,
    country: account.country,
    type: account.type,
    businessType: account.business_type,
    dashboard: account.controller?.stripe_dashboard?.type ?? null,
    transfers: account.capabilities?.transfers ?? null,
    cardPayments: account.capabilities?.card_payments ?? null,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    currentlyDue: account.requirements?.currently_due ?? [],
    eventuallyDue: account.requirements?.eventually_due ?? [],
    pendingVerification: account.requirements?.pending_verification ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
  };
}

const EXISTING_TEST_ACCOUNT = "acct_1UQOeCRxsTlnpkUN";

async function main() {
  if (process.env.HC_V10_ALLOW_NEW_ACCOUNT !== "1") {
    console.log(JSON.stringify({ refused: "ACCOUNT_ALREADY_CREATED", id: EXISTING_TEST_ACCOUNT }));
    process.exit(2);
  }
  const key = readTestKey();
  if (!key.startsWith("sk_test_")) {
    console.log(JSON.stringify({ refused: key.startsWith("sk_live_") ? "LIVE_KEY" : "NO_TEST_KEY" }));
    process.exit(2);
  }
  const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  const balance = await stripe.balance.retrieve();
  if (balance.livemode !== false) {
    console.log(JSON.stringify({ refused: "LIVEMODE" }));
    process.exit(2);
  }

  const email = `v10-connect-${Date.now()}@example.test`;
  const params = buildParticularConnectAccountParams(email, "NL");
  params.individual = {
    first_name: "Jenny",
    last_name: "Rosen",
    email,
    phone: "0000000000",
    dob: { day: 1, month: 1, year: 1902 },
    id_number: "222222222",
    address: {
      line1: "address_full_match",
      city: "Amsterdam",
      postal_code: "1012JS",
      country: "NL",
    },
    verification: { document: { front: "file_identity_document_success" } },
  };
  params.business_profile = {
    mcc: "5499",
    url: "https://accessible.stripe.com",
  };
  params.tos_acceptance = { date: Math.floor(Date.now() / 1000), ip: "127.0.0.1" };

  const created = await stripe.accounts.create(params);
  if (created.livemode === true) {
    console.log(JSON.stringify({ refused: "ACCOUNT_LIVEMODE", id: created.id }));
    process.exit(2);
  }
  await stripe.accounts.createExternalAccount(created.id, {
    external_account: {
      object: "bank_account",
      country: "NL",
      currency: "eur",
      account_holder_name: "Jenny Rosen",
      account_holder_type: "individual",
      account_number: "NL39RABO0300065264",
    },
  });

  let account = await stripe.accounts.retrieve(created.id);
  for (let attempt = 0; attempt < 4 && account.capabilities?.transfers !== "active"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 12_000));
    account = await stripe.accounts.retrieve(created.id);
  }
  const state = snapshot(account);
  const funds = eurAvailable(await stripe.balance.retrieve());
  const report: Record<string, unknown> = { account: state, balance: funds, transfer: null };

  if (account.capabilities?.transfers === "active" && account.livemode === false) {
    let available = funds.available ?? 0;
    if (available < 880) {
      const payment = await stripe.paymentIntents.create({
        amount: 2000,
        currency: "eur",
        payment_method: "pm_card_visa",
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
      report.testCharge = { id: payment.id, status: payment.status, livemode: payment.livemode };
      const after = eurAvailable(await stripe.balance.retrieve());
      report.balanceAfterCharge = after;
      available = after.available ?? 0;
    }
    if (available >= 880) {
      const adapter = createStripeHcTreasuryTransferAdapter(stripe);
      const input = {
        amountCents: 880,
        destinationAccountId: account.id,
        idempotencyKey: "v10:connect:test:880:v1",
        settlementSource: "HOMECHEFF_TREASURY" as const,
        orderId: "v10-test-order",
        exposureId: "v10-test-exposure",
        sellerUserId: "v10-test-seller",
        calculationVersion: "v10",
      };
      const first = await adapter.executeTransfer(input);
      const second = await adapter.executeTransfer(input);
      report.transfer = { first, second, sameId: first.ok && second.ok && first.transferId === second.transferId };
    } else {
      report.transfer = { skipped: "INSUFFICIENT_TEST_BALANCE", available };
    }
  }
  console.log(JSON.stringify(report));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "CONNECT_TEST_FAILED";
  console.error(message);
  process.exit(1);
});
