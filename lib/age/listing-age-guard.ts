import { NextResponse } from 'next/server';
import type { PrismaClient } from '@prisma/client';
import {
  evaluateMarketplaceEligibility,
  type AgeSubject,
  type MarketplaceActivity,
} from '@/lib/age/marketplace-eligibility';
import { hasActiveParentalConsent } from '@/lib/age/parental-consent';

type ConsentClient = Pick<PrismaClient, 'auditLog'>;

export function subjectFromUser(user: {
  dateOfBirth?: Date | string | null;
  stripeConnectAccountId?: string | null;
  sellerActivatedAt?: Date | string | null;
  sellerRoles?: string[] | null;
  SellerProfile?: { id?: string } | null;
  createdAt?: Date | string | null;
  country?: string | null;
}): AgeSubject {
  return {
    dateOfBirth: user.dateOfBirth,
    stripeConnectAccountId: user.stripeConnectAccountId,
    sellerActivatedAt: user.sellerActivatedAt,
    sellerRoles: user.sellerRoles,
    hasSellerProfile: Boolean(user.SellerProfile?.id),
    createdAt: user.createdAt,
    country: user.country,
  };
}

export async function marketplaceAgeResponse(params: {
  prisma: ConsentClient;
  userId: string;
  subject: AgeSubject;
  activity: MarketplaceActivity;
  category?: string | null;
  connectTrack?: 'PARTICULAR' | 'BUSINESS' | null;
  stripePayoutReady?: boolean;
  now?: Date;
}): Promise<NextResponse | null> {
  const preview = evaluateMarketplaceEligibility({
    subject: params.subject,
    activity: params.activity,
    category: params.category,
    connectTrack: params.connectTrack,
    stripePayoutReady: params.stripePayoutReady,
    parentalConsentActive: true,
    now: params.now,
  });
  const needsConsent =
    preview.mode === 'MINOR' &&
    (params.activity === 'LIST_PRODUCT' ||
      params.activity === 'OFFER_SERVICE' ||
      params.activity === 'STRIPE_ONBOARDING' ||
      params.activity === 'RECEIVE_ORDERS' ||
      params.activity === 'PAYOUTS');
  const parentalConsentActive = needsConsent
    ? await hasActiveParentalConsent(params.prisma, params.userId)
    : true;
  const decision = evaluateMarketplaceEligibility({
    subject: params.subject,
    activity: params.activity,
    category: params.category,
    connectTrack: params.connectTrack,
    stripePayoutReady: params.stripePayoutReady,
    parentalConsentActive,
    now: params.now,
  });
  if (decision.allowed) return null;
  const status = decision.code === 'DOB_REQUIRED' ? 400 : 403;
  return NextResponse.json(
    {
      error: decision.code,
      code: decision.code,
      message: decision.messageNl,
      messageNl: decision.messageNl,
      messageEn: decision.messageEn,
    },
    { status },
  );
}
