'use client';

import { useEffect, useRef, useState } from 'react';

/** Expand full mobile filter toolbar when scroll is near page top. */
export const MOBILE_FEED_FILTER_TOP_EXPAND_PX = 24;
/** Collapse after user scrolls down past this offset. */
export const MOBILE_FEED_FILTER_COLLAPSE_AFTER_PX = 64;

/**
 * Mobile homepage feed: collapse filter chrome on downward scroll;
 * expand again when scrollY returns near top. Passive window listener only.
 */
export function useMobileFeedFilterScroll(enabled: boolean) {
  const [collapsed, setCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setCollapsed(false);
      return;
    }

    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y <= MOBILE_FEED_FILTER_TOP_EXPAND_PX) {
          setCollapsed(false);
        } else if (
          y > MOBILE_FEED_FILTER_COLLAPSE_AFTER_PX &&
          y > lastScrollY.current + 4
        ) {
          setCollapsed(true);
        }
        lastScrollY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);

  return { collapsed };
}
