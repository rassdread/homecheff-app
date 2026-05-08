"use client";

import { useEffect, useState } from "react";

const MQ = "(max-width: 767px)";

/**
 * True op smalle viewports (mobiel). Start false (SSR) → na mount sync voor geen layout flash.
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
