'use client';

/**
 * WX Phase 1C — Presentation bridge between GeoFeed (primary) and rails.
 *
 * GeoFeed remains sole owner of filter state / surface plan computation.
 * Filters reach the start rail via portal host (no second owner, no remount).
 * Surface plan is published as read-only presentation data for the end rail.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';

type WorkspaceFeedPresentationBridgeValue = {
  /** Start rail has AvailableSpace capacity — filters belong in the rail. */
  startRailActive: boolean;
  setStartRailActive: (active: boolean) => void;
  /** DOM host inside the start rail for GeoFeed filter portal. */
  filterHost: HTMLElement | null;
  setFilterHost: (el: HTMLElement | null) => void;
  surfacePlan: ResolvedSurfacePlan | null;
  setSurfacePlan: (plan: ResolvedSurfacePlan | null) => void;
};

const WorkspaceFeedPresentationBridgeContext =
  createContext<WorkspaceFeedPresentationBridgeValue | null>(null);

export function WorkspaceFeedPresentationBridge({
  children,
}: {
  children: ReactNode;
}) {
  const [startRailActive, setStartRailActive] = useState(false);
  const [filterHost, setFilterHostState] = useState<HTMLElement | null>(null);
  const [surfacePlan, setSurfacePlanState] =
    useState<ResolvedSurfacePlan | null>(null);

  const setFilterHost = useCallback((el: HTMLElement | null) => {
    setFilterHostState((prev) => (prev === el ? prev : el));
  }, []);

  const setSurfacePlan = useCallback((plan: ResolvedSurfacePlan | null) => {
    setSurfacePlanState((prev) => (prev === plan ? prev : plan));
  }, []);

  const value = useMemo(
    () => ({
      startRailActive,
      setStartRailActive,
      filterHost,
      setFilterHost,
      surfacePlan,
      setSurfacePlan,
    }),
    [
      startRailActive,
      filterHost,
      setFilterHost,
      surfacePlan,
      setSurfacePlan,
    ],
  );

  return (
    <WorkspaceFeedPresentationBridgeContext.Provider value={value}>
      {children}
    </WorkspaceFeedPresentationBridgeContext.Provider>
  );
}

export function useWorkspaceFeedPresentationBridge(): WorkspaceFeedPresentationBridgeValue | null {
  return useContext(WorkspaceFeedPresentationBridgeContext);
}
