import { isSafeRestorablePath, toTrailingSlashPath } from "@/lib/native/safeRoute";
import {
  NATIVE_SHELL_STORAGE_KEY,
  type NativeShellStored,
} from "@/lib/native/nativeShellKeys";

export function readNativeShellState(): NativeShellStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(NATIVE_SHELL_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as NativeShellStored;
    if (o?.v !== 1 || typeof o.lastPath !== "string") return null;
    if (!isSafeRestorablePath(o.lastPath)) return null;
    return o;
  } catch {
    return null;
  }
}

export function writeNativeShellLastPath(
  path: string,
  userId: string | null | undefined
): void {
  if (typeof window === "undefined") return;
  if (!isSafeRestorablePath(path)) return;
  try {
    const payload: NativeShellStored = {
      v: 1,
      lastPath: toTrailingSlashPath(path),
      userId: userId ?? null,
      updatedAt: Date.now(),
    };
    localStorage.setItem(NATIVE_SHELL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}
