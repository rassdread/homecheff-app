import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get admin preferences
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to get existing preferences
    let preferences = await prisma.$queryRaw`
      SELECT * FROM "AdminPreferences" WHERE "userId" = ${user.id}
    ` as any[];

    if (preferences.length === 0) {
      // Create default preferences
      const defaultPrefs = {
        userId: user.id,
        showTotalUsersWidget: true,
        showActiveUsersWidget: true,
        showTotalProductsWidget: true,
        showActiveDeliverersWidget: true,
        showTotalOrdersWidget: true,
        showTotalRevenueWidget: true,
        showSystemEventsWidget: true,
        showRecentUsersWidget: true,
        showRecentProductsWidget: true,
        showUsersTab: true,
        showMessagesTab: true,
        showSellersTab: true,
        showProductsTab: true,
        showDeliveryTab: true,
        showLiveLocationsTab: true,
        showAnalyticsTab: true,
        showModerationTab: true,
        showNotificationsTab: true
      };

      await prisma.$executeRaw`
        INSERT INTO "AdminPreferences" (
          "id", "userId", "showTotalUsersWidget", "showActiveUsersWidget", 
          "showTotalProductsWidget", "showActiveDeliverersWidget", 
          "showTotalOrdersWidget", "showTotalRevenueWidget", 
          "showSystemEventsWidget", "showRecentUsersWidget", 
          "showRecentProductsWidget", "showUsersTab", "showMessagesTab", 
          "showSellersTab", "showProductsTab", "showDeliveryTab", 
          "showLiveLocationsTab", "showAnalyticsTab", "showModerationTab", 
          "showNotificationsTab", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, ${user.id}, true, true, true, true, 
          true, true, true, true, true, true, true, true, true, true, 
          true, true, true, true, NOW(), NOW()
        )
      `;

      preferences = [defaultPrefs];
    }

    return NextResponse.json(preferences[0]);
  } catch (error) {
    console.error('Error fetching admin preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// Update admin preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Check if preferences exist
    const existing = await prisma.$queryRaw`
      SELECT * FROM "AdminPreferences" WHERE "userId" = ${user.id}
    ` as any[];

    if (existing.length === 0) {
      // Create new preferences
      await prisma.$executeRaw`
        INSERT INTO "AdminPreferences" (
          "id", "userId", "showTotalUsersWidget", "showActiveUsersWidget", 
          "showTotalProductsWidget", "showActiveDeliverersWidget", 
          "showTotalOrdersWidget", "showTotalRevenueWidget", 
          "showSystemEventsWidget", "showRecentUsersWidget", 
          "showRecentProductsWidget", "showUsersTab", "showMessagesTab", 
          "showSellersTab", "showProductsTab", "showDeliveryTab", 
          "showLiveLocationsTab", "showAnalyticsTab", "showModerationTab", 
          "showNotificationsTab", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, ${user.id}, ${body.showTotalUsersWidget ?? true}, 
          ${body.showActiveUsersWidget ?? true}, ${body.showTotalProductsWidget ?? true}, 
          ${body.showActiveDeliverersWidget ?? true}, ${body.showTotalOrdersWidget ?? true}, 
          ${body.showTotalRevenueWidget ?? true}, ${body.showSystemEventsWidget ?? true}, 
          ${body.showRecentUsersWidget ?? true}, ${body.showRecentProductsWidget ?? true}, 
          ${body.showUsersTab ?? true}, ${body.showMessagesTab ?? true}, 
          ${body.showSellersTab ?? true}, ${body.showProductsTab ?? true}, 
          ${body.showDeliveryTab ?? true}, ${body.showLiveLocationsTab ?? true}, 
          ${body.showAnalyticsTab ?? true}, ${body.showModerationTab ?? true}, 
          ${body.showNotificationsTab ?? true}, NOW(), NOW()
        )
      `;
    } else {
      // Update existing preferences
      await prisma.$executeRaw`
        UPDATE "AdminPreferences"
        SET 
          "showTotalUsersWidget" = ${body.showTotalUsersWidget ?? existing[0].showTotalUsersWidget},
          "showActiveUsersWidget" = ${body.showActiveUsersWidget ?? existing[0].showActiveUsersWidget},
          "showTotalProductsWidget" = ${body.showTotalProductsWidget ?? existing[0].showTotalProductsWidget},
          "showActiveDeliverersWidget" = ${body.showActiveDeliverersWidget ?? existing[0].showActiveDeliverersWidget},
          "showTotalOrdersWidget" = ${body.showTotalOrdersWidget ?? existing[0].showTotalOrdersWidget},
          "showTotalRevenueWidget" = ${body.showTotalRevenueWidget ?? existing[0].showTotalRevenueWidget},
          "showSystemEventsWidget" = ${body.showSystemEventsWidget ?? existing[0].showSystemEventsWidget},
          "showRecentUsersWidget" = ${body.showRecentUsersWidget ?? existing[0].showRecentUsersWidget},
          "showRecentProductsWidget" = ${body.showRecentProductsWidget ?? existing[0].showRecentProductsWidget},
          "showUsersTab" = ${body.showUsersTab ?? existing[0].showUsersTab},
          "showMessagesTab" = ${body.showMessagesTab ?? existing[0].showMessagesTab},
          "showSellersTab" = ${body.showSellersTab ?? existing[0].showSellersTab},
          "showProductsTab" = ${body.showProductsTab ?? existing[0].showProductsTab},
          "showDeliveryTab" = ${body.showDeliveryTab ?? existing[0].showDeliveryTab},
          "showLiveLocationsTab" = ${body.showLiveLocationsTab ?? existing[0].showLiveLocationsTab},
          "showAnalyticsTab" = ${body.showAnalyticsTab ?? existing[0].showAnalyticsTab},
          "showModerationTab" = ${body.showModerationTab ?? existing[0].showModerationTab},
          "showNotificationsTab" = ${body.showNotificationsTab ?? existing[0].showNotificationsTab},
          "updatedAt" = NOW()
        WHERE "userId" = ${user.id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating admin preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

