-- Add tab permission fields to AdminPermissions table
-- These fields are optional (nullable) so existing records won't be affected

ALTER TABLE "AdminPermissions" 
ADD COLUMN IF NOT EXISTS "canViewOrdersTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewFinancialTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewDisputesTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewSettingsTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewAuditTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewUsersTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewMessagesTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewSellersTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewProductsTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewDeliveryTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewLiveLocationsTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewAnalyticsTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewVariabelenTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewModerationTab" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "canViewNotificationsTab" BOOLEAN DEFAULT true;










