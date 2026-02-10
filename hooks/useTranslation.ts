'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { addLocalePrefix } from '@/lib/locale';
import { useSession } from 'next-auth/react';

export type Language = 'nl' | 'en';

export interface Translations {
  [key: string]: any;
}

let translations: Translations = {};
let previousTranslations: Translations = {}; // Keep previous translations during language switch
let translationListeners: Set<() => void> = new Set();
let isChangingLanguage = false; // Flag to prevent race conditions during language change

// Function to notify all listeners that translations have changed
const notifyListeners = () => {
  translationListeners.forEach(listener => listener());
};

// Browser-compatible localStorage helpers with error handling
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      // Safari private mode, storage disabled, etc.
      console.warn(`[i18n] localStorage.getItem failed for ${key}:`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      // Safari private mode, quota exceeded, etc.
      console.warn(`[i18n] localStorage.setItem failed for ${key}:`, e);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[i18n] localStorage.removeItem failed for ${key}:`, e);
      return false;
    }
  },
  isAvailable: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Browser-compatible cookie helpers
const safeCookie = {
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    try {
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
      return value || null;
    } catch (e) {
      console.warn(`[i18n] Cookie get failed for ${name}:`, e);
      return null;
    }
  },
  set: (name: string, value: string, maxAge: number = 60 * 60 * 24 * 365): boolean => {
    if (typeof document === 'undefined') return false;
    try {
      // Use both max-age and expires for maximum browser compatibility
      const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
      document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; expires=${expires}; SameSite=Lax`;
      return true;
    } catch (e) {
      console.warn(`[i18n] Cookie set failed for ${name}:`, e);
      return false;
    }
  }
};

