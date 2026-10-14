/**
 * Finish the single V10 Connect test account. Never creates another account.
 */
import fs from "node:fs";
import path from "node:path";

import Stripe from "stripe";

import { createStripeHcTreasuryTransferAdapter } from "../lib/hc/seller-payout/treasury-transfer-adapter";

function readTestKey(): string {
  const text = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
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

function eur(balance: Stripe.Balance) {
  return {
    available: balance.available.find((row) => row.currency === "eur")?.amount ?? null,
    pending: balance.pending.find((row) => row.currency === "eur")?.amount ?? null,
    livemode: balance.livemode,
  };
}

function accountLivemode(account: Stripe.Account): boolean | undefined {
  return (account as Stripe.Account & { livemode?: boolean }).livemode;
}

function snapshot(account: Stripe.Account) {
  return {
    id: account.id,
    livemode: accountLivemode(account) === true,
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

async function main() {
  const accountId = process.argv[2] ?? "";
  if (!accountId.startsWith("acct_")) throw new Error("ACCOUNT_ID_REQUIRED");
  const key = readTestKey();
  if (!key.startsWith("sk_test_")) throw new Error("TEST_KEY_REQUIRED");
  const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  const balance = await stripe.balance.retrieve();
  if (balance.livemode === true) throw new Error("LIVEMODE");
  const existing = await stripe.accounts.retrieve(accountId);
  if (accountLivemode(existing) === true) throw new Error("ACCOUNT_LIVEMODE");

  const banks = await stripe.accounts.listExternalAccounts(accountId, { object: "bank_account", limit: 5 });
  if (banks.data.length === 0) {
    await stripe.accounts.createExternalAccount(accountId, {
      external_account: {
        object: "bank_account",
        country: "NL",
        currency: "eur",
        account_holder_name: "Jenny Rosen",
        account_holder_type: "individual",
        account_number: "NL39RABO0300065264",
      },
    });
  }

  let account = await stripe.accounts.retrieve(accountId);
  for (let attempt = 0; attempt < 4 && account.capabilities?.transfers !== "active"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 12_000));
    account = await stripe.accounts.retrieve(accountId);
  }
  const report: Record<string, unknown> = {
    account: snapshot(account),
    balance: eur(balance),
    transfer: null,
  };
  if (account.capabilities?.transfers === "active") {
    let funds = eur(await stripe.balance.retrieve());
    report.balance = funds;
    if ((funds.available ?? 0) < 880) {
      const payment = await stripe.paymentIntents.create({
        amount: 2000,
        currency: "eur",
        payment_method: "pm_card_visa",
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
      if (payment.livemode === true) throw new Error("CHARGE_LIVEMODE");
      report.testCharge = { id: payment.id, status: payment.status };
      funds = eur(await stripe.balance.retrieve());
      report.balanceAfterCharge = funds;
    }
    if ((funds.available ?? 0) >= 880) {
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
      report.transfer = {
        first,
        second,
        sameId: first.ok && second.ok && first.transferId === second.transferId,
      };
    } else {
      report.transfer = { skipped: "INSUFFICIENT_TEST_BALANCE", available: funds.available };
    }
  }
  console.log(JSON.stringify(report));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "CONTINUE_FAILED");
  process.exit(1);
});
