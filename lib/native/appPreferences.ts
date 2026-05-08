import { isNativeApp } from "@/lib/native/capacitor";

const PREFS_KEY = "hc_app_prefs_v1";

export type NativeFeedSortPrefs = {
  feedChip?: "all" | "sale" | "inspiration";
  sortBy?: "newest" | "price" | "views" | "distance";
  sortOrder?: "asc" | "desc";
};

export type NativeAppPrefs = {
  v: 1;
  userId: string | null;
  feed?: NativeFeedSortPrefs;
  /** Geen ruwe waarden; alleen granted/denied/prompt */
  lastPushPermission?: string;
  lastGeoPermissionHint?: string;
  updatedAt: number;
};

function readAll(): NativeAppPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as NativeAppPrefs;
    if (o?.v !== 1) return null;
    return o;
  } catch {
    return null;
  }
}

function writeAll(p: NativeAppPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function readNativeFeedPrefs(
  userId: string | null | undefined
): NativeFeedSortPrefs | null {
  if (!isNativeApp()) return null;
  const all = readAll();
  if (!all) return null;
  if (userId && all.userId && all.userId !== userId) return null;
  return all.feed ?? null;
}

export function writeNativeFeedPrefs(
  userId: string | null | undefined,
  feed: NativeFeedSortPrefs
): void {
  if (!isNativeApp()) return;
  const prev = readAll();
  const next: NativeAppPrefs = {
    v: 1,
    userId: userId ?? prev?.userId ?? null,
    feed: { ...prev?.feed, ...feed },
    lastPushPermission: prev?.lastPushPermission,
    lastGeoPermissionHint: prev?.lastGeoPermissionHint,
    updatedAt: Date.now(),
  };
  writeAll(next);
}

export function writeNativePermissionHints(partial: {
  lastPushPermission?: string;
  lastGeoPermissionHint?: string;
}): void {
  if (!isNativeApp()) return;
  const prev = readAll();
  const next: NativeAppPrefs = {
    v: 1,
    userId: prev?.userId ?? null,
    feed: prev?.feed,
    lastPushPermission: partial.lastPushPermission ?? prev?.lastPushPermission,
    lastGeoPermissionHint:
      partial.lastGeoPermissionHint ?? prev?.lastGeoPermissionHint,
    updatedAt: Date.now(),
  };
  writeAll(next);
}

export function touchNativePrefsUser(userId: string | null | undefined): void {
  if (!isNativeApp() || !userId) return;
  const prev = readAll();
  if (prev?.userId && prev.userId !== userId) {
    writeAll({
      v: 1,
      userId,
      feed: undefined,
      updatedAt: Date.now(),
    });
    return;
  }
  writeAll({
    v: 1,
    userId,
    feed: prev?.feed,
    lastPushPermission: prev?.lastPushPermission,
    lastGeoPermissionHint: prev?.lastGeoPermissionHint,
    updatedAt: Date.now(),
  });
}

export function clearNativeAppPrefs(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    /* ignore */
  }
}
