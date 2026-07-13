'use client';

import dynamic from 'next/dynamic';

const BaselineInstrumentation = dynamic(
  () => import('@/components/performance/BaselineInstrumentation'),
  { ssr: false },
);

const FeedPerfDebugPanel = dynamic(
  () => import('@/components/performance/FeedPerfDebugPanel'),
  { ssr: false },
);

/** Mounted only when NEXT_PUBLIC_FEED_PERF_BASELINE=1 at build time (via Providers). */
export default function FeedPerfBaselineShell() {
  return (
    <>
      <BaselineInstrumentation />
      <FeedPerfDebugPanel />
    </>
  );
}
