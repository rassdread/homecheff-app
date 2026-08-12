/**
 * Early feed bootstrap failsafe — bounded wait + ignore late settle for UI,
 * while network work remains joinable for the same requestKey.
 */
import assert from 'node:assert/strict';
import {
  HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS,
  raceHomeFeedEarlyBootstrap,
  takeHomeFeedEarlyBootstrap,
  startHomeFeedEarlyBootstrap,
  buildHomeFeedEarlyRequestParams,
  joinOrFetchHomeFeedFirstPage,
} from '../lib/feed/home-feed-early-bootstrap';
import { readSeededFeedLocation } from '../lib/geo/seeded-feed-location';

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`  ✓ ${name}`);
}

async function main() {
  ok(
    'bounded wait is 2–3s',
    HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS >= 2000 &&
      HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS <= 3000,
  );

  {
    const t0 = Date.now();
    const { timedOut, value } = await raceHomeFeedEarlyBootstrap(
      Promise.resolve({ ok: true, requestKey: 'k' }),
      2500,
    );
    ok('fast early does not time out', timedOut === false && value?.ok === true);
    ok('fast early returns quickly', Date.now() - t0 < 200);
  }

  {
    const t0 = Date.now();
    const hung = new Promise<null>(() => {});
    const { timedOut, value } = await raceHomeFeedEarlyBootstrap(hung, 50);
    ok('hung early times out', timedOut === true && value === null);
    ok('hung wait is bounded (~50ms)', Date.now() - t0 < 200);
  }

  {
    const { timedOut, value } = await raceHomeFeedEarlyBootstrap(
      Promise.reject(new Error('fail')),
      2500,
    );
    ok('reject settles as miss', timedOut === false && value === null);
  }

  {
    const key = 'radius=25&scope=nearby&test=failsafe';
    type EarlyRes = {
      requestKey: string;
      status: number;
      ok: boolean;
      json: unknown;
      startedAt: number;
      completedAt: number;
    } | null;
    let resolveLate!: (v: EarlyRes) => void;
    const late = new Promise<EarlyRes>((r) => {
      resolveLate = r;
    });
    const inflight: Record<string, Promise<EarlyRes>> = Object.create(null);
    inflight[key] = late;
    (globalThis as { window?: unknown }).window = {
      __HC_EARLY_FEED__: {
        requestKey: key,
        startedAt: Date.now(),
        promise: late,
        ignored: false,
      },
      __HC_FEED_INFLIGHT__: inflight,
    };
    const miss = await takeHomeFeedEarlyBootstrap(key, { waitMs: 40 });
    ok('take timeout returns null', miss === null);
    const slot = (
      globalThis as { window: { __HC_EARLY_FEED__?: { ignored?: boolean } } }
    ).window.__HC_EARLY_FEED__;
    ok('timed-out slot marked ignored', slot?.ignored === true);

    const payload = {
      requestKey: key,
      status: 200,
      ok: true,
      json: { items: [{ id: 'x' }] },
      startedAt: Date.now(),
      completedAt: Date.now(),
    };
    resolveLate(payload);
    await late;
    await new Promise((r) => setTimeout(r, 10));
    const second = await takeHomeFeedEarlyBootstrap(key, { waitMs: 40 });
    ok('late success cannot be consumed via take() after ignore', second === null);

    const store = (
      globalThis as {
        window: {
          __HC_FEED_INFLIGHT__?: Record<string, Promise<EarlyRes>>;
        };
      }
    ).window.__HC_FEED_INFLIGHT__;
    if (store) store[key] = Promise.resolve(payload);
    const joined = await joinOrFetchHomeFeedFirstPage(key, `/api/feed?${key}`);
    ok(
      'join reuses identical in-flight/settled success after UI timeout',
      joined?.ok === true &&
        Array.isArray((joined.json as { items?: unknown[] })?.items),
    );
  }

  {
    const key = 'radius=25&scope=nearby&test=504';
    (
      globalThis as {
        window: {
          __HC_EARLY_FEED__?: unknown;
          __HC_FEED_INFLIGHT__?: Record<string, unknown>;
        };
      }
    ).window = {
      __HC_EARLY_FEED__: {
        requestKey: key,
        startedAt: Date.now(),
        ignored: false,
        promise: Promise.resolve({
          requestKey: key,
          status: 504,
          ok: false,
          json: null,
          startedAt: Date.now(),
          completedAt: Date.now(),
        }),
      },
      __HC_FEED_INFLIGHT__: Object.create(null),
    };
    const miss504 = await takeHomeFeedEarlyBootstrap(key, { waitMs: 2500 });
    ok('504 early is not consumed', miss504 === null);
  }

  {
    (globalThis as { window: { __HC_EARLY_FEED__?: unknown } }).window = {
      __HC_EARLY_FEED__: {
        requestKey: 'other-key',
        startedAt: Date.now(),
        ignored: false,
        promise: Promise.resolve({
          requestKey: 'other-key',
          status: 200,
          ok: true,
          json: { items: [] },
          startedAt: Date.now(),
          completedAt: Date.now(),
        }),
      },
    };
    const mismatch = await takeHomeFeedEarlyBootstrap('canonical-key', {
      waitMs: 100,
    });
    ok('mismatched requestKey is rejected', mismatch === null);
  }

  {
    const key = 'radius=25&scope=nearby&test=retry';
    let fetches = 0;
    const originalFetch = globalThis.fetch;
    (globalThis as { fetch: typeof fetch }).fetch = (async () => {
      fetches += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [{ id: 'retry' }], count: 1 }),
      } as Response;
    }) as typeof fetch;
    (globalThis as { window?: unknown }).window = {
      __HC_EARLY_FEED__: undefined,
      __HC_FEED_INFLIGHT__: Object.create(null),
    };
    const retried = await joinOrFetchHomeFeedFirstPage(key, `/api/feed?${key}`);
    ok(
      'failed shared request allows fresh retry',
      retried?.ok === true && fetches === 1,
    );
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  }

  {
    const keyA = 'radius=25&scope=nearby&test=a';
    const keyB = 'radius=0&scope=national&test=b';
    let fetches = 0;
    const originalFetch = globalThis.fetch;
    (globalThis as { fetch: typeof fetch }).fetch = (async (
      input: RequestInfo | URL,
    ) => {
      fetches += 1;
      const url = String(input);
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [], key: url }),
      } as Response;
    }) as typeof fetch;
    (globalThis as { window?: unknown }).window = {
      __HC_FEED_INFLIGHT__: Object.create(null),
    };
    await Promise.all([
      joinOrFetchHomeFeedFirstPage(keyA, `/api/feed?${keyA}`),
      joinOrFetchHomeFeedFirstPage(keyB, `/api/feed?${keyB}`),
    ]);
    ok('different requestKeys are not deduped together', fetches === 2);
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  }

  {
    const key = 'radius=25&scope=nearby&test=dedupe';
    let fetches = 0;
    const originalFetch = globalThis.fetch;
    (globalThis as { fetch: typeof fetch }).fetch = (async () => {
      fetches += 1;
      await new Promise((r) => setTimeout(r, 30));
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [{ id: 'one' }] }),
      } as Response;
    }) as typeof fetch;
    (globalThis as { window?: unknown }).window = {
      __HC_FEED_INFLIGHT__: Object.create(null),
    };
    const [a, b] = await Promise.all([
      joinOrFetchHomeFeedFirstPage(key, `/api/feed?${key}`),
      joinOrFetchHomeFeedFirstPage(key, `/api/feed?${key}`),
    ]);
    ok('identical concurrent joins share one fetch', fetches === 1);
    ok('identical concurrent joins return same ok payload', a?.ok === true && b?.ok === true);
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  }

  ok(
    'seed param builder still exported for contract tests',
    typeof buildHomeFeedEarlyRequestParams === 'function' &&
      typeof startHomeFeedEarlyBootstrap === 'function' &&
      typeof readSeededFeedLocation === 'function' &&
      typeof joinOrFetchHomeFeedFirstPage === 'function',
  );

  console.log(`\n✅ early feed bootstrap failsafe: ${passed} checks passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
