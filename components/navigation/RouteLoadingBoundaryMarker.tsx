'use client';

import { useEffect } from 'react';
import { markRouteLoadingBoundaryShown } from '@/lib/instant-experience/route-loading-handoff';

/** Mount inside route loading.tsx to signal the client page can skip duplicate skeletons. */
export default function RouteLoadingBoundaryMarker() {
  useEffect(() => {
    markRouteLoadingBoundaryShown();
  }, []);
  return null;
}
