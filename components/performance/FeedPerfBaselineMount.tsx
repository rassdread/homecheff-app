'use client';

import dynamic from 'next/dynamic';

const FeedPerfBaselineShell = dynamic(
  () => import('@/components/performance/FeedPerfBaselineShell'),
  { ssr: false },
);

/** Active mount — only bundled when NEXT_PUBLIC_FEED_PERF_BASELINE=1 at build time. */
export default function FeedPerfBaselineMount() {
  return <FeedPerfBaselineShell />;
}
