/**
 * Session cleanup utilities for data privacy and isolation
 */

// Clear all user-specific data from localStorage and sessionStorage
export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;

  // Clear cart data first
  clearAllCartData();

  // Clear all localStorage items related to the app
  const keysToRemove: string[] = [];
  
  // Check localStorage for all possible user-related keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('homecheff_') ||
      key.startsWith('user_') ||
      key.startsWith('delivery_') ||
      key.startsWith('seller_') ||
      key.startsWith('current_user') ||
      key.includes('profile') ||
      key.includes('settings') ||
      key.includes('cart') ||
      key.includes('favorites') ||
      key.includes('search') ||
      key.includes('filters') ||
      key.includes('preferences') ||
      key.includes('notifications') ||
      key.includes('auth') ||
      key.includes('session') ||
      key.includes('token')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove identified keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear ALL sessionStorage (more aggressive cleanup)
  sessionStorage.clear();

  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('homecheff') || 
            cacheName.includes('user') || 
            cacheName.includes('api') ||
            cacheName.includes('next')) {
          caches.delete(cacheName);
        }
      });
    });
  }

  // Clear any IndexedDB data
  if ('indexedDB' in window) {
    try {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name && (
            db.name.includes('homecheff') || 
            db.name.includes('user') ||
            db.name.includes('cart')
          )) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    } catch (error) {
      console.warn('Could not clear IndexedDB:', error);
    }
  }
}

// Clear specific user session data
export function clearUserSession(userEmail: string): void {
  if (typeof window === 'undefined') return;

  // Clear user-specific cart
  const cartKey = `homecheff_cart_${userEmail}`;
  localStorage.removeItem(cartKey);

  // Clear any other user-specific data
  const userKeys = [
    `user_profile_${userEmail}`,
    `user_settings_${userEmail}`,
    `delivery_profile_${userEmail}`,
    `seller_profile_${userEmail}`,
    `user_preferences_${userEmail}`
  ];

  userKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

// Validate session and clear if invalid
export function validateAndCleanSession(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    // Check if there's any corrupted data
    const cartData = localStorage.getItem('homecheff_cart_');
    if (cartData) {
      try {
        JSON.parse(cartData);
      } catch {
        // Corrupted cart data, clear it
        clearAllUserData();
        return false;
      }
    }

    return true;
  } catch {
    // Error occurred, clear everything
    clearAllUserData();
    return false;
  }
}

// Clear data on page unload (for security)
export function setupSessionCleanup(): void {
  if (typeof window === 'undefined') return;

  // Clear sensitive data on page unload
  window.addEventListener('beforeunload', () => {
    // Only clear sensitive data, keep cart for user convenience
    const sensitiveKeys = [
      'user_password',
      'user_token',
      'auth_token',
      'session_data'
    ];

    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  });
}

// Force complete session reset (call on login/logout)
export function forceSessionReset(): void {
  if (typeof window === 'undefined') return;

  // Clear all user data
  clearAllUserData();

  // Clear NextAuth cookies and session data
  clearNextAuthData();

  // Force reload to clear any cached state
  // This ensures no data leaks between users
  window.location.reload();
}

// Clear NextAuth specific data
export function clearNextAuthData(): void {
  if (typeof window === 'undefined') return;

  // Clear NextAuth cookies
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.csrf-token',
    '__Secure-next-auth.callback-url'
  ];

  cookiesToClear.forEach(cookieName => {
    // Clear cookie for current domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Clear cookie for parent domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    // Clear cookie for .domain (subdomains)
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  });

  // Clear any remaining localStorage keys that might contain session data
  const sessionKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('next-auth') ||
      key.includes('auth') ||
      key.includes('session') ||
      key.includes('user') ||
      key.includes('profile') ||
      key.includes('token')
    )) {
      (sessionKeys as string[]).push(key);
    }
  }

  sessionKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear sessionStorage completely
  sessionStorage.clear();
}

// Setup automatic session cleanup on page load
export function setupSessionIsolation(): void {
  if (typeof window === 'undefined') return;

  // Only clear data if we detect a different user (not on initial load)
  const lastUserId = sessionStorage.getItem('last_user_id');
  const currentUserId = localStorage.getItem('current_user_id');
  
  // Only clear if we have a previous user and it's different from current
  if (lastUserId && currentUserId && lastUserId !== currentUserId) {

    clearAllUserData();
  }
  
  // Store current user ID for next session (only if we have one)
  if (currentUserId) {
    sessionStorage.setItem('last_user_id', currentUserId);
  }
}

// Import cart cleanup function
import { clearAllCartData } from './cart';
