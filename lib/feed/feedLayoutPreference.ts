"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Large vertical feed cards (default). */
export type FeedLayoutMode = "cards" | "discover";

const STORAGE_KEY = "homecheff.feedLayoutMode";
const CHANGE_EVENT = "hc-feed-layout-mode";

export function readFeedLayoutMode(): FeedLayoutMode {
  if (typeof window === "undefined") return "cards";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "discover" ? "discover" : "cards";
  } catch {
    return "cards";
  }
}

export function writeFeedLayoutMode(mode: FeedLayoutMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* quota / private mode */
  }
}

export function subscribeFeedLayoutMode(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useFeedLayoutMode(): [FeedLayoutMode, (mode: FeedLayoutMode) => void] {
  const mode = useSyncExternalStore(
    subscribeFeedLayoutMode,
    readFeedLayoutMode,
    () => "cards" as FeedLayoutMode
  );
  const setMode = useCallback((next: FeedLayoutMode) => {
    writeFeedLayoutMode(next);
  }, []);
  return [mode, setMode];
}

/** Layout toggle (cards vs discover grid) applies only on mobile / native shell. */
export function getEffectiveFeedLayoutMode(
  mode: FeedLayoutMode,
  isMobileFeedUi: boolean
): FeedLayoutMode {
  return isMobileFeedUi ? mode : "cards";
}
