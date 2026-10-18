'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type ComponentType } from 'react';
import { HomeFeedViewportShell } from '@/components/navigation/RouteLoadingSkeletons';

/**
 * Phase 3F Wave 2 — GeoFeed code-split off the homepage critical JS path.
 * Single mount instance preserved in HomePageClient (geoFeedMounts = 1).
 */
const GeoFeed = dynamic(() => import('@/components/feed/GeoFeed'), {
  loading: () => <HomeFeedViewportShell />,
  ssr: false,
});

/**
 * The desktop feed column must use the same GeoFeed module as the provider.
 * A second next/dynamic() of that module stays on an unresolved React.lazy
 * promise after the chunk has already evaluated, so the column never paints.
 */
export function FeedContent() {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    let live = true;
    import('@/components/feed/GeoFeed').then((mod) => {
      if (live) setComp(() => mod.FeedContent);
    });
    return () => {
      live = false;
    };
  }, []);
  return Comp ? <Comp /> : null;
}

export default GeoFeed;
