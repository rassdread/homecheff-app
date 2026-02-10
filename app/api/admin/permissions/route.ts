import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get permissions for target admin (SUPERADMIN only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only SUPERADMIN can view permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get permissions
    const permissions = await prisma.$queryRaw`
      SELECT * FROM "AdminPermissions" WHERE "userId" = ${targetUserId}
    ` as any[];

    return NextResponse.json(permissions[0] || null);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// Update permissions for target admin (SUPERADMIN only)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only SUPERADMIN can update permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, ...permissions } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Check if permissions exist
    const existing = await prisma.$queryRaw`
      SELECT * FROM "AdminPermissions" WHERE "userId" = ${userId}
    ` as any[];

    if (existing.length === 0) {
      // Create new permissions with defaults
      await prisma.$executeRaw`
        INSERT INTO "AdminPermissions" (
          "id", "userId", "canViewRevenue", "canViewUserDetails", "canViewUserEmails",
          "canViewProductDetails", "canViewOrderDetails", "canViewDeliveryDetails",
          "canViewAnalytics", "canViewSystemMetrics", "canViewAuditLogs",
          "canViewPaymentInfo", "canViewPrivateMessages", "canDeleteUsers",
          "canEditUsers", "canDeleteProducts", "canEditProducts",
          "canModerateContent", "canSendNotifications", "canManageAdminPermissions",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, ${userId}, 
          ${permissions.canViewRevenue ?? true},
          ${permissions.canViewUserDetails ?? true},
          ${permissions.canViewUserEmails ?? true},
          ${permissions.canViewProductDetails ?? true},
          ${permissions.canViewOrderDetails ?? true},
          ${permissions.canViewDeliveryDetails ?? true},
          ${permissions.canViewAnalytics ?? true},
          ${permissions.canViewSystemMetrics ?? true},
          ${permissions.canViewAuditLogs ?? true},
          ${permissions.canViewPaymentInfo ?? true},
          ${permissions.canViewPrivateMessages ?? true},
          ${permissions.canDeleteUsers ?? true},
          ${permissions.canEditUsers ?? true},
          ${permissions.canDeleteProducts ?? true},
          ${permissions.canEditProducts ?? true},
          ${permissions.canModerateContent ?? true},
          ${permissions.canSendNotifications ?? true},
          ${permissions.canManageAdminPermissions ?? false},
          NOW(), NOW()
        )
      `;
    } else {
      // Update existing permissions
      await prisma.$executeRaw`
        UPDATE "AdminPermissions"
        SET 
          "canViewRevenue" = ${permissions.canViewRevenue ?? existing[0].canViewRevenue},
          "canViewUserDetails" = ${permissions.canViewUserDetails ?? existing[0].canViewUserDetails},
          "canViewUserEmails" = ${permissions.canViewUserEmails ?? existing[0].canViewUserEmails},
          "canViewProductDetails" = ${permissions.canViewProductDetails ?? existing[0].canViewProductDetails},
          "canViewOrderDetails" = ${permissions.canViewOrderDetails ?? existing[0].canViewOrderDetails},
          "canViewDeliveryDetails" = ${permissions.canViewDeliveryDetails ?? existing[0].canViewDeliveryDetails},
          "canViewAnalytics" = ${permissions.canViewAnalytics ?? existing[0].canViewAnalytics},
          "canViewSystemMetrics" = ${permissions.canViewSystemMetrics ?? existing[0].canViewSystemMetrics},
          "canViewAuditLogs" = ${permissions.canViewAuditLogs ?? existing[0].canViewAuditLogs},
          "canViewPaymentInfo" = ${permissions.canViewPaymentInfo ?? existing[0].canViewPaymentInfo},
          "canViewPrivateMessages" = ${permissions.canViewPrivateMessages ?? existing[0].canViewPrivateMessages},
          "canDeleteUsers" = ${permissions.canDeleteUsers ?? existing[0].canDeleteUsers},
          "canEditUsers" = ${permissions.canEditUsers ?? existing[0].canEditUsers},
          "canDeleteProducts" = ${permissions.canDeleteProducts ?? existing[0].canDeleteProducts},
          "canEditProducts" = ${permissions.canEditProducts ?? existing[0].canEditProducts},
          "canModerateContent" = ${permissions.canModerateContent ?? existing[0].canModerateContent},
          "canSendNotifications" = ${permissions.canSendNotifications ?? existing[0].canSendNotifications},
          "canManageAdminPermissions" = ${permissions.canManageAdminPermissions ?? existing[0].canManageAdminPermissions},
          "updatedAt" = NOW()
        WHERE "userId" = ${userId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}

