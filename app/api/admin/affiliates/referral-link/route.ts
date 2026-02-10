import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Update a referral link code for an affiliate
 * PUT /api/admin/affiliates/referral-link
 */
export async function PUT(req: NextRequest) {
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
    const { referralLinkId, newCode } = body;

    if (!referralLinkId || !newCode) {
      return NextResponse.json(
        { error: 'Referral link ID and new code are required' },
        { status: 400 }
      );
    }

    // Validate code format (alphanumeric, uppercase, 8-50 characters)
    if (!/^[A-Z0-9]{8,50}$/.test(newCode)) {
      return NextResponse.json(
        { error: 'Code must be 8-50 characters, uppercase alphanumeric only' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingLink = await prisma.referralLink.findUnique({
      where: { code: newCode },
    });

    if (existingLink && existingLink.id !== referralLinkId) {
      return NextResponse.json(
        { error: 'This referral code is already in use' },
        { status: 409 }
      );
    }

    // Update the referral link
    const updatedLink = await prisma.referralLink.update({
      where: { id: referralLinkId },
      data: { code: newCode },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      referralLink: {
        id: updatedLink.id,
        code: updatedLink.code,
        affiliateId: updatedLink.affiliateId,
        affiliateName: updatedLink.affiliate.user.name,
        affiliateEmail: updatedLink.affiliate.user.email,
      },
      message: 'Referral code successfully updated',
    });
  } catch (error: any) {
    console.error('Error updating referral link:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This referral code is already in use' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update referral link' },
      { status: 500 }
    );
  }
}







