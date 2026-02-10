'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trackEvent } from '@/components/GoogleAnalytics';

interface TileTrackingOptions {
  tileId: string;
  tileName: string;
  dashboard: string;
  metric?: string;
  value?: number | string;
  unit?: string;
  metadata?: Record<string, any>;
  trackView?: boolean;
  trackClick?: boolean;
}

/**
 * Hook for tracking dashboard tile views and clicks
 * Automatically tracks view when tile becomes visible
 * Provides click tracking handler
 */
export function useTileTracking({
  tileId,
  tileName,
  dashboard,
  metric,
  value,
  unit,
  metadata = {},
  trackView = true,
  trackClick = true,
}: TileTrackingOptions) {
  const hasTrackedView = useRef(false);
  const tileRef = useRef<HTMLElement | null>(null);

  // Track view when tile becomes visible (using IntersectionObserver)
  useEffect(() => {
    if (!trackView || hasTrackedView.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            // Tile is visible, track view
            trackEvent('tile_view', {
              tile_id: tileId,
              tile_name: tileName,
              dashboard,
              metric: metric || null,
              value: value !== undefined ? value : null,
              unit: unit || null,
              ...metadata,
              timestamp: new Date().toISOString(),
            });

            hasTrackedView.current = true;
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.5, // Track when 50% of tile is visible
        rootMargin: '0px',
      }
    );

    if (tileRef.current) {
      observer.observe(tileRef.current);
    }

    // Fallback: track after 1 second if still not tracked
    const fallbackTimer = setTimeout(() => {
      if (!hasTrackedView.current && trackView) {
        trackEvent('tile_view', {
          tile_id: tileId,
          tile_name: tileName,
          dashboard,
          metric: metric || null,
          value: value !== undefined ? value : null,
          unit: unit || null,
          ...metadata,
          timestamp: new Date().toISOString(),
        });
        hasTrackedView.current = true;
        observer.disconnect();
      }
    }, 1000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [tileId, tileName, dashboard, metric, value, unit, trackView, metadata]);

  // Click tracking handler
  const handleClick = useCallback(
    (action?: string, additionalData?: Record<string, any>) => {
      if (!trackClick) return;

      trackEvent('tile_click', {
        tile_id: tileId,
        tile_name: tileName,
        dashboard,
        action: action || 'click',
        metric: metric || null,
        value: value !== undefined ? value : null,
        unit: unit || null,
        ...metadata,
        ...additionalData,
        timestamp: new Date().toISOString(),
      });
    },
    [tileId, tileName, dashboard, metric, value, unit, trackClick, metadata]
  );

  return {
    tileRef,
    handleClick,
  };
}

/**
 * Simplified hook for tracking dashboard views
 */
export function useDashboardTracking(dashboardName: string, metadata?: Record<string, any>) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;

    trackEvent('dashboard_view', {
      dashboard: dashboardName,
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    hasTracked.current = true;
  }, [dashboardName, metadata]);
}




