import type { Prisma, PrismaClient } from '@prisma/client';
import { financialStripeSecret } from '@/lib/stripe';
import Stripe from 'stripe';
import {
  acceptanceMatchesCurrent,
  agreementAcceptanceRow,
  type AgreementLanguage,
} from '@/lib/delivery/delivery-agreement-version';
import {
  courierTransferReady,
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
      user: { select: { stripeConnectAccountId: true } },
    },
  });
  if (!profile) {
    return { ok: false, status: 404, code: 'DELIVERY_PROVIDER_REQUIRED', error: 'Bezorgaanbieder niet gevonden.' };
  }

  let status = profile.stripeTransfersStatus;
  let checkedAt = profile.stripeTransfersCheckedAt;
  let accountId = profile.user.stripeConnectAccountId;
  let gate = courierTransferReady({ accountId, transfersStatus: status, checkedAt });

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
      checkedAt = new Date();
      await prisma.deliveryProfile.update({
        where: { id: profile.id },
        data: { stripeTransfersStatus: status, stripeTransfersCheckedAt: checkedAt },
      });
      gate = courierTransferReady({ accountId, transfersStatus: status, checkedAt, now: checkedAt });
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
