-- AlterTable
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewOrdersTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewOrdersTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewFinancialTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewFinancialTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewDisputesTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewDisputesTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewSettingsTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewSettingsTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewAuditTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewAuditTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewUsersTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewUsersTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewMessagesTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewMessagesTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewSellersTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewSellersTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewProductsTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewProductsTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewDeliveryTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewDeliveryTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewLiveLocationsTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewLiveLocationsTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewAnalyticsTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewAnalyticsTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewModerationTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewModerationTab" BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminPermissions' AND column_name = 'canViewNotificationsTab') THEN
        ALTER TABLE "AdminPermissions" ADD COLUMN "canViewNotificationsTab" BOOLEAN DEFAULT true;
    END IF;
END $$;

