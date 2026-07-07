'use client';

import { useEffect } from 'react';
import { reportAppDiagnostic } from '@/lib/diagnostics/appDiagnostics';

/**
 * Captures real Core Web Vitals + navigation timings (UX-FIN-4B.1).
 * Reports through the privacy-safe, rate-limited diagnostics channel, which is a
 * no-op in production unless NEXT_PUBLIC_APP_DIAG=1. No PII, no behaviour change.
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const supportedEntryTypes = PerformanceObserver.supportedEntryTypes || [];
    const entryTypes = [
      'largest-contentful-paint',
      'first-input',
      'layout-shift',
    ].filter((type) => supportedEntryTypes.includes(type));

    let clsValue = 0;
    let observer: PerformanceObserver | null = null;

    if (entryTypes.length > 0) {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            reportAppDiagnostic('perf_web_vital', {
              metric: 'LCP',
              ms: Math.round(entry.startTime),
            });
          }
          if (entry.entryType === 'first-input') {
            const fid =
              (entry as PerformanceEventTiming).processingStart - entry.startTime;
            reportAppDiagnostic('perf_web_vital', {
              metric: 'FID',
              ms: Math.round(fid),
            });
          }
          if (entry.entryType === 'layout-shift') {
            const shift = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!shift.hadRecentInput && typeof shift.value === 'number') {
              clsValue += shift.value;
            }
          }
        }
      });

      try {
        observer.observe({ entryTypes });
      } catch (e) {
        console.debug('Performance Observer not supported:', e);
      }
    }

    const onLoad = () => {
      try {
        const nav = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming | undefined;
        const paints = performance.getEntriesByType('paint');
        const fcp =
          paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? 0;
        reportAppDiagnostic('perf_navigation', {
          ttfb: nav ? Math.round(nav.responseStart) : 0,
          domContentLoaded: nav
            ? Math.round(nav.domContentLoadedEventEnd)
            : 0,
          loadTime: nav ? Math.round(nav.loadEventEnd) : 0,
          fcp: Math.round(fcp),
          cls: Math.round(clsValue * 1000) / 1000,
        });
      } catch {
        /* never break the app */
      }
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return null;
}
