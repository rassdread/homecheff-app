#!/usr/bin/env npx tsx
/**
 * Phase 3D — Reconfirm desktop single-column default (delegates to 3C checks).
 */
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['tsx', 'scripts/validate-feed-desktop-layout-phase3c.ts'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
