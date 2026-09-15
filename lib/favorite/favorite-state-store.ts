/**
 * Shared client favorite state — one Favorite row per product/dish,
 * synced across tiles, detail, and /favorites. Writes still go through
 * POST /api/favorites/toggle.
 */

export const FAVORITE_CHANGED_EVENT = 'homecheff:favorite-changed';

export type FavoriteItemKind = 'product' | 'dish';

export type FavoriteSnapshot = {
  favorited: boolean;
};

export type FavoriteChangedDetail = {
  kind: FavoriteItemKind;
  id: string;
  favorited: boolean;
};

const snapshots = new Map<string, FavoriteSnapshot>();
const listeners = new Map<string, Set<() => void>>();
const statusInflight = new Map<string, Promise<boolean>>();
const locallyToggled = new Set<string>();

export function favoriteItemKey(kind: FavoriteItemKind, id: string): string {
  return `${kind}:${id}`;
}

function emit(key: string, snap: FavoriteSnapshot, kind: FavoriteItemKind, id: string) {
  listeners.get(key)?.forEach((cb) => cb());
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<FavoriteChangedDetail>(FAVORITE_CHANGED_EVENT, {
      detail: { kind, id, favorited: snap.favorited },
    }),
  );
}

export function getFavoriteSnapshot(
  kind: FavoriteItemKind,
  id: string,
): FavoriteSnapshot | null {
  if (!id) return null;
  return snapshots.get(favoriteItemKey(kind, id)) ?? null;
}

export function seedFavoriteSnapshot(
  kind: FavoriteItemKind,
  id: string,
  snap: FavoriteSnapshot,
  opts?: { overwrite?: boolean },
): void {
  if (!id) return;
  const key = favoriteItemKey(kind, id);
  if (!opts?.overwrite && locallyToggled.has(key)) return;
  const next = { favorited: Boolean(snap.favorited) };
  const prev = snapshots.get(key);
  if (prev && prev.favorited === next.favorited) return;
  snapshots.set(key, next);
  emit(key, next, kind, id);
}

export function setFavoriteSnapshot(
  kind: FavoriteItemKind,
  id: string,
  snap: FavoriteSnapshot,
  opts?: { local?: boolean },
): void {
  const key = favoriteItemKey(kind, id);
  if (opts?.local) locallyToggled.add(key);
  seedFavoriteSnapshot(kind, id, snap, { overwrite: true });
}

export function subscribeFavorite(
  kind: FavoriteItemKind,
  id: string,
  onChange: () => void,
): () => void {
  if (!id) return () => {};
  const key = favoriteItemKey(kind, id);
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(onChange);
  return () => {
    set?.delete(onChange);
    if (set && set.size === 0) listeners.delete(key);
  };
}

export async function fetchFavoriteStatusDeduped(
  kind: FavoriteItemKind,
  id: string,
): Promise<boolean> {
  const key = favoriteItemKey(kind, id);
  const pending = statusInflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const qs = kind === 'product' ? `productId=${encodeURIComponent(id)}` : `dishId=${encodeURIComponent(id)}`;
    const res = await fetch(`/api/favorites/status?${qs}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { favorited?: boolean };
    return Boolean(data.favorited);
  })().finally(() => {
    statusInflight.delete(key);
  });

  statusInflight.set(key, request);
  return request;
}
