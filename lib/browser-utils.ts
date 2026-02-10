/**
 * Browser detection utilities
 * Specifically optimized for Safari and iOS compatibility
 */

/**
 * Detect if the current browser is Safari (desktop or mobile)
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  // Safari detection: has 'safari' but not 'chrome' or 'crios' (Chrome on iOS)
  return /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
}

/**
 * Detect if the current device is iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Detect if the current browser is Safari on iOS
 */
export function isSafariIOS(): boolean {
  return isSafari() && isIOS();
}

/**
 * Detect if the current browser is Safari on macOS
 */
export function isSafariMacOS(): boolean {
  return isSafari() && !isIOS();
}

/**
 * Check if sessionStorage is available and working
 * Safari in private browsing mode may block sessionStorage
 */
export function isSessionStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__session_storage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if localStorage is available and working
 * Safari in private browsing mode may block localStorage
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__local_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get recommended delay for Safari cookie operations (in milliseconds)
 * Safari needs more time to set and accept cookies, especially on iOS
 */
export function getSafariCookieDelay(): number {
  if (isSafariIOS()) {
    return 800; // iOS Safari needs more time
  } else if (isSafari()) {
    return 500; // Desktop Safari
  }
  return 300; // Other browsers
}

/**
 * Safely set item in sessionStorage with Safari fallback
 */
export function safeSessionStorageSetItem(key: string, value: string): boolean {
  if (!isSessionStorageAvailable()) {
    console.warn(`SessionStorage not available, cannot set ${key}`);
    return false;
  }
  
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Failed to set sessionStorage item ${key}:`, e);
    return false;
  }
}

/**
 * Safely get item from sessionStorage with Safari fallback
 */
export function safeSessionStorageGetItem(key: string): string | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }
  
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to get sessionStorage item ${key}:`, e);
    return null;
  }
}

/**
 * Safely remove item from sessionStorage with Safari fallback
 */
export function safeSessionStorageRemoveItem(key: string): boolean {
  if (!isSessionStorageAvailable()) {
    return false;
  }
  
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Failed to remove sessionStorage item ${key}:`, e);
    return false;
  }
}

/**
 * Check if IntersectionObserver is supported
 * iPhone 7 Safari (iOS 10-15) should support it, but we check anyway
 */
export function isIntersectionObserverSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'IntersectionObserver' in window;
}

/**
 * Create a safe IntersectionObserver with fallback for old browsers
 * For old browsers without IntersectionObserver, we use a simple scroll-based fallback
 * 
 * Modern browsers (Chrome, Firefox, Edge, Safari 12.1+) will always get IntersectionObserver
 * Only very old browsers (IE, very old Safari) will get null and use fallback
 */
export function createSafeIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (!isIntersectionObserverSupported()) {
    // Fallback: return null and let the caller handle it
    // The caller should use scroll-based detection as fallback
    // Only log in development to avoid console noise in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('IntersectionObserver not supported, using fallback');
    }
    return null;
  }
  
  try {
    return new IntersectionObserver(callback, options);
  } catch (e) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to create IntersectionObserver:', e);
    }
    return null;
  }
}

/**
 * Simple scroll-based visibility detection for old browsers
 * This is a fallback when IntersectionObserver is not available
 */
export function checkElementVisibility(element: HTMLElement): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
}


