/**
 * Lokale push-sync / device-id (geen secrets; FCM-token zelf staat in hc_npush_reg).
 */

import { getCachedPushRegistrationId } from '@/lib/native/pushRegistrationCache';

const DEVICE_KEY = 'hc_push_device_id';
const LAST_SERVER_SYNC_AT_KEY = 'hc_push_last_server_sync_at';
const LAST_SYNCED_APP_VERSION_KEY = 'hc_push_sync_app_ver';

/** Minimale interval tussen identieke token → server POST (FCM refresh zit meestal in ander token). */
const MIN_SERVER_RESYNC_MS = 2 * 60 * 60 * 1000;

/** Korter interval bij expliciete resume/force: lastUsed op server, zonder spam bij snelle tab-wissels. */
const MIN_FORCED_SERVER_RESYNC_MS = 90 * 1000;

export function getOrCreatePushDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(DEVICE_KEY)?.trim();
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `d_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id.slice(0, 128);
  } catch {
    return '';
  }
}

export function getLastSyncedPushAppVersion(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(LAST_SYNCED_APP_VERSION_KEY)?.trim();
    return v || null;
  } catch {
    return null;
  }
}

function setLastSyncedPushAppVersion(version: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_SYNCED_APP_VERSION_KEY, version.slice(0, 64));
  } catch {
    /* ignore */
  }
}

/**
 * Throttle server POST: zelfde token + recente sync.
 * Na native app-update (ander semver): altijd opnieuw POST zodat token/user/device weer actief is.
 */
export function shouldThrottlePushServerSync(
  token: string,
  opts?: { appVersion?: string | null; force?: boolean }
): boolean {
  if (typeof window === 'undefined' || !token.trim()) return false;
  try {
    const ver = (opts?.appVersion ?? '').trim();
    if (ver && getLastSyncedPushAppVersion() !== ver) {
      return false;
    }
    const cached = getCachedPushRegistrationId();
    if (!cached || cached !== token.trim()) return false;
    const raw = localStorage.getItem(LAST_SERVER_SYNC_AT_KEY);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (Number.isNaN(t)) return false;
    const minMs = opts?.force ? MIN_FORCED_SERVER_RESYNC_MS : MIN_SERVER_RESYNC_MS;
    return Date.now() - t < minMs;
  } catch {
    return false;
  }
}

export function recordPushServerSyncTime(appVersion?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_SERVER_SYNC_AT_KEY, String(Date.now()));
    const v = appVersion?.trim();
    if (v) setLastSyncedPushAppVersion(v);
  } catch {
    /* ignore */
  }
}
