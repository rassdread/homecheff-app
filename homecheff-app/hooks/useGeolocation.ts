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
        console.log('Could not check geolocation permission:', err);
      }
    }
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        console.log('✅ Location obtained:', coords);
        setState(prev => ({
          ...prev,
          coords,
          loading: false,
          error: null
        }));
      },
      (error) => {
        let errorMessage = 'Unknown error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = error.message || 'Unknown error';
        }
        
        console.log('❌ Geolocation error:', {
          code: error.code,
          message: errorMessage,
          timestamp: new Date().toLocaleString()
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
