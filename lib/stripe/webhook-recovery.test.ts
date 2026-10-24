import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assessWebhookRecovery, recoverFailedStripeEvent } from './webhook-recovery';

const failed = {
  eventId: 'evt_abc123',
  eventType: 'checkout.session.completed',
  livemode: false,
  status: 'FAILED',
};

describe('webhook recovery', () => {
  it('refuses processed, live, mismatched, and over-limit events', () => {
    assert.equal(assessWebhookRecovery({
      eventId: 'not-an-event',
      receipt: failed,
      recentAttemptCount: 0,
      livemodeRecoveryEnabled: false,
    }).ok, false);
    assert.equal(
      assessWebhookRecovery({
        eventId: failed.eventId,
        receipt: { ...failed, status: 'PROCESSED' },
        recentAttemptCount: 0,
        livemodeRecoveryEnabled: false,
      }).ok,
      false,
    );
    const live = assessWebhookRecovery({
      eventId: failed.eventId,
      receipt: { ...failed, livemode: true },
      recentAttemptCount: 0,
      livemodeRecoveryEnabled: false,
    });
    assert.equal(live.ok, false);
    if (!live.ok) assert.equal(live.code, 'LIVEMODE_RECOVERY_DISABLED');
    const mismatch = assessWebhookRecovery({
      eventId: failed.eventId,
      receipt: failed,
      retrieved: { id: failed.eventId, type: 'charge.refunded', livemode: false },
      recentAttemptCount: 0,
      livemodeRecoveryEnabled: false,
    });
    assert.equal(mismatch.ok, false);
    if (!mismatch.ok) assert.equal(mismatch.code, 'EVENT_MISMATCH');
    const limited = assessWebhookRecovery({
      eventId: failed.eventId,
      receipt: failed,
      recentAttemptCount: 5,
      livemodeRecoveryEnabled: false,
    });
    assert.equal(limited.ok, false);
    if (!limited.ok) assert.equal(limited.code, 'RATE_LIMITED');
  });

  it('dispatches a retrieved failed test event once', async () => {
    const attempts: string[] = [];
    let dispatches = 0;
    const result = await recoverFailedStripeEvent({
      eventId: failed.eventId,
      livemodeRecoveryEnabled: false,
      recentAttemptCount: 0,
      receipt: failed,
      retrieve: async () => ({ id: failed.eventId, type: failed.eventType, livemode: false }),
      dispatch: async () => {
        dispatches += 1;
        return { status: 200 };
      },
      recordAttempt: async (code) => {
        attempts.push(code);
      },
      begin: async () => 'PROCESS',
      finish: async () => undefined,
    });
    assert.equal(result.code, 'RECOVERED');
    assert.equal(result.dispatched, true);
    assert.equal(dispatches, 1);
    assert.deepEqual(attempts, ['RECOVERED']);
  });

  it('does not dispatch when the receipt is already in flight or complete', async () => {
    let dispatches = 0;
    const inflight = await recoverFailedStripeEvent({
      eventId: failed.eventId,
      livemodeRecoveryEnabled: false,
      recentAttemptCount: 0,
      receipt: failed,
      retrieve: async () => ({ id: failed.eventId, type: failed.eventType, livemode: false }),
      dispatch: async () => {
        dispatches += 1;
        return { status: 200 };
      },
      recordAttempt: async () => undefined,
      begin: async () => 'IN_FLIGHT',
      finish: async () => undefined,
    });
    assert.equal(inflight.dispatched, false);
    assert.equal(inflight.code, 'IN_FLIGHT');
    assert.equal(dispatches, 0);
  });
});
