import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateProviderActivation } from '@/lib/delivery/provider-activation';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { canManageCompanySettings } from '@/lib/delivery/company-auth';
import { isDeliveryBusinessProvider } from '@/lib/delivery/provider-identity';

export const dynamic = 'force-dynamic';

/**
 * Activate (or pause) a delivery provider for customer matching.
 * OWNER / individual profile owner only.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const wantActive = body.active !== false;
  const wantOnline = body.isOnline === true;

  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json(
      { ok: false, code: 'PROFILE_NOT_FOUND', message: 'Geen bezorgprofiel gevonden.' },
      { status: 404 },
    );
  }

  if (isDeliveryBusinessProvider(profile.providerType)) {
    const member = await prisma.deliveryCompanyMember.findUnique({
      where: {
        companyProfileId_userId: {
          companyProfileId: profile.id,
          userId: session.user.id,
        },
      },
    });
    if (
      profile.userId !== session.user.id &&
      (!member || !canManageCompanySettings(member.role))
    ) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: 'Alleen de eigenaar kan activeren.' },
        { status: 403 },
      );
    }
  }

  if (wantActive) {
    const flags = getDeliveryAlignmentFlags();
    const gate = evaluateProviderActivation(
      {
        providerType: profile.providerType,
        isActive: profile.isActive,
        isOnline: profile.isOnline,
        homeLat: profile.homeLat,
        homeLng: profile.homeLng,
        maxDistance: profile.maxDistance,
        nationalCoverage: profile.nationalCoverage,
        pricingEnabled: profile.pricingEnabled,
        baseFeeCents: profile.baseFeeCents,
        pricePerKmCents: profile.pricePerKmCents,
        minimumFeeCents: profile.minimumFeeCents,
        freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
        companyDisplayName: profile.companyDisplayName,
      },
      { requirePricing: flags.providerPricingEnabled },
    );
    if (!gate.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: 'ACTIVATION_INCOMPLETE',
          message: gate.message,
          missing: gate.missing,
        },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.deliveryProfile.update({
    where: { id: profile.id },
    data: {
      isActive: wantActive,
      isOnline: wantActive ? wantOnline || profile.isOnline : false,
    },
    select: {
      id: true,
      isActive: true,
      isOnline: true,
      providerType: true,
    },
  });

  return NextResponse.json({
    ok: true,
    profile: updated,
    message: wantActive
      ? 'Je bent actief als bezorgpartner.'
      : 'Je bezorgprofiel is gepauzeerd.',
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ ok: false, code: 'PROFILE_NOT_FOUND' }, { status: 404 });
  }

  const flags = getDeliveryAlignmentFlags();
  const gate = evaluateProviderActivation(
    {
      providerType: profile.providerType,
      isActive: profile.isActive,
      isOnline: profile.isOnline,
      homeLat: profile.homeLat,
      homeLng: profile.homeLng,
      maxDistance: profile.maxDistance,
      nationalCoverage: profile.nationalCoverage,
      pricingEnabled: profile.pricingEnabled,
      baseFeeCents: profile.baseFeeCents,
      pricePerKmCents: profile.pricePerKmCents,
      minimumFeeCents: profile.minimumFeeCents,
      freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
      companyDisplayName: profile.companyDisplayName,
    },
    { requirePricing: flags.providerPricingEnabled },
  );

  return NextResponse.json({
    ok: true,
    isActive: profile.isActive,
    isOnline: profile.isOnline,
    canActivate: gate.ok,
    activation: gate,
  });
}
