import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AffiliateStatus } from '@prisma/client';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';

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
    const guard = await requireAdminPermission('canViewPaymentInfo');
    if (!guard.ok) return guard.response;

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

    await logAdminAction(guard.admin.user.id, 'AFFILIATE_STATUS_UPDATE', {
      targetType: 'affiliate',
      targetId: id,
      oldValue: { status: affiliate.status },
      newValue: { status },
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

