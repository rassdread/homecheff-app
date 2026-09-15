/**
 * Shared client follow state — one Follow row per maker, synced across tiles + profile.
 * Canonical writes still go through POST /api/follows/toggle.
 */

export const FOLLOW_CHANGED_EVENT = 'homecheff:follow-changed';

export type MakerFollowSnapshot = {
  following: boolean;
  fansCount: number;
};

export type FollowChangedDetail = {
  sellerId: string;
  following: boolean;
  fansCount: number;
};

const snapshots = new Map<string, MakerFollowSnapshot>();
const listeners = new Map<string, Set<() => void>>();
const statusInflight = new Map<string, Promise<boolean>>();
/** Sellers the viewer toggled this session — ignore stale feed seeds. */
const locallyToggled = new Set<string>();

function normalizeSnap(snap: MakerFollowSnapshot): MakerFollowSnapshot {
  return {
    following: Boolean(snap.following),
    fansCount: Math.max(0, Math.floor(snap.fansCount) || 0),
  };
}

function write(sellerId: string, snap: MakerFollowSnapshot): void {
  const next = normalizeSnap(snap);
  const prev = snapshots.get(sellerId);
  if (prev && prev.following === next.following && prev.fansCount === next.fansCount) {
    return;
  }
  snapshots.set(sellerId, next);
  emit(sellerId, next);
}

function emit(sellerId: string, snap: MakerFollowSnapshot) {
  listeners.get(sellerId)?.forEach((cb) => cb());
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<FollowChangedDetail>(FOLLOW_CHANGED_EVENT, {
      detail: { sellerId, following: snap.following, fansCount: snap.fansCount },
    }),
  );
}

export function getMakerFollowSnapshot(sellerId: string): MakerFollowSnapshot | null {
  if (!sellerId) return null;
  return snapshots.get(sellerId) ?? null;
}

export function seedMakerFollowSnapshot(
  sellerId: string,
  snap: MakerFollowSnapshot,
  opts?: { overwrite?: boolean },
): void {
  if (!sellerId) return;
  if (!opts?.overwrite && locallyToggled.has(sellerId)) return;
  write(sellerId, snap);
}

export function setMakerFollowSnapshot(
  sellerId: string,
  snap: MakerFollowSnapshot,
  opts?: { local?: boolean },
): void {
  if (opts?.local) locallyToggled.add(sellerId);
  seedMakerFollowSnapshot(sellerId, snap, { overwrite: true });
}

/** Keep follow flag; update canonical fan count from profile/stats. */
export function patchMakerFansCount(sellerId: string, fansCount: number): void {
  if (!sellerId) return;
  const prev = snapshots.get(sellerId);
  if (!prev) return;
  write(sellerId, {
    following: prev.following,
    fansCount: Math.max(0, Math.floor(fansCount) || 0),
  });
}

export function subscribeMakerFollow(sellerId: string, onChange: () => void): () => void {
  if (!sellerId) return () => {};
  let set = listeners.get(sellerId);
  if (!set) {
    set = new Set();
    listeners.set(sellerId, set);
  }
  set.add(onChange);
  return () => {
    set?.delete(onChange);
    if (set && set.size === 0) listeners.delete(sellerId);
  };
}

export async function fetchMakerFollowStatusDeduped(sellerId: string): Promise<boolean> {
  const pending = statusInflight.get(sellerId);
  if (pending) return pending;

  const request = (async () => {
    const res = await fetch(`/api/follows/status?sellerId=${encodeURIComponent(sellerId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { following?: boolean };
    return Boolean(data.following);
  })().finally(() => {
    statusInflight.delete(sellerId);
  });

  statusInflight.set(sellerId, request);
  return request;
}
