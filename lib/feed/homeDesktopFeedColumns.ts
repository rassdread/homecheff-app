"use client";

import { useCallback, useSyncExternalStore } from "react";

export type HomeDesktopFeedColumns = 1 | 2 | 3;

const STORAGE_KEY = "homecheff.homeDesktopFeedColumns";
const EXPLICIT_KEY = "homecheff.homeDesktopFeedColumns.explicit";
const VERSION_KEY = "homecheff.homeDesktopFeedColumns.version";
const CURRENT_VERSION = "2";
const CHANGE_EVENT = "hc-home-desktop-feed-columns";

/** Phase 3C default — single column on desktop. */
export const HOME_DESKTOP_FEED_COLUMNS_DEFAULT: HomeDesktopFeedColumns = 1;

function migrateLegacyPreference(): void {
  if (typeof window === "undefined") return;
  try {
    const version = window.localStorage.getItem(VERSION_KEY);
    if (version === CURRENT_VERSION) return;

    const explicit = window.localStorage.getItem(EXPLICIT_KEY) === "1";
    if (!explicit) {
      window.localStorage.setItem(STORAGE_KEY, String(HOME_DESKTOP_FEED_COLUMNS_DEFAULT));
    }
    window.localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  } catch {
    /* quota / private mode */
  }
}

export function readHomeDesktopFeedColumns(): HomeDesktopFeedColumns {
  if (typeof window === "undefined") return HOME_DESKTOP_FEED_COLUMNS_DEFAULT;
  try {
    migrateLegacyPreference();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "2") return 2;
    if (raw === "3") return 3;
    return HOME_DESKTOP_FEED_COLUMNS_DEFAULT;
  } catch {
    return HOME_DESKTOP_FEED_COLUMNS_DEFAULT;
  }
}

export function writeHomeDesktopFeedColumns(cols: HomeDesktopFeedColumns): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(cols));
    window.localStorage.setItem(EXPLICIT_KEY, "1");
    window.localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
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
    () => HOME_DESKTOP_FEED_COLUMNS_DEFAULT,
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

/** Default desktop feed grid for non-homepage routes (Phase 3C). */
export const DESKTOP_FEED_SINGLE_COLUMN_CLASS =
  "grid grid-cols-1 gap-4 xl:gap-5";
