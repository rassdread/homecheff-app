/**
 * Operator replay for NotificationPushOutbox dead-letter rows.
 * Usage:
 *   npx tsx scripts/replay-notification-outbox.ts
 *   npx tsx scripts/replay-notification-outbox.ts --status=EXPIRED --limit=20
 *   npx tsx scripts/replay-notification-outbox.ts --ids=id1,id2
 */
import {
  getOutboxStats,
  replayOutboxRows,
} from '../lib/notifications/push-outbox';
import { processDuePushOutbox } from '../lib/notifications/push-outbox-delivery';

async function main() {
  const args = process.argv.slice(2);
  const statusArg = args.find((a) => a.startsWith('--status='));
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const idsArg = args.find((a) => a.startsWith('--ids='));
  const status =
    statusArg?.split('=')[1] === 'EXPIRED' ? 'EXPIRED' : 'FAILED';
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 50;
  const ids = idsArg
    ? idsArg
        .split('=')[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const before = await getOutboxStats();
  const replayed = await replayOutboxRows({ ids, status, limit });
  const processed = await processDuePushOutbox(50);
  const after = await getOutboxStats();
  console.log(
    JSON.stringify({ before, replayed, processed, after }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
