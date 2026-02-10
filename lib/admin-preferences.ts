// Admin Dashboard Preferences and Permissions

export interface DashboardWidget {
  id: string;
  label: string;
  description: string;
  category: 'stats' | 'activity' | 'tabs';
}

export const AVAILABLE_WIDGETS: DashboardWidget[] = [
  // Stats Widgets
  {
    id: 'totalUsers',
    label: 'Totaal Gebruikers',
    description: 'Totaal aantal geregistreerde gebruikers',
    category: 'stats'
  },
  {
    id: 'activeUsers',
    label: 'Actieve Gebruikers',
    description: 'Gebruikers actief in laatste 7 dagen',
    category: 'stats'
  },
  {
    id: 'totalProducts',
    label: 'Totaal Producten',
    description: 'Totaal aantal producten in systeem',
    category: 'stats'
  },
  {
    id: 'activeDeliverers',
    label: 'Actieve Bezorgers',
    description: 'Aantal online bezorgers',
    category: 'stats'
  },
  {
    id: 'totalOrders',
    label: 'Totaal Bestellingen',
    description: 'Totaal aantal transacties',
    category: 'stats'
  },
  {
    id: 'totalRevenue',
    label: 'Totale Omzet',
    description: 'Totale omzet in euro\'s',
    category: 'stats'
  },
  {
    id: 'systemEvents',
    label: 'Systeem Events',
    description: 'Aantal systeem events vandaag',
    category: 'stats'
  },
  // Activity Widgets
  {
    id: 'recentUsers',
    label: 'Recente Gebruikers',
    description: 'Laatst geregistreerde gebruikers',
    category: 'activity'
  },
  {
    id: 'recentProducts',
    label: 'Recente Producten',
    description: 'Laatst toegevoegde producten',
    category: 'activity'
  },
  // Tabs
  {
    id: 'usersTab',
    label: 'Gebruikers Tab',
    description: 'Toon gebruikers beheer tab',
    category: 'tabs'
  },
  {
    id: 'messagesTab',
    label: 'Berichten Tab',
    description: 'Toon berichten management tab',
    category: 'tabs'
  },
  {
    id: 'sellersTab',
    label: 'Verkopers Tab',
    description: 'Toon verkopers beheer tab',
    category: 'tabs'
  },
  {
    id: 'productsTab',
    label: 'Producten Tab',
    description: 'Toon producten beheer tab',
    category: 'tabs'
  },
  {
    id: 'deliveryTab',
    label: 'Bezorgers Tab',
    description: 'Toon bezorgers beheer tab',
    category: 'tabs'
  },
  {
    id: 'liveLocationsTab',
    label: 'Live Locaties Tab',
    description: 'Toon live GPS tracking tab',
    category: 'tabs'
  },
  {
    id: 'analyticsTab',
    label: 'Analytics Tab',
    description: 'Toon analytics dashboard tab',
    category: 'tabs'
  },
  {
    id: 'moderationTab',
    label: 'Content Moderation Tab',
    description: 'Toon content moderation tab',
    category: 'tabs'
  },
  {
    id: 'notificationsTab',
    label: 'Notificaties Tab',
    description: 'Toon notificatie center tab',
    category: 'tabs'
  }
];

export interface Permission {
  id: string;
  label: string;
  description: string;
  category: 'view' | 'action';
}

export const ADMIN_ROLES = [
  'users_management',
  'products_management', 
  'orders_management',
  'delivery_management',
  'analytics_viewer',
  'content_moderator',
  'user_support',
  'financial_viewer',
  'system_admin',
  'SUPERADMIN' // Allow assigning SUPERADMIN role
];

