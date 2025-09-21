/**
 * Session cleanup utilities for data privacy and isolation
 */

// Clear all user-specific data from localStorage and sessionStorage
export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;

  // Clear cart data
  clearAllCartData();

  // Clear any other user-specific data
  const keysToRemove: string[] = [];
  
  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('homecheff_') ||
      key.startsWith('user_') ||
      key.startsWith('delivery_') ||
      key.startsWith('seller_') ||
      key.includes('profile') ||
      key.includes('settings')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove identified keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('homecheff') || cacheName.includes('user')) {
          caches.delete(cacheName);
        }
      });
    });
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

// Import cart cleanup function
import { clearAllCartData } from './cart';