export function useTranslation() {
  const { data: session, status: sessionStatus } = useSession();
  const [language, setLanguage] = useState<Language>('nl');
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  const [isReady, setIsReady] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);
  const hasInitialized = useRef(false); // Prevent multiple initializations
  const [userLanguagePreference, setUserLanguagePreference] = useState<Language | null>(null);
  const [userPreferenceLoaded, setUserPreferenceLoaded] = useState(false); // Track if user preference has been loaded
  
  // Register this component as a listener
  useEffect(() => {
    const listener = () => {
      setUpdateKey(prev => prev + 1); // Force re-render
    };
    translationListeners.add(listener);
    return () => {
      translationListeners.delete(listener);
    };
  }, []);

  // Fetch user's language preference from database (non-blocking)
  useEffect(() => {
    const fetchUserLanguagePreference = async () => {
      if (sessionStatus === 'loading') {
        return; // Wait for session to load
      }

      // Mark as loaded immediately for non-authenticated users
      if (sessionStatus !== 'authenticated' || !session?.user) {
        setUserLanguagePreference(null);
        setUserPreferenceLoaded(true);
        return;
      }

      // For authenticated users, fetch in background (don't block translation loading)
      try {
        const response = await fetch('/api/user/language', {
          cache: 'no-store' // Always fetch fresh preference
        });
        if (response.ok) {
          const data = await response.json();
          if (data.language && (data.language === 'nl' || data.language === 'en')) {
            setUserLanguagePreference(data.language);
            console.log(`[i18n] Loaded user language preference: ${data.language}`);
          } else {
            setUserLanguagePreference(null);
          }
        } else {
          setUserLanguagePreference(null);
        }
      } catch (error) {
        console.error('[i18n] Error fetching user language preference:', error);
        setUserLanguagePreference(null);
      } finally {
        setUserPreferenceLoaded(true);
      }
    };

    fetchUserLanguagePreference();
  }, [session, sessionStatus]);

  // Track last detected language to prevent unnecessary re-initializations
  const lastDetectedLanguage = useRef<Language | null>(null);
  
  // Load translations IMMEDIATELY on mount - don't wait for session
  useEffect(() => {
    // Don't wait for session - load translations immediately for faster page load
    // If language is currently being changed, don't interfere
    if (isChangingLanguage) {
      return;
    }
    
    // Priority for authenticated users: User DB preference > localStorage > URL > cookie > domain > default
    // Priority for non-authenticated: localStorage > URL path > cookie > domain > default
    const pathname = window.location.pathname;
    const isEnglishRoute = pathname.startsWith('/en/') || pathname === '/en';
    
    let detectedLanguage: Language = 'nl'; // default
    
    // For authenticated users, check user preference first (if already loaded)
    if (sessionStatus === 'authenticated' && session?.user && userPreferenceLoaded && userLanguagePreference) {
      detectedLanguage = userLanguagePreference;
      // Sync localStorage and cookie with user preference
      safeLocalStorage.setItem('homecheff-language', userLanguagePreference);
      safeCookie.set('homecheff-language', userLanguagePreference);
    } else {
      // Check localStorage (for non-authenticated or while user preference is loading)
      const savedLanguage = safeLocalStorage.getItem('homecheff-language') as Language;
      if (savedLanguage && (savedLanguage === 'nl' || savedLanguage === 'en')) {
        detectedLanguage = savedLanguage;
        // Sync cookie with localStorage
        safeCookie.set('homecheff-language', savedLanguage);
      } else if (isEnglishRoute) {
        // No localStorage preference, but URL indicates English
        detectedLanguage = 'en';
        // Save to localStorage and cookie for consistency
        safeLocalStorage.setItem('homecheff-language', 'en');
        safeCookie.set('homecheff-language', 'en');
        } else {
          // Check domain first for domain-based language routing
          const hostname = window.location.hostname;
          const domainLanguage = hostname.includes('homecheff.eu') ? 'en' : 
                                 hostname.includes('homecheff.nl') ? 'nl' : null;
          
          if (domainLanguage) {
            // Domain forces a specific language, use it and override cookie/localStorage
            detectedLanguage = domainLanguage;
            safeLocalStorage.setItem('homecheff-language', domainLanguage);
            safeCookie.set('homecheff-language', domainLanguage);
          } else {
            // No domain override, check cookie
            const cookieLanguage = safeCookie.get('homecheff-language') as Language;
            
            if (cookieLanguage && (cookieLanguage === 'nl' || cookieLanguage === 'en')) {
              detectedLanguage = cookieLanguage;
              // Sync localStorage with cookie
              safeLocalStorage.setItem('homecheff-language', cookieLanguage);
            } else {
              // Fallback to default (nl)
              detectedLanguage = 'nl';
              // Save detected language to localStorage and cookie
              safeLocalStorage.setItem('homecheff-language', detectedLanguage);
              safeCookie.set('homecheff-language', detectedLanguage);
            }
          }
        }
    }
    
    // Only re-initialize if language actually changed or if this is the first initialization
    if (lastDetectedLanguage.current === detectedLanguage && hasInitialized.current) {
      return; // No change needed
    }
    
    lastDetectedLanguage.current = detectedLanguage;
    hasInitialized.current = true;
    
    // Always load translations for detected language IMMEDIATELY
    setLanguage(prevLang => {
      if (prevLang !== detectedLanguage) {
        return detectedLanguage;
      }
      return prevLang;
    });
    loadTranslations(detectedLanguage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, session, userPreferenceLoaded, userLanguagePreference]); // Re-run when session or user preference changes
  
  // Separate effect to update when user preference loads (background update after initial load)
  useEffect(() => {
    // Only update if user preference is different AND has been loaded
    if (!userPreferenceLoaded || !userLanguagePreference) {
      return;
    }
    
    // User preference has loaded and is different from current language
    // This happens AFTER initial load, so it's a background update
    if (userLanguagePreference !== language && (userLanguagePreference === 'nl' || userLanguagePreference === 'en')) {
      console.log(`[i18n] Updating language to user preference: ${userLanguagePreference}`);
      setLanguage(userLanguagePreference);
      lastDetectedLanguage.current = userLanguagePreference;
      loadTranslations(userLanguagePreference);
      safeLocalStorage.setItem('homecheff-language', userLanguagePreference);
      safeCookie.set('homecheff-language', userLanguagePreference);
    }
  }, [userLanguagePreference, userPreferenceLoaded, language]);

  const loadTranslations = async (lang: Language) => {
    // Prevent multiple simultaneous loads of the same language
    if (isLoading && language === lang && isReady) {
      console.log(`[i18n] Translations for ${lang} already loading or loaded, skipping...`);
      return;
    }
    
    // Use cache-first strategy: check localStorage FIRST before setting loading state
    // This ensures instant rendering from cache
    const cacheKey = `i18n-${lang}`;
    const cacheTimeKey = `i18n-${lang}-time`;
    const cacheVersionKey = `i18n-${lang}-version`;
    const CACHE_VERSION = '2.18'; // Increment this to invalidate all caches (browser compatibility update)
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    
    // Check cache FIRST, before setting loading state
    const cachedData = safeLocalStorage.getItem(cacheKey);
    const cacheTime = safeLocalStorage.getItem(cacheTimeKey);
    const cachedVersion = safeLocalStorage.getItem(cacheVersionKey);
    const now = Date.now();
    
    // Check if cache is valid: exists, not expired, and version matches
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION && cachedVersion === CACHE_VERSION) {
      try {
        const cachedTranslations = JSON.parse(cachedData);
        if (cachedTranslations && typeof cachedTranslations === 'object' && Object.keys(cachedTranslations).length > 0) {
          console.log(`[i18n] Using cached translations for ${lang} (instant load)`);
          translations = cachedTranslations;
          setIsReady(true);
          setIsLoading(false);
          notifyListeners(); // Notify immediately so UI can render
          
          // Fetch fresh in background for next time (don't await or block)
          // Use default cache strategy for better cross-browser compatibility
          fetch(`/i18n/${lang}.json?t=${now}`, {
            cache: 'default' // Better cross-browser compatibility than force-cache
          }).then(response => {
            if (response.ok) {
              return response.json().then(newTranslations => {
                if (newTranslations && typeof newTranslations === 'object' && Object.keys(newTranslations).length > 0) {
                  safeLocalStorage.setItem(cacheKey, JSON.stringify(newTranslations));
                  safeLocalStorage.setItem(cacheTimeKey, now.toString());
                  safeLocalStorage.setItem(cacheVersionKey, CACHE_VERSION);
                  // Only update if translations actually changed
                  if (JSON.stringify(translations) !== JSON.stringify(newTranslations)) {
                    translations = newTranslations;
                    notifyListeners();
                  }
                }
              });
            }
          }).catch(() => {
            // Silently fail background update
          });
          
          return; // Exit early - cache was used, no need to fetch
        }
      } catch (e) {
        // Invalid cache, clear it and continue to fetch
        safeLocalStorage.removeItem(cacheKey);
        safeLocalStorage.removeItem(cacheTimeKey);
        safeLocalStorage.removeItem(cacheVersionKey);
      }
    }
    
    // No valid cache - need to fetch
    setIsLoading(true);
    setIsReady(false);
    
    try {
      
      // Fetch fresh translations with cache-busting query param for better browser compatibility
      // Use default cache strategy (better cross-browser support than force-cache)
      const response = await fetch(`/i18n/${lang}.json?t=${now}`, {
        cache: 'default' // Better cross-browser compatibility than force-cache
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Keep previous translations as fallback during switch
      if (Object.keys(translations).length > 0) {
        previousTranslations = { ...translations };
      }
      
      const newTranslations = await response.json();
      
      // Validate that translations were loaded correctly
      if (!newTranslations || typeof newTranslations !== 'object' || Object.keys(newTranslations).length === 0) {
        throw new Error('Empty or invalid translations received');
      }
      
      translations = newTranslations;
      
      // Cache in localStorage for faster future loads (only if available)
      if (safeLocalStorage.isAvailable()) {
        safeLocalStorage.setItem(cacheKey, JSON.stringify(newTranslations));
        safeLocalStorage.setItem(cacheTimeKey, now.toString());
        safeLocalStorage.setItem(cacheVersionKey, CACHE_VERSION);
      }
      
      setIsReady(true);
      
      // Notify all listeners that translations have changed
      notifyListeners();
      
      console.log(`[i18n] ✓ Loaded ${lang} translations:`, Object.keys(newTranslations).length, 'keys');
      
    } catch (error) {
      console.error(`[i18n] ✗ Error loading ${lang} translations:`, error);
      console.error(`[i18n] Error details:`, {
        lang,
        url: `/i18n/${lang}.json`,
        isChangingLanguage,
        hasCache: !!safeLocalStorage.getItem(`i18n-${lang}`),
        localStorageAvailable: safeLocalStorage.isAvailable()
      });
      
      // Error handling strategy:
      // 1. During language change: Don't fallback (preserve user choice)
      // 2. Initial load: Fallback to Dutch if English fails
      // 3. Dutch fails: Try to use cached translations or show fallback
      
      if (isChangingLanguage) {
        // During language change, don't fallback - preserve user's choice
        console.error(`[i18n] Failed to load ${lang} during language change - preserving user choice`);
        // Try to use cached translations as fallback
        const cacheKey = `i18n-${lang}`;
        const cachedData = safeLocalStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const cachedTranslations = JSON.parse(cachedData);
            if (cachedTranslations && typeof cachedTranslations === 'object' && Object.keys(cachedTranslations).length > 0) {
              console.log(`[i18n] Using cached ${lang} translations as fallback during language change`);
              translations = cachedTranslations;
              setIsReady(true);
              notifyListeners();
            } else {
              setIsReady(false);
            }
          } catch (e) {
            setIsReady(false);
          }
        } else {
          setIsReady(false);
        }
      } else if (lang !== 'nl') {
        // English failed on initial load - fallback to Dutch
        console.log(`[i18n] Falling back to Dutch due to error...`);
        try {
          await loadTranslations('nl');
          setLanguage('nl');
          lastDetectedLanguage.current = 'nl';
          // Update localStorage and cookie to match fallback
          safeLocalStorage.setItem('homecheff-language', 'nl');
          safeCookie.set('homecheff-language', 'nl');
          return; // Don't set isLoading to false here, let the recursive call handle it
        } catch (fallbackError) {
          console.error('[i18n] CRITICAL: Fallback to Dutch also failed!', fallbackError);
          // Try to use cached Dutch translations as last resort
          const cacheKey = 'i18n-nl';
          const cachedData = safeLocalStorage.getItem(cacheKey);
          if (cachedData) {
            try {
              const cachedTranslations = JSON.parse(cachedData);
              if (cachedTranslations && typeof cachedTranslations === 'object' && Object.keys(cachedTranslations).length > 0) {
                console.log(`[i18n] Using cached Dutch translations as last resort`);
                translations = cachedTranslations;
                setIsReady(true);
                notifyListeners();
              } else {
                setIsReady(false);
              }
            } catch (e) {
              setIsReady(false);
            }
          } else {
            setIsReady(false);
          }
        }
      } else {
        // Dutch failed - try to use cached translations
        console.error('[i18n] CRITICAL: Failed to load Dutch translations!');
        const cacheKey = 'i18n-nl';
        const cachedData = safeLocalStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const cachedTranslations = JSON.parse(cachedData);
            if (cachedTranslations && typeof cachedTranslations === 'object' && Object.keys(cachedTranslations).length > 0) {
              console.log(`[i18n] Using cached Dutch translations as fallback`);
              translations = cachedTranslations;
              setIsReady(true);
              notifyListeners();
            } else {
              setIsReady(false);
            }
          } catch (e) {
            console.error('[i18n] Cached Dutch translations are invalid');
            setIsReady(false);
          }
        } else {
          console.error('[i18n] No cached Dutch translations available');
          setIsReady(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage: Language) => {
    // Don't do anything if already on this language
    if (language === newLanguage) {
      return;
    }
    
    // Prevent multiple simultaneous language changes
    if (isChangingLanguage) {
      console.warn('[i18n] Language change already in progress, ignoring duplicate request');
      return;
    }
    
    console.log(`[i18n] Changing language from ${language} to ${newLanguage}`);
    
    // Set flag to prevent race conditions
    isChangingLanguage = true;
    
    try {
      // Save current translations as fallback before switching
      if (Object.keys(translations).length > 0) {
        previousTranslations = { ...translations };
      }
      
      // CRITICAL: Save to localStorage FIRST - this is the source of truth
      // This must happen before any navigation or state updates
      safeLocalStorage.setItem('homecheff-language', newLanguage);
      
      // Update cookie immediately to ensure middleware sees the correct value
      safeCookie.set('homecheff-language', newLanguage);
      
      // Save to database if user is logged in
      if (sessionStatus === 'authenticated' && session?.user) {
        try {
          const response = await fetch('/api/user/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: newLanguage })
          });
          if (response.ok) {
            console.log(`[i18n] Saved user language preference to database: ${newLanguage}`);
            setUserLanguagePreference(newLanguage);
          } else {
            console.error('[i18n] Failed to save user language preference:', response.status);
          }
        } catch (error) {
          console.error('[i18n] Error saving user language preference:', error);
          // Continue even if save fails
        }
      }
      
      // Update state immediately for UI feedback
      setLanguage(newLanguage);
      lastDetectedLanguage.current = newLanguage;
      
      // Load new translations
      await loadTranslations(newLanguage);
      
      // Check if we're on localhost or using domain-based routing
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
      const isDomainBased = hostname.includes('homecheff.nl') || hostname.includes('homecheff.eu');
      
      // On localhost or when not using domain-based routing, just reload the page
      // The language will be detected from cookie/localStorage
      if (isLocalhost || !isDomainBased) {
        console.log('[i18n] Using cookie-based routing (localhost or non-domain environment), reloading...');
        // Small delay to ensure cookie is set and persisted before reload
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.reload();
        return;
      }
      
      // On production with domain-based routing, navigate to the correct domain
      // Note: Domain-based routing means we don't use /en/ prefix, languages are set by domain
      // So we should actually just reload and let the cookie handle the language
      // But if we're switching domains, we need to redirect to the other domain
      const currentPath = window.location.pathname;
      const currentDomain = window.location.hostname;
      const isEnglishDomain = currentDomain.includes('homecheff.eu');
      
      if (newLanguage === 'en' && !isEnglishDomain) {
        // Switch to English domain
        const newUrl = `https://homecheff.eu${currentPath}`;
        console.log(`[i18n] Navigating from ${currentDomain}${currentPath} to ${newUrl}`);
        window.location.href = newUrl;
        return;
      } else if (newLanguage === 'nl' && isEnglishDomain) {
        // Switch to Dutch domain
        const newUrl = `https://homecheff.nl${currentPath}`;
        console.log(`[i18n] Navigating from ${currentDomain}${currentPath} to ${newUrl}`);
        window.location.href = newUrl;
        return;
      }
      
      // Already on correct domain, just reload to apply translations
      console.log('[i18n] Already on correct domain, reloading...');
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.reload();
    } catch (error) {
      console.error('[i18n] Error during language change:', error);
      // Reset flag on error
      isChangingLanguage = false;
      // Don't navigate if there was an error
    } finally {
      // Reset flag after a delay to allow navigation to complete
      // Only if navigation didn't happen (reload case)
      setTimeout(() => {
        isChangingLanguage = false;
      }, 2000);
    }
  };

  // Helper function to lookup a key in translations (shared by t() and getTranslationObject)
  const lookupTranslationKey = (key: string, source: Translations): any => {
    const keys = key.split('.');
    let value: any = source;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // If not found and key starts with "seller.", try "common.seller." as fallback
        if (key.startsWith('seller.') && 'common' in source && typeof source.common === 'object' && 'seller' in source.common) {
          const commonSellerKey = 'common.' + key;
          const commonKeys = commonSellerKey.split('.');
          let commonValue: any = source;
          for (const ck of commonKeys) {
            if (commonValue && typeof commonValue === 'object' && ck in commonValue) {
              commonValue = commonValue[ck];
            } else {
              return null;
            }
          }
          return commonValue;
        }
        return null;
      }
    }
    
    return value;
  };

  // Helper function to get translation object (for nested objects like subcategories)
  const getTranslationObject = (key: string): any => {
    // Try current translations first
    if (Object.keys(translations).length > 0) {
      const value = lookupTranslationKey(key, translations);
      if (value !== null) {
        return value;
      }
    }

    // If not found in current translations, try previous translations
    if (Object.keys(previousTranslations).length > 0) {
      const value = lookupTranslationKey(key, previousTranslations);
      if (value !== null) {
        return value;
      }
    }

    return null;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Try current translations first (even during loading, might have cached data)
    let value: any = null;
    if (Object.keys(translations).length > 0) {
      value = lookupTranslationKey(key, translations);
    }

    // If not found in current translations, try previous translations (during language switch)
    if (value === null && Object.keys(previousTranslations).length > 0) {
      value = lookupTranslationKey(key, previousTranslations);
    }

    if (value !== null) {
      // If value is a string, return it (with parameter replacement if needed)
      if (typeof value === 'string') {
        if (params) {
          return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey]?.toString() || match;
          });
        }
        return value;
      }
      // If value is an object, it means we found the path but it's not a string
      // This happens when trying to get an object like inspiratie.subcategories.CHEFF
      // Return empty string to indicate it's not a string value (use getTranslationObject instead)
      return '';
    }

    // If we're still loading and have no translations at all, return empty string
    // This prevents showing translation keys during initial load
    if (isLoading && Object.keys(translations).length === 0 && Object.keys(previousTranslations).length === 0) {
      // Return empty string instead of key to prevent showing "title", "subtitle", etc.
      return '';
    }

    // Only warn if translations are actually loaded (not loading) AND we have translations
    // This prevents spam warnings during initial load
    if (isReady && !isLoading && Object.keys(translations).length > 0) {
      // Only log warning for missing keys that should exist
      const topLevelKeys = Object.keys(translations).slice(0, 10);
      console.warn(`[i18n] Translation key not found: ${key}`);
      console.warn(`[i18n] Available top-level keys:`, topLevelKeys);
      
      // Try to find the parent path using getTranslationObject
      const keyParts = key.split('.');
      if (keyParts.length > 1) {
        const parentKey = keyParts.slice(0, -1).join('.');
        const parentValue = getTranslationObject(parentKey);
        if (parentValue && typeof parentValue === 'object') {
          console.warn(`[i18n] Parent path "${parentKey}" exists, available keys:`, Object.keys(parentValue));
        }
      }
    }
    
    // Return empty string instead of key to prevent showing translation keys in UI
    // This ensures a clean UI even when translations are missing
    return '';
  };

  /**
   * Get a localized path for navigation
   * @param path - The path without locale prefix (e.g., '/inspiratie')
   * @returns The path with locale prefix if needed (e.g., '/en/inspiratie' for English)
   */
  const getLocalizedPath = (path: string): string => {
    return addLocalePrefix(path, language);
  };

  // Get available languages with translated names (memoized to update when translations change)
  // Note: Language names should NOT be translated - they stay as "Nederlands" and "English" regardless of interface language
  const availableLanguages = useMemo(() => {
    return [
      { 
        code: 'nl' as Language, 
        name: 'Nederlands', // Always "Nederlands" regardless of interface language
        flag: '🇳🇱' 
      },
      { 
        code: 'en' as Language, 
        name: 'English', // Always "English" regardless of interface language
        flag: '🇬🇧' 
      }
    ];
  }, []); // No dependencies - language names never change

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    isReady,
    getLocalizedPath,
    getTranslationObject, // Export helper to get objects
    availableLanguages
  };
}

