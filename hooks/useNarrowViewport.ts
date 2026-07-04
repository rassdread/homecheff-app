"use client";

import { useLayoutEffect, useState } from "react";

const MQ = "(max-width: 1023px)";

export type NarrowViewportState = {
  /** True when viewport is below lg (< 1024px). */
  narrow: boolean;
  /** False until client matchMedia has run (useLayoutEffect). */
  resolved: boolean;
};

/**
 * True op viewports onder lg (mobiel + tablet). Aligns with homepage `lg:hidden` shell.
 */
export function useNarrowViewport(): boolean {
  const { narrow, resolved } = useNarrowViewportResolved();
  return resolved ? narrow : false;
}

/**
 * Homepage responsive shell: `resolved` gates a single GeoFeed mount after viewport is known.
 */
export function useNarrowViewportResolved(): NarrowViewportState {
  const [state, setState] = useState<NarrowViewportState>({
    narrow: false,
    resolved: false,
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
