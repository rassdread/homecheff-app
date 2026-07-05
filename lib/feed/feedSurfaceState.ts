/**
 * Session-scoped feed / filter snapshots (sessionStorage).
 * Small payloads only — server/API remains source of truth; no full item blobs.
 */

const STORAGE_KEY = 'hc_feed_surfaces_v2';
const MAX_AGE_MS = 25 * 60 * 1000;
const MAX_JSON_CHARS = 12_000;

export type FeedSurfaceId =
  | 'home'
  | 'discover_hub'
  | 'dorpsplein_hub'
  | 'dorpsplein_page'
  | 'inspiratie_hub'
  | 'inspiratie_page'
  | 'profile_main'
  | 'profile_v2'
  | 'hcp_mijn';

type SurfaceEnvelope = {
  savedAt: number;
  payload: unknown;
};

function readAll(): Record<string, SurfaceEnvelope> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SurfaceEnvelope>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, SurfaceEnvelope>): void {
  if (typeof window === 'undefined') return;
  try {
    const s = JSON.stringify(data);
    if (s.length > MAX_JSON_CHARS * 2) return;
    window.sessionStorage.setItem(STORAGE_KEY, s);
  } catch {
    /* quota */
  }
}

function prune(data: Record<string, SurfaceEnvelope>): Record<string, SurfaceEnvelope> {
  const now = Date.now();
  const out: Record<string, SurfaceEnvelope> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!v || typeof v !== 'object') continue;
    const at = (v as SurfaceEnvelope).savedAt;
    if (typeof at !== 'number' || now - at > MAX_AGE_MS) continue;
    out[k] = v as SurfaceEnvelope;
  }
  return out;
}

export function loadFeedSurfaceState<T>(surfaceId: FeedSurfaceId): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const all = prune(readAll());
    const row = all[surfaceId];
    if (!row || typeof row.savedAt !== 'number') return null;
    if (Date.now() - row.savedAt > MAX_AGE_MS) return null;
    return (row.payload as T) ?? null;
  } catch {
    return null;
  }
}

export function saveFeedSurfaceState(surfaceId: FeedSurfaceId, payload: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const all = prune(readAll());
    const next: SurfaceEnvelope = { savedAt: Date.now(), payload };
    const trial = JSON.stringify({ ...all, [surfaceId]: next });
    if (trial.length > MAX_JSON_CHARS) return;
    writeAll({ ...all, [surfaceId]: next });
  } catch {
    /* ignore */
  }
}

export function clearFeedSurfaceState(surfaceId: FeedSurfaceId): void {
  if (typeof window === 'undefined') return;
  try {
    const all = prune(readAll());
    delete all[surfaceId];
    writeAll(all);
  } catch {
    /* ignore */
  }
}
