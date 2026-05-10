/**
 * Eenvoudige semver-vergelijking voor app-versies (major.minor.patch).
 * Geen prerelease-vergelijking; onbekend formaat → null (veilig: geen force).
 */

export function parseSemverCore(version: string | null | undefined): number[] | null {
  if (version == null || typeof version !== 'string') return null;
  const trimmed = version.trim().replace(/^v/i, '');
  if (!trimmed) return null;
  const core = trimmed.split(/[-+]/)[0] ?? trimmed;
  const segments = core.split('.').map((p) => {
    const n = parseInt(p.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : NaN;
  });
  if (segments.length === 0 || segments.some((n) => Number.isNaN(n))) return null;
  return segments;
}

/** -1 als a < b, 0 gelijk, 1 als a > b, null bij onparseerbaar. */
export function compareSemver(
  a: string | null | undefined,
  b: string | null | undefined
): number | null {
  const pa = parseSemverCore(a);
  const pb = parseSemverCore(b);
  if (!pa || !pb) return null;
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da < db) return -1;
    if (da > db) return 1;
  }
  return 0;
}

export function isSemverLessThan(
  current: string | null | undefined,
  target: string | null | undefined
): boolean | null {
  const c = compareSemver(current, target);
  if (c === null) return null;
  return c < 0;
}
