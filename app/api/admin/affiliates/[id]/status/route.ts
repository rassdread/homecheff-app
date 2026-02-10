import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AffiliateStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Update affiliate status
 * PUT /api/admin/affiliates/[id]/status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || (status !== 'ACTIVE' && status !== 'SUSPENDED')) {
      return NextResponse.json(
        { error: 'Status must be ACTIVE or SUSPENDED' },
        { status: 400 }
      );
    }

    // Check if affiliate exists
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Update the affiliate status
    // When SUSPENDED, they can sign up again (signup route will handle this)
    // Historical data (commissions, attributions) is preserved
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id },
      data: { status: status as AffiliateStatus },
    });

    return NextResponse.json({
      success: true,
      affiliate: {
        id: updatedAffiliate.id,
        status: updatedAffiliate.status,
        affiliateName: affiliate.user.name,
        affiliateEmail: affiliate.user.email,
      },
      message: status === 'SUSPENDED' 
        ? 'Affiliate account geschorst. Gebruiker moet opnieuw aanmelden om weer actief te worden.'
        : `Affiliate status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('Error updating affiliate status:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate status' },
      { status: 500 }
    );
  }
}

