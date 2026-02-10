/**
 * Admin API for managing user-affiliate attributions
 * 
 * POST /api/admin/affiliates/attributions
 * Manually create an attribution record linking a user to an affiliate
 * 
 * GET /api/admin/affiliates/attributions
 * Get all attributions with user and affiliate details
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAttribution } from "@/lib/affiliate-attribution";
import { AttributionType, AttributionSource } from "@prisma/client";
import { ATTRIBUTION_WINDOW_DAYS } from "@/lib/affiliate-config";

export const dynamic = 'force-dynamic';

// Create manual attribution
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, affiliateId, type } = body;

    if (!userId || !affiliateId || !type) {
      return NextResponse.json(
        { error: 'userId, affiliateId, en type zijn verplicht' },
        { status: 400 }
      );
    }

    if (!['USER_SIGNUP', 'BUSINESS_SIGNUP'].includes(type)) {
      return NextResponse.json(
        { error: 'type moet USER_SIGNUP of BUSINESS_SIGNUP zijn' },
        { status: 400 }
      );
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    // Verify affiliate exists and is active
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate niet gevonden' },
        { status: 404 }
      );
    }

    if (affiliate.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Affiliate is niet actief' },
        { status: 400 }
      );
    }

    // Check for self-referral
    if (affiliate.userId === userId) {
      return NextResponse.json(
        { error: 'Een affiliate kan zichzelf niet koppelen' },
        { status: 400 }
      );
    }

    // Check if attribution already exists
    const existingAttribution = await prisma.attribution.findFirst({
      where: {
        userId,
        affiliateId,
        type: type as AttributionType,
        endsAt: {
          gt: new Date(), // Still active
        },
      },
    });

    if (existingAttribution) {
      return NextResponse.json(
        { 
          error: 'Deze gebruiker is al gekoppeld aan deze affiliate',
          existingAttribution: {
            id: existingAttribution.id,
            createdAt: existingAttribution.createdAt,
            endsAt: existingAttribution.endsAt,
          }
        },
        { status: 409 }
      );
    }

    // Create attribution with MANUAL source
    await createAttribution(
      userId,
      affiliateId,
      type as AttributionType,
      AttributionSource.MANUAL
    );

    return NextResponse.json({
      success: true,
      message: 'Gebruiker succesvol gekoppeld aan affiliate',
      attribution: {
        userId,
        affiliateId,
        type,
        source: 'MANUAL',
      },
    });
  } catch (error: any) {
    console.error('Error creating manual attribution:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij het koppelen van gebruiker aan affiliate' },
      { status: 500 }
    );
  }
}

// Get all attributions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const affiliateId = searchParams.get('affiliateId');

    const where: any = {};
    if (userId) where.userId = userId;
    if (affiliateId) where.affiliateId = affiliateId;

    const attributions = await prisma.attribution.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ attributions });
  } catch (error: any) {
    console.error('Error fetching attributions:', error);
    return NextResponse.json(
      { error: 'Fout bij het ophalen van koppelingen' },
      { status: 500 }
    );
  }
}


