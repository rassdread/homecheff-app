// Mapping van admin roles naar dashboard tabs en widgets

export const ADMIN_ROLE_TAB_MAPPING: Record<string, string[]> = {
  'users_management': ['users', 'messages'],
  'products_management': ['products'],
  'orders_management': ['orders', 'transactions'],
  'delivery_management': ['delivery', 'live-locations'],
  'analytics_viewer': ['analytics'],
  'content_moderator': ['moderation'],
  'user_support': ['messages', 'notifications'],
  'financial_viewer': ['analytics', 'orders'],
  'system_admin': ['users', 'messages', 'sellers', 'products', 'delivery', 'live-locations', 'analytics', 'moderation', 'notifications', 'admin-management']
};

export const ADMIN_ROLE_WIDGET_MAPPING: Record<string, string[]> = {
  'users_management': ['totalUsers', 'activeUsers', 'recentUsers'],
  'products_management': ['totalProducts', 'recentProducts'],
  'orders_management': ['totalOrders', 'totalRevenue'],
  'delivery_management': ['activeDeliverers'],
  'analytics_viewer': ['totalRevenue', 'activeUsers', 'systemEvents'],
  'content_moderator': ['recentProducts', 'recentUsers'],
  'user_support': ['recentUsers'],
  'financial_viewer': ['totalRevenue', 'totalOrders'],
  'system_admin': ['totalUsers', 'activeUsers', 'totalProducts', 'activeDeliverers', 'totalOrders', 'totalRevenue', 'systemEvents', 'recentUsers', 'recentProducts']
};

// Helper functies
export function getUserAllowedTabs(adminRoles: string[]): string[] {
  if (!adminRoles || adminRoles.length === 0) {
    return ['overview']; // Default: alleen overview
  }

  const allowedTabs = new Set<string>(['overview']); // Overview altijd toegankelijk
  
  adminRoles.forEach(role => {
    const tabs = ADMIN_ROLE_TAB_MAPPING[role] || [];
    tabs.forEach(tab => allowedTabs.add(tab));
  });

  return Array.from(allowedTabs);
}

export function getUserAllowedWidgets(adminRoles: string[]): string[] {
  if (!adminRoles || adminRoles.length === 0) {
    return []; // Geen widgets zonder rollen
  }

  const allowedWidgets = new Set<string>();
  
  adminRoles.forEach(role => {
    const widgets = ADMIN_ROLE_WIDGET_MAPPING[role] || [];
    widgets.forEach(widget => allowedWidgets.add(widget));
  });

  return Array.from(allowedWidgets);
}

// Check if user has specific permission
export function hasPermission(adminRoles: string[], permission: string): boolean {
  if (!adminRoles || adminRoles.length === 0) return false;
  
  if (permission === 'canViewRevenue') {
    return adminRoles.includes('financial_viewer') || 
           adminRoles.includes('analytics_viewer') || 
           adminRoles.includes('system_admin');
  }
  
  if (permission === 'canViewUserDetails') {
    return adminRoles.includes('users_management') || 
           adminRoles.includes('user_support') ||
           adminRoles.includes('system_admin');
  }

  if (permission === 'canViewProductDetails') {
    return adminRoles.includes('products_management') ||
           adminRoles.includes('content_moderator') ||
           adminRoles.includes('system_admin');
  }

  if (permission === 'canViewOrderDetails') {
    return adminRoles.includes('orders_management') ||
           adminRoles.includes('financial_viewer') ||
           adminRoles.includes('system_admin');
  }

  if (permission === 'canViewAnalytics') {
    return adminRoles.includes('analytics_viewer') || 
           adminRoles.includes('system_admin');
  }

  if (permission === 'canModerateContent') {
    return adminRoles.includes('content_moderator') || 
           adminRoles.includes('system_admin');
  }

  if (permission === 'canManageAdminPermissions') {
    return adminRoles.includes('system_admin');
  }

  return adminRoles.includes('system_admin');
}

