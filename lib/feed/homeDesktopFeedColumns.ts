"use client";

import { useCallback, useSyncExternalStore } from "react";

export type HomeDesktopFeedColumns = 1 | 2 | 3;

const STORAGE_KEY = "homecheff.homeDesktopFeedColumns";
const CHANGE_EVENT = "hc-home-desktop-feed-columns";

export function readHomeDesktopFeedColumns(): HomeDesktopFeedColumns {
  if (typeof window === "undefined") return 2;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "1") return 1;
    if (raw === "3") return 3;
    return 2;
  } catch {
    return 2;
  }
}

export function writeHomeDesktopFeedColumns(cols: HomeDesktopFeedColumns): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(cols));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* quota / private mode */
  }
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useHomeDesktopFeedColumns(): [
  HomeDesktopFeedColumns,
  (cols: HomeDesktopFeedColumns) => void,
] {
  const cols = useSyncExternalStore(
    subscribe,
    readHomeDesktopFeedColumns,
    () => 2 as HomeDesktopFeedColumns
  );
  const setCols = useCallback((next: HomeDesktopFeedColumns) => {
    writeHomeDesktopFeedColumns(next);
  }, []);
  return [cols, setCols];
}

export function homeDesktopFeedGridClass(cols: HomeDesktopFeedColumns): string {
  if (cols === 1) return "grid grid-cols-1 gap-4 xl:gap-5";
  if (cols === 3) return "grid grid-cols-3 gap-3 xl:gap-4";
  return "grid grid-cols-2 gap-4 xl:gap-5";
}
