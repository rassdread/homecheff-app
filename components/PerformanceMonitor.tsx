'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Check which entry types are supported
      const supportedEntryTypes = PerformanceObserver.supportedEntryTypes || [];
      const entryTypes = ['largest-contentful-paint', 'first-input', 'layout-shift'].filter(
        type => supportedEntryTypes.includes(type)
      );

      if (entryTypes.length === 0) {
        return; // No supported entry types
      }

      // Monitor Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            // Track LCP
          }
          if (entry.entryType === 'first-input') {
            // Track FID
          }
          if (entry.entryType === 'layout-shift') {
            if (!(entry as any).hadRecentInput) {
              // Track CLS (only non-user-initiated shifts)
            }
          }
        }
      });

      try {
        observer.observe({ entryTypes });
      } catch (e) {
        // Performance Observer not supported or failed to initialize
        console.debug('Performance Observer not supported:', e);
      }

      // Monitor page load time
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        // Log performance metrics for debugging
        const metrics = {
          loadTime,
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        };
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
