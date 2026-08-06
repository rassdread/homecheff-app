import { useState, useEffect, useCallback, useRef } from 'react';
import {
  gpsCompactMessage,
  mapGeolocationPositionErrorCode,
  type GpsFailureCode,
} from '@/lib/geo/gps-location-errors';

interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  errorCode: GpsFailureCode | null;
  supported: boolean;
  permission: PermissionState | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  /** Continuous watch — off by default; feed must not background-track. */
  watch?: boolean;
  /** Called with a stable failure code after a user-initiated getCurrentPosition fails. */
  onFallback?: (reason: GpsFailureCode) => void;
}

/**
 * Browser geolocation for explicit user actions (e.g. “Gebruik mijn locatie”).
 * Does not request permission on mount — only checks support / permission state.
 */
export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    errorCode: null,
    supported: false,
    permission: null,
  });

  const {
    enableHighAccuracy = false,
    timeout = 12000,
    maximumAge = 300000,
    watch = false,
    onFallback,
  } = options;

  const onFallbackRef = useRef(onFallback);
  onFallbackRef.current = onFallback;
  const requestIdRef = useRef(0);

  const checkSupportAndPermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({ ...prev, supported: false }));
      return;
    }

    setState((prev) => ({ ...prev, supported: true }));

    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });
        setState((prev) => ({ ...prev, permission: permission.state }));
        permission.onchange = () => {
          setState((prev) => ({ ...prev, permission: permission.state }));
        };
      } catch {
        /* Permissions API optional */
      }
    }
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const code: GpsFailureCode = 'UNSUPPORTED';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: gpsCompactMessage(code, 'nl'),
        errorCode: code,
        supported: false,
      }));
      onFallbackRef.current?.(code);
      return;
    }

    const requestId = ++requestIdRef.current;
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      errorCode: null,
      supported: true,
    }));

    // Respect caller options — do not override with UA sniffing.
    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== requestIdRef.current) return;
        setState((prev) => ({
          ...prev,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
          errorCode: null,
        }));
      },
      (error) => {
        if (requestId !== requestIdRef.current) return;
        const code = mapGeolocationPositionErrorCode(error.code);
        const message = gpsCompactMessage(code, 'nl');
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
          errorCode: code,
        }));
        onFallbackRef.current?.(code);
      },
      geoOptions,
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    if (!watch || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
          errorCode: null,
        }));
      },
      (error) => {
        const code = mapGeolocationPositionErrorCode(error.code);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: gpsCompactMessage(code, 'nl'),
          errorCode: code,
        }));
      },
      { enableHighAccuracy, timeout, maximumAge },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    void checkSupportAndPermission();
  }, [checkSupportAndPermission]);

  return {
    ...state,
    getCurrentPosition,
    checkSupportAndPermission,
  };
}
