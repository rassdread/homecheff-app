'use client';

import { useCallback } from 'react';
import { AnalyticsEventType, AnalyticsEntityType } from '@/lib/analytics';

export function useAnalytics() {
  const track = useCallback(async (
    eventType: AnalyticsEventType,
    entityType: AnalyticsEntityType,
    entityId: string,
    metadata?: Record<string, any>
  ) => {
    try {
      // Generate session ID if not exists
      let sessionId = sessionStorage.getItem('analytics-session-id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics-session-id', sessionId);
      }

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          eventType,
          entityType,
          entityId,
          metadata
        })
      });
    } catch (error) {
      console.error('❌ Client analytics tracking failed:', error);
      // Fail silently
    }
  }, []);

  const trackView = useCallback((entityType: AnalyticsEntityType, entityId: string, metadata?: Record<string, any>) => {
    return track('VIEW', entityType, entityId, metadata);
  }, [track]);

  const trackClick = useCallback((entityType: AnalyticsEntityType, entityId: string, metadata?: Record<string, any>) => {
    return track('CLICK', entityType, entityId, metadata);
  }, [track]);

  const trackLike = useCallback((entityType: AnalyticsEntityType, entityId: string, metadata?: Record<string, any>) => {
    return track('LIKE', entityType, entityId, metadata);
  }, [track]);

  const trackFavorite = useCallback((entityType: AnalyticsEntityType, entityId: string, metadata?: Record<string, any>) => {
    return track('FAVORITE', entityType, entityId, metadata);
  }, [track]);

  const trackShare = useCallback((entityType: AnalyticsEntityType, entityId: string, metadata?: Record<string, any>) => {
    return track('SHARE', entityType, entityId, metadata);
  }, [track]);

  return {
    track,
    trackView,
    trackClick,
    trackLike,
    trackFavorite,
    trackShare
  };
}



