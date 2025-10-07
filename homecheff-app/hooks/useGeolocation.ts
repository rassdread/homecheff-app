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

  // Check if geolocation is supported and get permission status
  const checkSupportAndPermission = useCallback(async () => {
    console.log('🔍 Checking geolocation support and permissions...');
    
    if (!navigator.geolocation) {
      console.log('❌ navigator.geolocation not supported');
      setState(prev => ({ ...prev, supported: false }));
      return;
    }

    console.log('✅ navigator.geolocation is supported');
    setState(prev => ({ ...prev, supported: true }));

    // Check permission status if available
    if (navigator.permissions) {
      try {
        console.log('🔍 Checking geolocation permission...');
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        console.log('📍 Permission status:', permission.state);
        setState(prev => ({ ...prev, permission: permission.state }));
        
        // Listen for permission changes
        permission.onchange = () => {
          console.log('📍 Permission changed to:', permission.state);
          setState(prev => ({ ...prev, permission: permission.state }));
        };
      } catch (err) {
        console.log('⚠️ Could not check geolocation permission:', err);
      }
    } else {
      console.log('⚠️ navigator.permissions not available');
    }
    
    // Also check if we're in a secure context
    console.log('🔒 Security context:', {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    });
  }, []);

  const getCurrentPosition = useCallback(() => {
    console.log('🌍 getCurrentPosition called');
    
    if (!navigator.geolocation) {
      console.log('❌ navigator.geolocation not available');
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    // Reset retry count for new request
    setRetryCount(0);

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
    
    console.log('🔍 Browser detection:', {
      isChrome,
      isEdge, 
      isFirefox,
      isSafari,
      isSamsungInternet,
      isAndroid,
      isIOS,
      isMobile,
      userAgent: navigator.userAgent
    });

    // Browser-specific options
    let options = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    // Samsung Internet specific adjustments
    if (isSamsungInternet) {
      console.log('🔧 Applying Samsung Internet specific settings');
      options = {
        enableHighAccuracy: false, // Samsung Internet often fails with high accuracy
        timeout: 30000, // Very long timeout for Samsung Internet
        maximumAge: 0 // No cache for Samsung Internet
      };
    }
    // Chrome/Edge specific adjustments
    else if (isChrome || isEdge) {
      console.log('🔧 Applying Chrome/Edge specific settings');
      options = {
        enableHighAccuracy: false, // Always false for Chrome/Edge - they often fail with high accuracy
        timeout: isMobile ? 30000 : 25000, // Very long timeout for Chrome/Edge
        maximumAge: 0 // No cache for Chrome/Edge - always get fresh location
      };
    }
    // Firefox specific adjustments  
    else if (isFirefox) {
      console.log('🔧 Applying Firefox specific settings');
      options = {
        enableHighAccuracy: false, // Firefox also works better with low accuracy
        timeout: isMobile ? 20000 : 15000, // Longer timeout for Firefox
        maximumAge: 0 // No cache for Firefox
      };
    }
    // iOS Safari specific adjustments
    else if (isIOS && isSafari) {
      console.log('🔧 Applying iOS Safari specific settings');
      options = {
        enableHighAccuracy: false, // iOS Safari often fails with high accuracy
        timeout: 25000,
        maximumAge: 0 // No cache for iOS Safari
      };
    }
    // Android Chrome specific adjustments
    else if (isAndroid && isChrome) {
      console.log('🔧 Applying Android Chrome specific settings');
      options = {
        enableHighAccuracy: false, // Android Chrome often fails with high accuracy
        timeout: 30000, // Very long timeout for Android
        maximumAge: 0 // No cache for Android Chrome
      };
    }
    // Default mobile adjustments
    else if (isMobile) {
      console.log('🔧 Applying default mobile settings');
      options = {
        enableHighAccuracy: false, // Most mobile browsers work better with low accuracy
        timeout: 25000, // Longer timeout for mobile
        maximumAge: 0 // No cache for mobile
      };
    }
    // Default desktop adjustments
    else {
      console.log('🔧 Applying default desktop settings');
      options = {
        enableHighAccuracy: false, // Even desktop browsers work better with low accuracy
        timeout: 20000,
        maximumAge: 0 // No cache
      };
    }

    console.log('🔍 Requesting location with browser-specific options:', options);

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        console.log('✅ Location obtained successfully:', {
          coords,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          timestampReadable: new Date(position.timestamp).toLocaleString()
        });
        
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
        
        console.log('❌ Geolocation error details:', {
          code: error.code,
          errorCode,
          message: error.message,
          errorMessage,
          browser: { isChrome, isEdge, isFirefox },
          timestamp: new Date().toLocaleString(),
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        });
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));

        // Fallback to manual location input for certain errors
        if (fallbackToManual && onFallback) {
          if (error.code === error.PERMISSION_DENIED || 
              error.code === error.POSITION_UNAVAILABLE ||
              (error.code === error.TIMEOUT && retryCount >= 1)) {
            console.log('🔄 Falling back to manual location input');
            onFallback(errorMessage);
          }
        }

        // Retry logic for certain errors
        if ((error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) && retryCount < 3) {
          console.log(`🔄 Retrying geolocation request (attempt ${retryCount + 1})`);
          setRetryCount(prev => prev + 1);
          
          // Retry with different settings - progressively more aggressive
          setTimeout(() => {
            const retryOptions = {
              enableHighAccuracy: false, // Always low accuracy for retries
              timeout: 40000, // Even longer timeout for retries
              maximumAge: 0 // No cache
            };
            
            console.log('🔄 Retry options:', retryOptions);
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coords = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                console.log('✅ Retry successful:', coords);
                setState(prev => ({
                  ...prev,
                  coords,
                  loading: false,
                  error: null
                }));
              },
              (retryError) => {
                console.log('❌ Retry also failed:', retryError);
                
                // Try one more time with even more aggressive settings
                if (retryCount < 2) {
                  console.log('🔄 Final retry attempt...');
                  setTimeout(() => {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const coords = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        };
                        console.log('✅ Final retry successful:', coords);
                        setState(prev => ({
                          ...prev,
                          coords,
                          loading: false,
                          error: null
                        }));
                      },
                      (finalError) => {
                        console.log('❌ Final retry failed:', finalError);
                        setState(prev => ({
                          ...prev,
                          loading: false,
                          error: `All retries failed: ${finalError.message}`
                        }));
                      },
                      {
                        enableHighAccuracy: false,
                        timeout: 60000, // 1 minute timeout for final attempt
                        maximumAge: 0
                      }
                    );
                  }, 2000);
                } else {
                  setState(prev => ({
                    ...prev,
                    loading: false,
                    error: `Retry failed: ${retryError.message}`
                  }));
                }
              },
              retryOptions
            );
          }, 2000);
        }
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
