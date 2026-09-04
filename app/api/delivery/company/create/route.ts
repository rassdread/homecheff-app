import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PROVIDER_TYPE_DELIVERY_BUSINESS } from '@/lib/delivery/provider-identity';

export const dynamic = 'force-dynamic';

/**
 * Create a DELIVERY_BUSINESS provider profile for the current user (company owner).
 * Settlement identity = owner User (same as DeliveryProfile.userId).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const companyDisplayName = String(body.companyDisplayName || '').trim();
  if (companyDisplayName.length < 2) {
    return NextResponse.json(
      { ok: false, code: 'COMPANY_NAME_REQUIRED', message: 'Vul een bedrijfsnaam in.' },
      { status: 400 },
    );
  }

  const existing = await prisma.deliveryProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing && existing.providerType === PROVIDER_TYPE_DELIVERY_BUSINESS) {
    return NextResponse.json({
      ok: true,
      profileId: existing.id,
      alreadyExists: true,
    });
  }
  if (existing && existing.providerType !== PROVIDER_TYPE_DELIVERY_BUSINESS) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INDIVIDUAL_PROFILE_EXISTS',
        message:
          'Je hebt al een persoonlijk bezorgprofiel. Neem contact op met support om te wisselen naar een bezorgbedrijf.',
      },
      { status: 409 },
    );
  }

  const age = Math.max(18, Number(body.age) || 18);
  const maxDistance = Number(body.maxDistance) || 15;

  const profile = await prisma.$transaction(async (tx) => {
    const created = await tx.deliveryProfile.create({
      data: {
        userId: session.user!.id!,
        age,
        bio: String(body.bio || '').trim() || null,
        transportation: Array.isArray(body.transportation) ? body.transportation : ['CAR'],
        maxDistance,
        preferredRadius: maxDistance,
        availableDays: Array.isArray(body.availableDays) ? body.availableDays : [],
        availableTimeSlots: Array.isArray(body.availableTimeSlots)
          ? body.availableTimeSlots
          : [],
        homeAddress: body.homeAddress ? String(body.homeAddress) : null,
        homeLat: typeof body.homeLat === 'number' ? body.homeLat : null,
        homeLng: typeof body.homeLng === 'number' ? body.homeLng : null,
        isActive: false,
        isVerified: false,
        isOnline: false,
        providerType: PROVIDER_TYPE_DELIVERY_BUSINESS,
        companyDisplayName,
        companyLogoUrl: body.companyLogoUrl ? String(body.companyLogoUrl) : null,
        companyDescription: body.companyDescription
          ? String(body.companyDescription).trim()
          : null,
        pricingEnabled: false,
        acceptanceMode: 'MANUAL_CONFIRM',
      },
    });

    await tx.deliveryCompanyMember.create({
      data: {
        companyProfileId: created.id,
        userId: session.user!.id!,
        role: 'OWNER',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: session.user!.id! },
      data: { role: 'DELIVERY' },
    });

    return created;
  });

  return NextResponse.json({
    ok: true,
    profileId: profile.id,
    providerType: profile.providerType,
    companyDisplayName: profile.companyDisplayName,
  });
}
