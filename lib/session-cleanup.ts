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
  
  // Check localStorage for all possible user-related keys.
  // Preserve language preference and i18n cache so Safari "unauthenticated" flicker doesn't reset taal,
  // and so taalaanpassingen (i18n refactor) never cause or worsen logout issues on Safari/iPhone.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key === 'homecheff-language' || key.startsWith('i18n-')) continue; // keep language + translation cache
    if (
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
    ) {
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

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isHomecheffEuTree =
    host === 'homecheff.eu' || host.endsWith('.homecheff.eu');

  cookiesToClear.forEach(cookieName => {
    const securePart =
      window.location.protocol === 'https:' ? '; Secure' : '';
    const base = `expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${securePart}`;
    document.cookie = `${cookieName}=; ${base}`;
    if (host) {
      document.cookie = `${cookieName}=; ${base}; domain=${host}`;
    }
    // SSO: NextAuth session op .homecheff.eu (growth ↔ apex)
    if (isHomecheffEuTree) {
      document.cookie = `${cookieName}=; ${base}; domain=.homecheff.eu`;
    }
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

/**
 * Voer een betrouwbare logout uit, ook op Safari/iPhone.
 *
 * Probleem dat dit oplost: NextAuth's `signOut` wist het sessie-cookie via één Set-Cookie response;
 * als de attributen niet exact matchen met de manier waarop het cookie ooit werd gezet (bijv.
 * host-only vs `Domain=.homecheff.eu`, of `__Secure-` prefix verschillen na een config-wijziging)
 * laat Safari het oude cookie staan. Resultaat: na "uitloggen" is de gebruiker direct weer ingelogd.
 *
 * Werking:
 * 1. Lokale data weg (localStorage / sessionStorage / caches / IndexedDB).
 * 2. Hard server-call naar `/api/auth/force-logout` die alle cookie-varianten met expliciete
 *    `Set-Cookie` headers wist (host-only én `.homecheff.eu`, met/zonder `__Secure-`/`__Host-`).
 * 3. NextAuth's eigen signOut zonder redirect (best-effort) zodat de client-side session-cache
 *    direct leeg is en `useSession()` 'unauthenticated' wordt.
 * 4. Hard navigation (`window.location.assign`) zodat React/SSR opnieuw begint zonder gestale
 *    session-state of memoized auth-tokens.
 */
export async function performLogout(target: string = '/'): Promise<void> {
  if (typeof window === 'undefined') return;

  // Push-token server-side deactiveren zolang sessie-cookies nog geldig zijn.
  try {
    const { unregisterNativePushTokenBeforeLogout } = await import(
      '@/lib/native/pushLogout'
    );
    await unregisterNativePushTokenBeforeLogout();
  } catch {
    /* ignore */
  }

  // Lokale data direct weg.
  try {
    clearAllUserData();
  } catch {
    /* never block logout on cleanup errors */
  }

  // 1) Server-side cookie-purge (HttpOnly cookies kun je alleen server-side wissen).
  try {
    await fetch('/api/auth/force-logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    /* netwerkfout: doorgaan, signOut hieronder probeert het ook */
  }

  // 2) Best-effort NextAuth signOut zonder redirect (synchroniseert client-side session-state).
  try {
    const { signOut } = await import('next-auth/react');
    await signOut({ redirect: false });
  } catch {
    /* signOut mag falen — server-call hierboven heeft de cookies al gewist */
  }

  // 3) Belt-and-braces: extra non-HttpOnly cookie-namen (CSRF/callback) lokaal overschrijven.
  try {
    clearNextAuthData();
  } catch {
    /* ignore */
  }

  // 4) Hard navigation: forceer een verse pagina-load zonder gestale React-state.
  try {
    window.location.assign(target);
  } catch {
    window.location.href = target;
  }
}
