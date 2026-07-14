"use client";

import { useLayoutEffect, useState } from "react";

const MQ = "(max-width: 1023px)";

export type NarrowViewportState = {
  /** True when viewport is below lg (< 1024px). */
  narrow: boolean;
  /** True once viewport is known (Phase 3F.5: true from first render). */
  resolved: boolean;
};

/**
 * True op viewports onder lg (mobiel + tablet). Aligns with homepage `lg:hidden` shell.
 */
export function useNarrowViewport(): boolean {
  const { narrow } = useNarrowViewportResolved();
  return narrow;
}

/**
 * Homepage responsive shell. Phase 3F.5: `resolved` is true immediately so GeoFeed
 * mounts without a JS viewport gate; useLayoutEffect refines `narrow` before paint.
 */
export function useNarrowViewportResolved(): NarrowViewportState {
  const [state, setState] = useState<NarrowViewportState>({
    narrow: false,
    resolved: true,
  });

  useLayoutEffect(() => {
    const mq = window.matchMedia(MQ);
    const sync = () =>
      setState({ narrow: mq.matches, resolved: true });
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return state;
}
