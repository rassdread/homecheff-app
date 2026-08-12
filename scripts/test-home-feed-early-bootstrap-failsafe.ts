/**
 * Early feed bootstrap failsafe — bounded wait + ignore late settle.
 */
import assert from 'node:assert/strict';
import {
  HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS,
  raceHomeFeedEarlyBootstrap,
  takeHomeFeedEarlyBootstrap,
  startHomeFeedEarlyBootstrap,
  buildHomeFeedEarlyRequestParams,
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
    (globalThis as { window?: unknown }).window = {
      __HC_EARLY_FEED__: {
        requestKey: key,
        startedAt: Date.now(),
        promise: late,
        ignored: false,
      },
    };
    const miss = await takeHomeFeedEarlyBootstrap(key, { waitMs: 40 });
    ok('take timeout returns null', miss === null);
    const slot = (
      globalThis as { window: { __HC_EARLY_FEED__?: { ignored?: boolean } } }
    ).window.__HC_EARLY_FEED__;
    ok('timed-out slot marked ignored', slot?.ignored === true);

    resolveLate({
      requestKey: key,
      status: 200,
      ok: true,
      json: { items: [{ id: 'x' }] },
      startedAt: Date.now(),
      completedAt: Date.now(),
    });
    await late;
    await new Promise((r) => setTimeout(r, 10));
    const second = await takeHomeFeedEarlyBootstrap(key, { waitMs: 40 });
    ok('late success cannot be consumed after ignore', second === null);
  }

  {
    const key = 'radius=25&scope=nearby&test=504';
    (globalThis as { window: { __HC_EARLY_FEED__?: unknown } }).window = {
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

  ok(
    'seed param builder still exported for contract tests',
    typeof buildHomeFeedEarlyRequestParams === 'function' &&
      typeof startHomeFeedEarlyBootstrap === 'function' &&
      typeof readSeededFeedLocation === 'function',
  );

  console.log(`\n✅ early feed bootstrap failsafe: ${passed} checks passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
