/**
 * Opt-in duplicate initial-request detection (Phase 2).
 * Observes fetch only — does not change request flow.
 *
 * Enable: NEXT_PUBLIC_FEED_PERF_BASELINE=1
 */

import { isFeedPerfBaselineEnabled, feedPerfNow } from '@/lib/feed/feed-performance-baseline';

const WATCHED_PREFIXES = [
  '/api/feed',
  '/api/profile/me',
  '/api/auth/session',
  '/api/inspiratie',
  '/api/marketplace/pending-accepted-values',
  '/api/user/me',
  '/api/i18n/',
  '/api/home/community-pulse',
] as const;

export type DuplicateRequestRecord = {
  path: string;
  startMs: number;
  endMs: number | null;
  durationMs: number | null;
  callIndex: number;
  status: number | null;
  overlapsPrior: boolean;
  initiator: string;
};

const pathCounts = new Map<string, number>();
const records: DuplicateRequestRecord[] = [];
let installed = false;

function sanitizeFetchUrl(input: RequestInfo | URL): string {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return url.pathname;
  } catch {
    return '/unknown';
  }
}

function isWatchedPath(path: string): boolean {
  return WATCHED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

function guessInitiator(): string {
  try {
    const stack = new Error().stack ?? '';
    const lines = stack.split('\n').slice(2, 8);
    const hit = lines.find(
      (line) =>
        line.includes('/components/') ||
        line.includes('/hooks/') ||
        line.includes('/lib/'),
    );
    if (!hit) return 'fetch';
    const trimmed = hit.trim().replace(/^at\s+/, '');
    const file = trimmed.split(' ').pop() ?? trimmed;
    return file.slice(0, 120);
  } catch {
    return 'fetch';
  }
}

function hasOverlap(path: string, startMs: number): boolean {
  return records.some(
    (r) =>
      r.path === path &&
      r.endMs != null &&
      startMs >= r.startMs &&
      startMs <= r.endMs + 50,
  );
}

export function installDuplicateRequestDetector(): void {
  if (typeof window === 'undefined' || !isFeedPerfBaselineEnabled() || installed) return;
  installed = true;

  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = sanitizeFetchUrl(input);
    const watched = isWatchedPath(path);
    const startMs = feedPerfNow();
    let callIndex = 0;
    let overlapsPrior = false;
    let initiator = 'fetch';

    if (watched) {
      callIndex = (pathCounts.get(path) ?? 0) + 1;
      pathCounts.set(path, callIndex);
      overlapsPrior = callIndex > 1 || hasOverlap(path, startMs);
      initiator = guessInitiator();
      records.push({
        path,
        startMs,
        endMs: null,
        durationMs: null,
        callIndex,
        status: null,
        overlapsPrior,
        initiator,
      });
    }

    try {
      const res = await original(input, init);
      if (watched) {
        const endMs = feedPerfNow();
        const last = records[records.length - 1];
        if (last && last.path === path && last.endMs == null) {
          last.endMs = endMs;
          last.durationMs = endMs - startMs;
          last.status = res.status;
        }
      }
      return res;
    } catch (err) {
      if (watched) {
        const endMs = feedPerfNow();
        const last = records[records.length - 1];
        if (last && last.path === path && last.endMs == null) {
          last.endMs = endMs;
          last.durationMs = endMs - startMs;
        }
      }
      throw err;
    }
  };
}

export function getDuplicateRequestReport(): {
  records: DuplicateRequestRecord[];
  duplicates: DuplicateRequestRecord[];
} {
  const duplicates = records.filter((r) => r.overlapsPrior || r.callIndex > 1);
  return { records: [...records], duplicates };
}
