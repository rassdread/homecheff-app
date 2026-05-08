/** Lokale shell / native UX — expliciete keys (geen brede "session"/"token" patronen). */

export const NATIVE_SHELL_STORAGE_KEY = "hc_cap_shell_v1";

export const NATIVE_PENDING_ROUTE_KEY = "hc_cap_pending_route";

export type NativeShellStored = {
  v: 1;
  /** Laatst gekozen pad (met trailing slash), alleen allowlist. */
  lastPath: string;
  /** UserId op moment van opslag; bij mismatch niet herstellen. */
  userId: string | null;
  updatedAt: number;
};

export type NativePendingRoute = {
  v: 1;
  path: string;
  ts: number;
};
