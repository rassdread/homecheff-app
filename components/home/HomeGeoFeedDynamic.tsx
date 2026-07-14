'use client';

import dynamic from 'next/dynamic';
import { HomeFeedViewportShell } from '@/components/navigation/RouteLoadingSkeletons';

/**
 * Phase 3F Wave 2 — GeoFeed code-split off the homepage critical JS path.
 * Single mount instance preserved in HomePageClient (geoFeedMounts = 1).
 */
const GeoFeed = dynamic(() => import('@/components/feed/GeoFeed'), {
  loading: () => <HomeFeedViewportShell />,
  ssr: false,
});

export const FeedContent = dynamic(
  () => import('@/components/feed/GeoFeed').then((m) => ({ default: m.FeedContent })),
  { ssr: false },
);

export default GeoFeed;
