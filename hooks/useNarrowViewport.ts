"use client";

import { useEffect, useState } from "react";

const MQ = "(max-width: 1023px)";

/**
 * True op viewports onder lg (mobiel + tablet). Aligns with homepage `lg:hidden` shell.
 */
export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MQ);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return narrow;
}
