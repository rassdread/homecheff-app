import type { Prisma, PrismaClient } from '@prisma/client';
import { financialStripeSecret } from '@/lib/stripe';
import Stripe from 'stripe';
import {
  acceptanceMatchesCurrent,
  agreementAcceptanceRow,
  type AgreementLanguage,
} from '@/lib/delivery/delivery-agreement-version';
import {
  courierPayoutReady,
  payoutsEnabledFromAccount,
  transfersStatusFromAccount,
} from '@/lib/delivery/courier-connect-eligibility';

export type PayableResult =
  | { ok: true }
  | { ok: false; status: number; code: string; error: string };

function stripeClient() {
  const key = financialStripeSecret();
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
}

export async function recordAgreementAcceptance(
  prisma: PrismaClient | Prisma.TransactionClient,
  input: { deliveryProfileId: string; userId: string; language?: AgreementLanguage },
) {
  const row = agreementAcceptanceRow(input);
  await prisma.deliveryAgreementAcceptance.upsert({
    where: {
      deliveryProfileId_version_language: {
        deliveryProfileId: row.deliveryProfileId,
        version: row.version,
        language: row.language,
      },
    },
    create: row,
    update: {},
  });
}

export async function ensureCourierPayable(
  prisma: PrismaClient,
  deliveryProfileId: string,
  options?: { requireAgreement?: boolean },
): Promise<PayableResult> {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: deliveryProfileId },
    select: {
      id: true,
      userId: true,
      stripeTransfersStatus: true,
      stripeTransfersCheckedAt: true,
      stripePayoutsEnabled: true,
      user: { select: { stripeConnectAccountId: true } },
    },
  });
  if (!profile) {
    return { ok: false, status: 404, code: 'DELIVERY_PROVIDER_REQUIRED', error: 'Bezorgaanbieder niet gevonden.' };
  }

  let status = profile.stripeTransfersStatus;
  let payoutsEnabled = profile.stripePayoutsEnabled;
  let checkedAt = profile.stripeTransfersCheckedAt;
  let accountId = profile.user.stripeConnectAccountId;
  let gate = courierPayoutReady({
    accountId,
    transfersStatus: status,
    payoutsEnabled,
    checkedAt,
  });

  if (!gate.ready && gate.stale && accountId) {
    const stripe = stripeClient();
    if (!stripe) {
      return {
        ok: false,
        status: 403,
        code: 'COURIER_CONNECT_UNVERIFIED',
        error: 'De Stripe-status van deze bezorger kan nu niet worden gecontroleerd.',
      };
    }
    try {
      const account = await stripe.accounts.retrieve(accountId);
      status = transfersStatusFromAccount(account);
      payoutsEnabled = payoutsEnabledFromAccount(account);
      checkedAt = new Date();
      await prisma.deliveryProfile.update({
        where: { id: profile.id },
        data: {
          stripeTransfersStatus: status,
          stripePayoutsEnabled: payoutsEnabled,
          stripeTransfersCheckedAt: checkedAt,
        },
      });
      gate = courierPayoutReady({
        accountId,
        transfersStatus: status,
        payoutsEnabled,
        checkedAt,
        now: checkedAt,
      });
    } catch {
      return {
        ok: false,
        status: 403,
        code: 'COURIER_CONNECT_UNVERIFIED',
        error: 'De Stripe-status van deze bezorger kan nu niet worden gecontroleerd.',
      };
    }
  }

  if (!gate.ready) {
    return {
      ok: false,
      status: 403,
      code: gate.code,
      error:
        gate.code === 'COURIER_CONNECT_REQUIRED'
          ? 'Deze bezorger kan nog geen uitbetalingen ontvangen. Stripe Connect moet eerst afgerond zijn.'
          : gate.code === 'COURIER_PAYOUT_NOT_READY'
            ? 'Deze bezorger is nog niet gereed voor uitbetaling. Stripe-uitbetalingen zijn niet actief.'
            : 'Deze bezorger moet Stripe-overboekingen afronden voordat een betaalde opdracht kan starten.',
    };
  }

  if (options?.requireAgreement === false) return { ok: true };

  const acceptance = await prisma.deliveryAgreementAcceptance.findFirst({
    where: { deliveryProfileId: profile.id },
    orderBy: { acceptedAt: 'desc' },
  });
  if (!acceptanceMatchesCurrent(acceptance)) {
    return {
      ok: false,
      status: 403,
      code: 'AGREEMENT_ACCEPTANCE_REQUIRED',
      error: 'Deze bezorger moet de huidige bezorgovereenkomst opnieuw accepteren.',
    };
  }
  return { ok: true };
}
