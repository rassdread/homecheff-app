'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsEntityType } from '@/lib/analytics';

interface EngagementTrackerProps {
  entityType: AnalyticsEntityType;
  entityId: string;
  children: React.ReactNode;
  trackViewOnMount?: boolean;
  trackViewOnScroll?: boolean;
  metadata?: Record<string, any>;
}

export default function EngagementTracker({
  entityType,
  entityId,
  children,
  trackViewOnMount = false,
  trackViewOnScroll = true,
  metadata = {}
}: EngagementTrackerProps) {
  const { trackView } = useAnalytics();
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Track view on mount
  useEffect(() => {
    if (trackViewOnMount && !hasTrackedView) {
      trackView(entityType, entityId, metadata);
      setHasTrackedView(true);
    }
  }, [trackViewOnMount, hasTrackedView, trackView, entityType, entityId, metadata]);

  // Track view on scroll (intersection observer)
  useEffect(() => {
    if (!trackViewOnScroll || hasTrackedView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          trackView(entityType, entityId, {
            ...metadata,
            viewType: 'scroll',
            intersectionRatio: entry.intersectionRatio,
            viewportHeight: window.innerHeight,
            elementHeight: entry.boundingClientRect.height
          });
          setHasTrackedView(true);
          observer.disconnect();
        }
      },
      {
        threshold: [0.5], // Track when 50% visible
        rootMargin: '0px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [trackViewOnScroll, hasTrackedView, trackView, entityType, entityId, metadata]);

  return (
    <div ref={elementRef} className="w-full">
      {children}
    </div>
  );
}



