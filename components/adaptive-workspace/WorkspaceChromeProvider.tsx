'use client';

/**
 * WX Phase 1B.4 — App-chrome AvailableSpace posture.
 * Measures visual viewport geometry only (not UA / device).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  resolveLandscapeWorkPosture,
  type LandscapeWorkPosturePlan,
} from '@/lib/adaptive-workspace-react/resolve-landscape-work-posture';

const DEFAULT_PLAN = resolveLandscapeWorkPosture({
  usableWidthPx: 390,
  usableHeightPx: 844,
});

const WorkspaceChromeContext = createContext<LandscapeWorkPosturePlan>(DEFAULT_PLAN);

function readViewportSpace(): { usableWidthPx: number; usableHeightPx: number } {
  if (typeof window === 'undefined') {
    return { usableWidthPx: 390, usableHeightPx: 844 };
  }
  const vv = window.visualViewport;
  const usableWidthPx = Math.max(
    0,
    Math.floor(vv?.width ?? window.innerWidth ?? 0),
  );
  const usableHeightPx = Math.max(
    0,
    Math.floor(vv?.height ?? window.innerHeight ?? 0),
  );
  return { usableWidthPx, usableHeightPx };
}

export function WorkspaceChromeProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<LandscapeWorkPosturePlan>(DEFAULT_PLAN);

  const measure = useCallback(() => {
    const next = resolveLandscapeWorkPosture(readViewportSpace());
    setPlan((prev) =>
      prev.posture === next.posture &&
      prev.bottomNavCollapsed === next.bottomNavCollapsed &&
      prev.orientationCompact === next.orientationCompact &&
      prev.shortChromeCompact === next.shortChromeCompact &&
      prev.usableWidthPx === next.usableWidthPx &&
      prev.usableHeightPx === next.usableHeightPx
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    measure();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', measure);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      vv?.removeEventListener('resize', measure);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [measure]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.wxPosture = plan.posture;
    root.dataset.wxLandscapeWork = plan.workPostureActive ? '1' : '0';
    root.dataset.wxShortLandscape = plan.shortChromeCompact ? '1' : '0';
    root.dataset.wxBottomNavCollapsed = plan.bottomNavCollapsed ? '1' : '0';
    root.dataset.wxChromeDensity = plan.chromeDensity;
    root.dataset.wxLandscapePhase = plan.phase;
    return () => {
      delete root.dataset.wxPosture;
      delete root.dataset.wxLandscapeWork;
      delete root.dataset.wxShortLandscape;
      delete root.dataset.wxBottomNavCollapsed;
      delete root.dataset.wxChromeDensity;
      delete root.dataset.wxLandscapePhase;
    };
  }, [plan]);

  const value = useMemo(() => plan, [plan]);

  return (
    <WorkspaceChromeContext.Provider value={value}>
      {children}
    </WorkspaceChromeContext.Provider>
  );
}

export function useLandscapeWorkPosture(): LandscapeWorkPosturePlan {
  return useContext(WorkspaceChromeContext);
}