export const AVAILABLE_PERMISSIONS: Permission[] = [
  // View Permissions
  { id: 'canViewRevenue', label: 'Omzet Bekijken', description: 'Kan omzet en financiële gegevens bekijken', category: 'view' },
  { id: 'canViewUserDetails', label: 'Gebruikers Details', description: 'Kan volledige gebruiker details bekijken', category: 'view' },
  { id: 'canViewUserEmails', label: 'Email Adressen', description: 'Kan gebruikers email adressen bekijken', category: 'view' },
  { id: 'canViewProductDetails', label: 'Product Details', description: 'Kan volledige product details bekijken', category: 'view' },
  { id: 'canViewOrderDetails', label: 'Bestelling Details', description: 'Kan volledige bestelling details bekijken', category: 'view' },
  { id: 'canViewDeliveryDetails', label: 'Bezorging Details', description: 'Kan bezorging details bekijken', category: 'view' },
  { id: 'canViewAnalytics', label: 'Analytics', description: 'Kan analytics dashboard bekijken', category: 'view' },
  { id: 'canViewSystemMetrics', label: 'Systeem Metrics', description: 'Kan systeem metrics bekijken', category: 'view' },
  { id: 'canViewAuditLogs', label: 'Audit Logs', description: 'Kan audit logs bekijken', category: 'view' },
  { id: 'canViewPaymentInfo', label: 'Betalingsinfo', description: 'Kan betalings en Stripe info bekijken', category: 'view' },
  { id: 'canViewPrivateMessages', label: 'Privé Berichten', description: 'Kan privé berichten bekijken', category: 'view' },
  // Tab Permissions
  { id: 'canViewOrdersTab', label: 'Bestellingen Tab', description: 'Kan bestellingen tab bekijken', category: 'view' },
  { id: 'canViewFinancialTab', label: 'Financieel Tab', description: 'Kan financieel tab bekijken', category: 'view' },
  { id: 'canViewDisputesTab', label: 'Disputes Tab', description: 'Kan disputes tab bekijken', category: 'view' },
  { id: 'canViewSettingsTab', label: 'Instellingen Tab', description: 'Kan instellingen tab bekijken', category: 'view' },
  { id: 'canViewAuditTab', label: 'Audit Log Tab', description: 'Kan audit log tab bekijken', category: 'view' },
  { id: 'canViewUsersTab', label: 'Gebruikers Tab', description: 'Kan gebruikers tab bekijken', category: 'view' },
  { id: 'canViewMessagesTab', label: 'Berichten Tab', description: 'Kan berichten tab bekijken', category: 'view' },
  { id: 'canViewSellersTab', label: 'Verkopers Tab', description: 'Kan verkopers tab bekijken', category: 'view' },
  { id: 'canViewProductsTab', label: 'Producten Tab', description: 'Kan producten tab bekijken', category: 'view' },
  { id: 'canViewDeliveryTab', label: 'Bezorgers Tab', description: 'Kan bezorgers tab bekijken', category: 'view' },
  { id: 'canViewLiveLocationsTab', label: 'Live Locaties Tab', description: 'Kan live locaties tab bekijken', category: 'view' },
  { id: 'canViewAnalyticsTab', label: 'Analytics Tab', description: 'Kan analytics tab bekijken', category: 'view' },
  { id: 'canViewVariabelenTab', label: 'Variabelen Tab', description: 'Kan variabelen dashboard tab bekijken', category: 'view' },
  { id: 'canViewModerationTab', label: 'Content Moderation Tab', description: 'Kan content moderation tab bekijken', category: 'view' },
  { id: 'canViewNotificationsTab', label: 'Notificaties Tab', description: 'Kan notificaties tab bekijken', category: 'view' },
  { id: 'canViewOverviewTab', label: 'Overzicht Tab', description: 'Kan overzicht tab bekijken', category: 'view' },
  { id: 'canViewAdminManagementTab', label: 'Admin Beheer Tab', description: 'Kan admin beheer tab bekijken (alleen SUPERADMIN)', category: 'view' },
  // Action Permissions
  { id: 'canDeleteUsers', label: 'Gebruikers Verwijderen', description: 'Kan gebruikers verwijderen', category: 'action' },
  { id: 'canEditUsers', label: 'Gebruikers Bewerken', description: 'Kan gebruikers bewerken', category: 'action' },
  { id: 'canDeleteProducts', label: 'Producten Verwijderen', description: 'Kan producten verwijderen', category: 'action' },
  { id: 'canEditProducts', label: 'Producten Bewerken', description: 'Kan producten bewerken', category: 'action' },
  { id: 'canModerateContent', label: 'Content Moderen', description: 'Kan content modereren', category: 'action' },
  { id: 'canSendNotifications', label: 'Notificaties Verzenden', description: 'Kan notificaties verzenden', category: 'action' },
  { id: 'canManageAdminPermissions', label: 'Admin Permissies Beheren', description: 'Kan admin permissies beheren (SUPERADMIN)', category: 'action' }
];

