#!/usr/bin/env node
/**
 * HomeCheff cold/warm startup measurement (Phase 2).
 *
 * Usage:
 *   node scripts/performance/measure-homecheff-startup.mjs --help
 *   node scripts/performance/measure-homecheff-startup.mjs --base-url=http://127.0.0.1:3000 --runs=3 --mode=cold
 *   node scripts/performance/measure-homecheff-startup.mjs --base-url=https://preview.example --runs=3 --mode=warm
 *
 * Env (optional):
 *   FEED_PERF_TIMING=1  — only affects server if set in target environment, not this script.
 *
 * Note: cache-bypass + fresh agents approximate cold HTTP; this is NOT identical to Vercel function cold start.
 */

import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';

function printHelp() {
  console.log(`HomeCheff startup measurement

Options:
  --base-url=<url>   Target origin (default: http://127.0.0.1:3000)
  --runs=<n>         Measured runs per endpoint (default: 3)
  --mode=cold|warm   cold: no keep-alive, cache-bypass headers
                     warm: warmup request, then keep-alive reuse
  --help             Show this help

Examples:
  node scripts/performance/measure-homecheff-startup.mjs --base-url=http://127.0.0.1:3000 --runs=3 --mode=cold
  node scripts/performance/measure-homecheff-startup.mjs --base-url=https://homecheff.eu --runs=3 --mode=warm
`);
}

function parseArgs(argv) {
  const opts = {
    baseUrl: process.env.BASE_URL || 'http://127.0.0.1:3000',
    runs: 3,
    mode: 'cold',
    help: false,
  };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg.startsWith('--base-url=')) opts.baseUrl = arg.slice('--base-url='.length);
    else if (arg.startsWith('--runs=')) opts.runs = Math.max(1, Number(arg.slice('--runs='.length)) || 3);
    else if (arg.startsWith('--mode=')) opts.mode = arg.slice('--mode='.length) === 'warm' ? 'warm' : 'cold';
  }
  return opts;
}

function requestOnce(url, { warm }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const started = performance.now();

    const headers = {
      Accept: parsed.pathname.startsWith('/api/') ? 'application/json' : 'text/html',
      'User-Agent': 'homecheff-perf-probe/phase2',
    };
    if (!warm) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers.Pragma = 'no-cache';
    }

    const req = lib.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers,
        agent: new (isHttps ? https.Agent : http.Agent)({ keepAlive: warm }),
      },
      (res) => {
        const ttfbMs = Math.round(performance.now() - started);
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const totalMs = Math.round(performance.now() - started);
          resolve({
            status: res.statusCode ?? 0,
            ttfbMs,
            totalMs,
            responseBytes: body.length,
            serverTiming: res.headers['server-timing'] ?? null,
          });
        });
      },
    );

    req.on('error', reject);
    req.setTimeout(120_000, () => {
      req.destroy(new Error('timeout'));
    });
    req.end();
  });
}

async function measureEndpoint(baseUrl, path, { runs, mode }) {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const rows = [];

  if (mode === 'warm') {
    try {
      await requestOnce(url, { warm: true });
    } catch (e) {
      console.warn(`  warmup failed for ${path}:`, e.message);
    }
  }

  for (let i = 1; i <= runs; i += 1) {
    const row = await requestOnce(url, { warm: mode === 'warm' });
    rows.push({
      run: i,
      timestamp: new Date().toISOString(),
      mode,
      path,
      ...row,
    });
    console.log(
      `  [${mode}] run ${i}/${runs} ${path} status=${row.status} ttfb=${row.ttfbMs}ms total=${row.totalMs}ms bytes=${row.responseBytes}`,
    );
    if (row.serverTiming) console.log(`    Server-Timing: ${row.serverTiming}`);
  }
  return rows;
}

function summarize(rows) {
  const nums = (key) => rows.map((r) => r[key]).filter((n) => Number.isFinite(n));
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const min = (arr) => (arr.length ? Math.min(...arr) : null);
  const max = (arr) => (arr.length ? Math.max(...arr) : null);
  return {
    count: rows.length,
    ttfbMs: { avg: avg(nums('ttfbMs')), min: min(nums('ttfbMs')), max: max(nums('ttfbMs')) },
    totalMs: { avg: avg(nums('totalMs')), min: min(nums('totalMs')), max: max(nums('totalMs')) },
    responseBytes: { avg: avg(nums('responseBytes')), min: min(nums('responseBytes')), max: max(nums('responseBytes')) },
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  console.log('HomeCheff Phase 2 startup probe');
  console.log(`  base-url: ${opts.baseUrl}`);
  console.log(`  mode: ${opts.mode}`);
  console.log(`  runs: ${opts.runs}`);
  console.log('  note: HTTP cold != Vercel function cold start\n');

  const endpoints = ['/', '/api/feed?scope=national&radius=0'];
  const all = [];

  for (const path of endpoints) {
    console.log(`Measuring ${path}`);
    const rows = await measureEndpoint(opts.baseUrl, path, opts);
    all.push(...rows);
  }

  const report = {
    measuredAt: new Date().toISOString(),
    baseUrl: opts.baseUrl,
    mode: opts.mode,
    runs: opts.runs,
    endpoints: endpoints.map((path) => ({
      path,
      summary: summarize(all.filter((r) => r.path === path)),
      rows: all.filter((r) => r.path === path),
    })),
  };

  console.log('\n--- Summary ---');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
