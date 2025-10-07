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
    watch = false
  } = options;

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

    console.log('🔍 Requesting location with options:', {
      enableHighAccuracy,
      timeout,
      maximumAge
    });

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
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            errorCode = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            errorCode = 'POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            errorCode = 'TIMEOUT';
            break;
          default:
            errorMessage = error.message || 'Unknown error';
            errorCode = 'UNKNOWN';
        }
        
        console.log('❌ Geolocation error details:', {
          code: error.code,
          errorCode,
          message: error.message,
          errorMessage,
          timestamp: new Date().toLocaleString(),
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol
        });
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

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
