import assert from 'node:assert/strict';
import test from 'node:test';
import { dueCampaignGrantRetries } from './campaign-grant-retry';

test('a recent Stripe wait does not fill the whole retry batch', () => {
  const now = new Date('2026-10-13T12:00:00Z');
  const recent = new Date('2026-10-13T11:59:30Z');
  const old = new Date('2026-10-13T11:00:00Z');
  const due = dueCampaignGrantRetries(
    [
      { id: 'stripe-wait', hcCampaignGrantAttemptAt: recent },
      { id: 'outage', hcCampaignGrantAttemptAt: old },
      { id: 'fresh', hcCampaignGrantAttemptAt: null },
    ],
    now,
    2,
  );
  assert.deepEqual(due.map((row) => row.id), ['fresh', 'outage']);
});
