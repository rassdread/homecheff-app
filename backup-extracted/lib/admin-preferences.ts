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
  'system_admin'
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
  // Action Permissions
  { id: 'canDeleteUsers', label: 'Gebruikers Verwijderen', description: 'Kan gebruikers verwijderen', category: 'action' },
  { id: 'canEditUsers', label: 'Gebruikers Bewerken', description: 'Kan gebruikers bewerken', category: 'action' },
  { id: 'canDeleteProducts', label: 'Producten Verwijderen', description: 'Kan producten verwijderen', category: 'action' },
  { id: 'canEditProducts', label: 'Producten Bewerken', description: 'Kan producten bewerken', category: 'action' },
  { id: 'canModerateContent', label: 'Content Moderen', description: 'Kan content modereren', category: 'action' },
  { id: 'canSendNotifications', label: 'Notificaties Verzenden', description: 'Kan notificaties verzenden', category: 'action' },
  { id: 'canManageAdminPermissions', label: 'Admin Permissies Beheren', description: 'Kan admin permissies beheren (SUPERADMIN)', category: 'action' }
];

