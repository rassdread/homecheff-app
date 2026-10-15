'use client';

import { useEffect, useState } from 'react';
import {
  feedPerfCounters,
  feedPerfMeasures,
  feedPerfReport,
  feedPerfWebVitals,
  isFeedPerfBaselineEnabled,
} from '@/lib/feed/feed-performance-baseline';
import { getDuplicateRequestReport } from '@/lib/performance/duplicate-request-detector';

/**
 * Developer panel. The env flag may be on, but normal visitors stay hidden
 * until they open the page with ?hcFeedPerf=1. ?hcFeedPerf=0 turns it off.
 */
function isFeedPerfDebugOptIn(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV === 'development') return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('hcFeedPerf') === '0') {
      window.localStorage.removeItem('hc-feed-perf');
      return false;
    }
    if (params.get('hcFeedPerf') === '1') {
      window.localStorage.setItem('hc-feed-perf', '1');
      return true;
    }
    return window.localStorage.getItem('hc-feed-perf') === '1';
  } catch {
    return false;
  }
}

export default function FeedPerfDebugPanel() {
  const [open, setOpen] = useState(true);
  const [snapshot, setSnapshot] = useState<Record<string, unknown>>({});
  const enabled = isFeedPerfBaselineEnabled() && isFeedPerfDebugOptIn();

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const dup = getDuplicateRequestReport();
      setSnapshot({
        milestones: feedPerfReport(),
        webVitals: feedPerfWebVitals(),
        counters: feedPerfCounters(),
        measures: feedPerfMeasures().map((m) => ({
          name: m.name.replace('hc-feed-perf:', ''),
          ms: Math.round(m.duration),
        })),
        duplicateRequests: dup.duplicates,
      });
    };
    tick();
    const id = window.setInterval(tick, 1500);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled || !open) {
    if (!enabled) return null;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 8,
          right: 8,
          zIndex: 99999,
          fontSize: 11,
          padding: '4px 8px',
          background: '#111',
          color: '#0f0',
          border: '1px solid #333',
          borderRadius: 4,
        }}
      >
        HC Perf
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        zIndex: 99999,
        maxWidth: 360,
        maxHeight: '40vh',
        overflow: 'auto',
        fontSize: 10,
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.88)',
        color: '#cfc',
        border: '1px solid #333',
        borderRadius: 6,
        padding: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <strong>HC Feed Baseline</strong>
        <button type="button" onClick={() => setOpen(false)} style={{ color: '#ccc' }}>
          ×
        </button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </div>
  );
}
