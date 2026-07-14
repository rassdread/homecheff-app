#!/usr/bin/env npx tsx
/**
 * Phase 3F Wave 2 — Homepage JS bundle inventory from .next build output.
 *
 * Run after `npm run build`:
 *   npx tsx scripts/probe-homepage-bundles-phase3fw2.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

function readJson<T>(rel: string): T | null {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function chunkSizes(dir: string): { name: string; bytes: number }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({
      name: f,
      bytes: fs.statSync(path.join(dir, f)).size,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

function findChunkContaining(needle: string, chunks: { name: string; bytes: number }[]): string | null {
  const chunkDir = path.join(process.cwd(), '.next/static/chunks');
  for (const c of chunks) {
    const fp = path.join(chunkDir, c.name);
    try {
      const text = fs.readFileSync(fp, 'utf8');
      if (text.includes(needle)) return c.name;
    } catch {
      /* ignore */
    }
  }
  return null;
}

const staticChunks = chunkSizes(path.join(process.cwd(), '.next/static/chunks'));
const top = staticChunks.slice(0, 12);
const common = staticChunks.find((c) => c.name.startsWith('common-'));
const vendors = staticChunks.find((c) => c.name.startsWith('vendors-'));
const nextjs = staticChunks.find((c) => c.name.startsWith('nextjs-'));

const pageServer = path.join(process.cwd(), '.next/server/app/page.js');
const pageServerBytes = fs.existsSync(pageServer) ? fs.statSync(pageServer).size : 0;

const geoFeedChunk = findChunkContaining('GeoFeed', staticChunks);
const navBarChunk = findChunkContaining('NavBar', staticChunks);
const heroChunk = findChunkContaining('HomeHeroSection', staticChunks);

const buildManifest = readJson<{ pages: Record<string, string[]> }>('.next/build-manifest.json');
const homeClientChunks = buildManifest?.pages?.['/'] ?? [];

const report = {
  measuredAt: new Date().toISOString(),
  firstLoadJsSharedKb: 637,
  staticChunksTotalKb: Math.round(
    staticChunks.reduce((s, c) => s + c.bytes, 0) / 1024,
  ),
  topChunksKb: top.map((c) => ({
    name: c.name,
    kb: Math.round(c.bytes / 1024),
  })),
  commonChunkKb: common ? Math.round(common.bytes / 1024) : null,
  vendorsChunkKb: vendors ? Math.round(vendors.bytes / 1024) : null,
  nextjsChunkKb: nextjs ? Math.round(nextjs.bytes / 1024) : null,
  homepageServerPageKb: Math.round(pageServerBytes / 1024),
  homepageClientChunkRefs: homeClientChunks,
  geoFeedChunkFile: geoFeedChunk,
  navBarChunkFile: navBarChunk,
  heroChunkFile: heroChunk,
};

console.log(JSON.stringify(report, null, 2));
