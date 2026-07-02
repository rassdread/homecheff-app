import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  draftFromDb,
  evaluateAllContactFeatures,
  validateContactSettings,
  type MakerContactSettingsDraft,
} from '@/lib/profile/maker-contact-preferences';
import {
  resolveContactPremiumAvailability,
  toContactPremiumReadinessSummary,
} from '@/lib/profile/contact-premium-availability';

const contactSelect = {
  publicPhoneEnabled: true,
  publicPhoneNumber: true,
  publicWhatsappEnabled: true,
  publicWhatsappNumber: true,
  publicInstagramEnabled: true,
  instagramUrl: true,
  publicFacebookEnabled: true,
  facebookUrl: true,
  publicTikTokEnabled: true,
  tiktokUrl: true,
  publicWebsiteEnabled: true,
  websiteUrl: true,
  publicTelegramEnabled: true,
  telegramUrl: true,
} as const;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        ...contactSelect,
        SellerProfile: {
          select: {
            subscriptionId: true,
            subscriptionValidUntil: true,
            stripeSubscriptionId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const premium = resolveContactPremiumAvailability(user.SellerProfile);
    const { SellerProfile: _sellerProfile, ...contactDb } = user;

    return NextResponse.json({
      settings: draftFromDb(contactDb),
      premiumReadiness: toContactPremiumReadinessSummary(premium),
      featureStates: evaluateAllContactFeatures(contactDb, { premium }),
    });
  } catch (error) {
    console.error('[profile/contact GET]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<MakerContactSettingsDraft>;
    const draft: MakerContactSettingsDraft = {
      publicPhoneEnabled: Boolean(body.publicPhoneEnabled),
      publicPhoneNumber: String(body.publicPhoneNumber ?? ''),
      publicWhatsappEnabled: Boolean(body.publicWhatsappEnabled),
      publicWhatsappNumber: String(body.publicWhatsappNumber ?? ''),
      publicInstagramEnabled: Boolean(body.publicInstagramEnabled),
      instagramUrl: String(body.instagramUrl ?? ''),
      publicFacebookEnabled: Boolean(body.publicFacebookEnabled),
      facebookUrl: String(body.facebookUrl ?? ''),
      publicTikTokEnabled: Boolean(body.publicTikTokEnabled),
      tiktokUrl: String(body.tiktokUrl ?? ''),
      publicWebsiteEnabled: Boolean(body.publicWebsiteEnabled),
      websiteUrl: String(body.websiteUrl ?? ''),
      publicTelegramEnabled: Boolean(body.publicTelegramEnabled),
      telegramUrl: String(body.telegramUrl ?? ''),
    };

    const validated = validateContactSettings(draft);
    if (!validated.ok) {
      return NextResponse.json(
        { error: 'Validation failed', fieldErrors: validated.errors },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: validated.data,
      select: contactSelect,
    });

    return NextResponse.json({
      success: true,
      settings: draftFromDb(updated),
    });
  } catch (error) {
    console.error('[profile/contact PATCH]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
