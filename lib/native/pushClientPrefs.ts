/**
 * Lokale push-sync / device-id (geen secrets; FCM-token zelf staat in hc_npush_reg).
 */

import { getCachedPushRegistrationId } from '@/lib/native/pushRegistrationCache';

const DEVICE_KEY = 'hc_push_device_id';
const LAST_SERVER_SYNC_AT_KEY = 'hc_push_last_server_sync_at';
/** Minimale interval tussen identieke token → server POST (FCM refresh zit meestal in ander token). */
const MIN_SERVER_RESYNC_MS = 2 * 60 * 60 * 1000;

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

export function shouldThrottlePushServerSync(token: string): boolean {
  if (typeof window === 'undefined' || !token.trim()) return false;
  try {
    const cached = getCachedPushRegistrationId();
    if (!cached || cached !== token.trim()) return false;
    const raw = localStorage.getItem(LAST_SERVER_SYNC_AT_KEY);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < MIN_SERVER_RESYNC_MS;
  } catch {
    return false;
  }
}

export function recordPushServerSyncTime(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_SERVER_SYNC_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
