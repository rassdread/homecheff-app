import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findUnboundHooks } from './check-unbound-hooks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('production components do not call hooks that were never imported', () => {
  const hits = findUnboundHooks(root);
  assert.deepEqual(hits, []);
});

test('reservations page keeps the client directive and React hook import', () => {
  const src = readFileSync(path.join(root, 'app/reservations/page.tsx'), 'utf8');
  assert.match(src, /^'use client';/);
  assert.match(src, /import \{ useEffect, useState \} from 'react';/);
});
