import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
  permission: PermissionState | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  fallbackToManual?: boolean; // New option to enable fallback
  onFallback?: (reason: string) => void; // Callback when falling back to manual
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    supported: false,
    permission: null
  });

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 300000,
    watch = false,
    fallbackToManual = true,
    onFallback
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Check if geolocation is supported and get permission status
  const checkSupportAndPermission = useCallback(async () => {

    if (!navigator.geolocation) {

      setState(prev => ({ ...prev, supported: false }));
      return;
    }

    setState(prev => ({ ...prev, supported: true }));

    // Check permission status if available
    if (navigator.permissions) {
      try {

        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

        setState(prev => ({ ...prev, permission: permission.state }));
        
        // Listen for permission changes
        permission.onchange = () => {

          setState(prev => ({ ...prev, permission: permission.state }));
        };
      } catch (err) {

      }
    } else {

    }
    
    // Also check if we're in a secure context

  }, []);

  const getCurrentPosition = useCallback(() => {

    if (!navigator.geolocation) {

      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      if (fallbackToManual && onFallback) {
        onFallback('GPS niet ondersteund');
      }
      return;
    }

    // Don't retry if we already attempted and failed
    if (hasAttempted) {

      return;
    }

    // Reset retry count for new request
    setRetryCount(0);
    setHasAttempted(true);

    // Detect browser (desktop and mobile)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && /google inc/.test(navigator.vendor?.toLowerCase() || '');
    const isEdge = /edg/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isSamsungInternet = /samsungbrowser/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    // Browser-specific options
    let options = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    // Samsung Internet specific adjustments
    if (isSamsungInternet) {

      options = {
        enableHighAccuracy: false, // Samsung Internet often fails with high accuracy
        timeout: 30000, // Very long timeout for Samsung Internet
        maximumAge: 0 // No cache for Samsung Internet
      };
    }
    // Chrome/Edge specific adjustments
    else if (isChrome || isEdge) {

      options = {
        enableHighAccuracy: false, // Always false for Chrome/Edge - they often fail with high accuracy
        timeout: isMobile ? 30000 : 25000, // Very long timeout for Chrome/Edge
        maximumAge: 0 // No cache for Chrome/Edge - always get fresh location
      };
    }
    // Firefox specific adjustments  
    else if (isFirefox) {

      options = {
        enableHighAccuracy: true, // Firefox works BETTER with high accuracy!
        timeout: isMobile ? 30000 : 30000, // Extra long timeout for Firefox to prevent annoying errors
        maximumAge: 0 // No cache for Firefox
      };
    }
    // iOS Safari specific adjustments
    else if (isIOS && isSafari) {

      options = {
        enableHighAccuracy: false, // iOS Safari often fails with high accuracy
        timeout: 25000,
        maximumAge: 0 // No cache for iOS Safari
      };
    }
    // Android Chrome specific adjustments
    else if (isAndroid && isChrome) {

      options = {
        enableHighAccuracy: false, // Android Chrome often fails with high accuracy
        timeout: 30000, // Very long timeout for Android
        maximumAge: 0 // No cache for Android Chrome
      };
    }
    // Default mobile adjustments
    else if (isMobile) {

      options = {
        enableHighAccuracy: false, // Most mobile browsers work better with low accuracy
        timeout: 25000, // Longer timeout for mobile
        maximumAge: 0 // No cache for mobile
      };
    }
    // Default desktop adjustments
    else {

      options = {
        enableHighAccuracy: false, // Even desktop browsers work better with low accuracy
        timeout: 20000,
        maximumAge: 0 // No cache
      };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setState(prev => ({
          ...prev,
          coords,
          loading: false,
          error: null
        }));
      },
      (error) => {
        let errorMessage = 'Unknown error';
        let errorCode = 'UNKNOWN';
        
        // Browser-specific error messages
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isChrome = /chrome/.test(userAgent) && /google inc/.test(navigator.vendor?.toLowerCase() || '');
        const isEdge = /edg/.test(userAgent);
        const isFirefox = /firefox/.test(userAgent);
        const isSamsungInternet = /samsungbrowser/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorCode = 'PERMISSION_DENIED';
            if (isSamsungInternet) {
              errorMessage = 'Samsung Internet: Locatie toegang geweigerd. Ga naar Instellingen > Apps > Samsung Internet > Machtigingen > Locatie';
            } else if (isAndroid && isChrome) {
              errorMessage = 'Android Chrome: Locatie toegang geweigerd. Klik op het slotje in de adresbalk en zet locatie op "Toestaan"';
            } else if (isIOS && isChrome) {
              errorMessage = 'iOS Chrome: Locatie toegang geweigerd. Ga naar Instellingen > Chrome > Locatie';
            } else if (isChrome || isEdge) {
              errorMessage = 'Chrome/Edge: Locatie toegang geweigerd. Klik op het slotje in de adresbalk en zet locatie op "Toestaan"';
            } else if (isFirefox) {
              errorMessage = 'Firefox: Locatie toegang geweigerd. Ga naar Firefox instellingen > Privacy & Beveiliging > Locatie';
            } else if (isMobile) {
              errorMessage = 'Mobiele browser: Locatie toegang geweigerd. Controleer browser instellingen voor locatie permissies';
            } else {
              errorMessage = 'Locatie toegang geweigerd door gebruiker';
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorCode = 'POSITION_UNAVAILABLE';
            if (isSamsungInternet) {
              errorMessage = 'Samsung Internet: GPS niet beschikbaar. Controleer of locatieservices aan staan op je Samsung apparaat';
            } else if (isAndroid && isChrome) {
              errorMessage = 'Android Chrome: GPS niet beschikbaar. Controleer of locatieservices aan staan in Android instellingen';
            } else if (isIOS && isChrome) {
              errorMessage = 'iOS Chrome: GPS niet beschikbaar. Controleer of locatieservices aan staan in iOS instellingen';
            } else if (isChrome || isEdge) {
              errorMessage = 'Chrome/Edge: GPS niet beschikbaar. Controleer of locatieservices aan staan op je apparaat';
            } else if (isFirefox) {
              errorMessage = 'Firefox: Locatie informatie niet beschikbaar';
            } else if (isMobile) {
              errorMessage = 'Mobiele browser: GPS niet beschikbaar. Controleer of locatieservices aan staan op je apparaat';
            } else {
              errorMessage = 'Locatie informatie niet beschikbaar';
            }
            break;
          case error.TIMEOUT:
            errorCode = 'TIMEOUT';
            if (isSamsungInternet) {
              errorMessage = 'Samsung Internet: Locatie aanvraag verlopen. Probeer opnieuw of controleer internetverbinding';
            } else if (isAndroid && isChrome) {
              errorMessage = 'Android Chrome: Locatie aanvraag verlopen. Probeer opnieuw of controleer internetverbinding';
            } else if (isIOS && isChrome) {
              errorMessage = 'iOS Chrome: Locatie aanvraag verlopen. Probeer opnieuw of controleer internetverbinding';
            } else if (isChrome || isEdge) {
              errorMessage = 'Chrome/Edge: Locatie aanvraag verlopen. Probeer opnieuw of controleer internetverbinding';
            } else if (isFirefox) {
              errorMessage = 'Firefox: Locatie aanvraag verlopen';
            } else if (isMobile) {
              errorMessage = 'Mobiele browser: Locatie aanvraag verlopen. Probeer opnieuw';
            } else {
              errorMessage = 'Locatie aanvraag verlopen';
            }
            break;
          default:
            errorMessage = error.message || 'Onbekende fout';
            errorCode = 'UNKNOWN';
        }

        // Don't show error in state - just silently fail and use fallback
        setState(prev => ({
          ...prev,
          loading: false,
          error: null // Don't store error to avoid showing it to user
        }));

        // Always trigger fallback silently - no more annoying error messages!
        if (fallbackToManual && onFallback) {

          onFallback(errorCode); // Just send error code, not full message
        }

        // NO RETRIES - they just cause more delays and errors
        // Let the fallback handle it immediately
      },
      options
    );
  }, [enableHighAccuracy, timeout, maximumAge, retryCount]);

  // Watch position if requested
  useEffect(() => {
    if (!watch || !navigator.geolocation) return;

    setState(prev => ({ ...prev, loading: true }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setState(prev => ({
          ...prev,
          coords,
          loading: false,
          error: null
        }));
      },
      (error) => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge]);

  // Check support and permission on mount
  useEffect(() => {
    checkSupportAndPermission();
  }, [checkSupportAndPermission]);

  return {
    ...state,
    getCurrentPosition,
    checkSupportAndPermission
  };
}
