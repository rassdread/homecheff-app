/**
 * Korte TTL localStorage-cache voor native app (geen gevoelige tokens).
 * Per userId geïsoleerd; keys worden bij logout / cleanup gewist.
 */

const PREFIX = "hc_nat_v1_";

export type NativePersistedEnvelope<T> = {
  v: 1;
  userId: string;
  ts: number;
  data: T;
};

function keyFor(kind: string, userId: string): string {
  return `${PREFIX}${kind}_${userId}`;
}

export function readNativePersistedCache<T>(
  kind: string,
  userId: string | null | undefined,
  ttlMs: number
): T | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(keyFor(kind, userId));
    if (!raw) return null;
    const env = JSON.parse(raw) as NativePersistedEnvelope<T>;
    if (env?.v !== 1 || env.userId !== userId || !env.data) return null;
    if (Date.now() - env.ts > ttlMs) {
      localStorage.removeItem(keyFor(kind, userId));
      return null;
    }
    return env.data;
  } catch {
    return null;
  }
}

export function writeNativePersistedCache<T>(
  kind: string,
  userId: string | null | undefined,
  data: T
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const env: NativePersistedEnvelope<T> = {
      v: 1,
      userId,
      ts: Date.now(),
      data,
    };
    localStorage.setItem(keyFor(kind, userId), JSON.stringify(env));
  } catch {
    /* quota */
  }
}

export function clearAllNativePersistedCaches(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
