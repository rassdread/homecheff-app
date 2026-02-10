-- Add SUPERADMIN role to UserRole enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole' AND 'SUPERADMIN' = ANY(enum_range(NULL::UserRole))) THEN
        ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';
    END IF;
END $$;

-- Create AdminPreferences table
CREATE TABLE IF NOT EXISTS "AdminPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "showTotalUsersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showActiveUsersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showTotalProductsWidget" BOOLEAN NOT NULL DEFAULT true,
    "showActiveDeliverersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showTotalOrdersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showTotalRevenueWidget" BOOLEAN NOT NULL DEFAULT true,
    "showSystemEventsWidget" BOOLEAN NOT NULL DEFAULT true,
    "showRecentUsersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showRecentProductsWidget" BOOLEAN NOT NULL DEFAULT true,
    "showUsersTab" BOOLEAN NOT NULL DEFAULT true,
    "showMessagesTab" BOOLEAN NOT NULL DEFAULT true,
    "showSellersTab" BOOLEAN NOT NULL DEFAULT true,
    "showProductsTab" BOOLEAN NOT NULL DEFAULT true,
    "showDeliveryTab" BOOLEAN NOT NULL DEFAULT true,
    "showLiveLocationsTab" BOOLEAN NOT NULL DEFAULT true,
    "showAnalyticsTab" BOOLEAN NOT NULL DEFAULT true,
    "showModerationTab" BOOLEAN NOT NULL DEFAULT true,
    "showNotificationsTab" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminPreferences_userId_idx" ON "AdminPreferences"("userId");

-- Create AdminPermissions table
CREATE TABLE IF NOT EXISTS "AdminPermissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "canViewRevenue" BOOLEAN NOT NULL DEFAULT true,
    "canViewUserDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewUserEmails" BOOLEAN NOT NULL DEFAULT true,
    "canViewProductDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewOrderDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewDeliveryDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canViewSystemMetrics" BOOLEAN NOT NULL DEFAULT true,
    "canViewAuditLogs" BOOLEAN NOT NULL DEFAULT true,
    "canViewPaymentInfo" BOOLEAN NOT NULL DEFAULT true,
    "canViewPrivateMessages" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteUsers" BOOLEAN NOT NULL DEFAULT true,
    "canEditUsers" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteProducts" BOOLEAN NOT NULL DEFAULT true,
    "canEditProducts" BOOLEAN NOT NULL DEFAULT true,
    "canModerateContent" BOOLEAN NOT NULL DEFAULT true,
    "canSendNotifications" BOOLEAN NOT NULL DEFAULT true,
    "canManageAdminPermissions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminPermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminPermissions_userId_idx" ON "AdminPermissions"("userId");

