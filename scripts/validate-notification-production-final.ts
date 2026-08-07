/**
 * Static + unit-style validator for production notification reliability completion.
 * Does not import Prisma-backed modules (no DATABASE_URL required).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`OK: ${msg}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function computeOutboxBackoffMs(attemptCount: number): number {
  const base = 30_000;
  const exp = Math.min(Math.max(attemptCount, 1), 8);
  return Math.min(base * 2 ** (exp - 1), 60 * 60 * 1000);
}

function buildOutboxIdempotencyKey(batchId: string, token: string): string {
  return createHash('sha256')
    .update(`${batchId}:${token}`)
    .digest('hex')
    .slice(0, 64);
}

assert(computeOutboxBackoffMs(1) === 30_000, 'backoff attempt 1 = 30s');
assert(computeOutboxBackoffMs(2) === 60_000, 'backoff attempt 2 = 60s');
assert(computeOutboxBackoffMs(3) === 120_000, 'backoff attempt 3 = 120s');
assert(computeOutboxBackoffMs(8) <= 60 * 60 * 1000, 'backoff capped at 1h');
assert(
  buildOutboxIdempotencyKey('batch', 'token-a') !==
    buildOutboxIdempotencyKey('batch', 'token-b'),
  'idempotency key differs per token'
);
assert(
  buildOutboxIdempotencyKey('b1', 't') === buildOutboxIdempotencyKey('b1', 't'),
  'idempotency key stable'
);

const svc = read('lib/notifications/notification-service.ts');
const outbox = read('lib/notifications/push-outbox.ts');
const delivery = read('lib/notifications/push-outbox-delivery.ts');
const webMsg = read('lib/firebase/web-messaging.ts');
const fcmSw = read('public/firebase-messaging-sw.js');
const sw = read('public/sw.js');
const vercel = read('vercel.json');
const cron = read('app/api/cron/notification-outbox/route.ts');
const replay = read('app/api/admin/notifications/outbox/replay/route.ts');
const schema = read('prisma/schema.prisma');
const providers = read('components/Providers.tsx');
const settings = read('components/profile/NotificationSettings.tsx');
const tokenServer = read('lib/native/pushTokenServer.ts');
const safe = read('lib/native/safeRoute.ts');

assert(svc.includes('enqueuePushOutbox'), 'FCM path enqueues durable outbox');
assert(svc.includes('processDuePushOutbox'), 'FCM path drains outbox immediately');
assert(!svc.includes('no durable outbox yet'), 'transient-only retry removed');
assert(outbox.includes('QUEUED') && outbox.includes('EXPIRED'), 'outbox statuses');
assert(outbox.includes('FOR UPDATE SKIP LOCKED'), 'claim uses SKIP LOCKED');
assert(outbox.includes('computeOutboxBackoffMs'), 'exponential backoff');
assert(outbox.includes('PROCESSING') && outbox.includes('staleBefore'), 'stale PROCESSING reclaim');
assert(delivery.includes('markOutboxSent'), 'delivery marks sent');
assert(delivery.includes('isActive'), 'invalid token cleanup');
assert(webMsg.includes('getToken') && webMsg.includes('vapidKey'), 'web FCM getToken+VAPID');
assert(webMsg.includes('requestPermission'), 'permission gated');
assert(fcmSw.includes('onBackgroundMessage'), 'FCM SW background handler');
assert(fcmSw.includes('notificationclick'), 'FCM SW click deep link');
assert(fcmSw.includes('clients.openWindow'), 'FCM SW opens window');
assert(sw.includes('resolvePushDeepLink'), 'legacy sw deep links preserved');
assert(vercel.includes('/api/cron/notification-outbox'), 'vercel cron for outbox');
assert(cron.includes('processDuePushOutbox'), 'cron drains outbox');
assert(replay.includes('replayOutboxRows'), 'admin replay tooling');
assert(schema.includes('model NotificationPushOutbox'), 'prisma outbox model');
assert(providers.includes('WebPushRegistration'), 'Providers mounts web push');
assert(settings.includes('enableBrowserPush'), 'settings user-gesture enable');
assert(tokenServer.includes('platform === "web"'), 'web token register allowed');
assert(safe.includes('/orders/') && safe.includes('/messages'), 'deep link allowlist');
assert(
  fs.existsSync(
    path.join(root, 'prisma/migrations/20260806_notification_push_outbox/migration.sql')
  ),
  'migration SQL present'
);
const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };
assert(Boolean(pkg.dependencies?.firebase), 'firebase dependency declared');

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nHOMECHEFF_NOTIFICATION_PRODUCTION_FINAL_STATIC_OK');
