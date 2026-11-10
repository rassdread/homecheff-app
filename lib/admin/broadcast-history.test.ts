import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HISTORY_INCOMPLETE_NOTE,
  channelOutcomeLabel,
  contentFingerprint,
  countDecisions,
  planContentDeliveries,
  priorDeliveryId,
  priorFromStoredNotice,
} from './broadcast-history';

const message = 'Je Connect-onboarding staat nog open.';
const subject = 'Rond je Stripe-koppeling af';
const title = 'Stripe nog niet af';

describe('same message is delivered once per channel', () => {
  it('counts one dual-role person once across two send actions', () => {
    const fingerprint = contentFingerprint('email', title, subject, message);
    const first = priorDeliveryId('test-seller-courier', 'email', fingerprint);
    const second = priorDeliveryId('test-seller-courier', 'email', fingerprint);
    assert.equal(first, second);
    const decisions = planContentDeliveries({
      userIds: ['test-seller-courier', 'test-seller-courier'],
      channels: ['email', 'inApp'],
      priors: [
        {
          userId: 'test-seller-courier',
          channel: 'email',
          status: 'accepted',
          at: '2026-11-01T10:00:00.000Z',
          campaignId: 'first-send',
        },
      ],
      confirmRepeat: false,
    });
    const email = decisions.filter((item) => item.channel === 'email');
    const inApp = decisions.filter((item) => item.channel === 'inApp');
    assert.equal(email.length, 1);
    assert.equal(email[0]?.action, 'skip');
    assert.equal(inApp.length, 1);
    assert.equal(inApp[0]?.action, 'send');
    assert.equal(countDecisions(decisions, 'skip').email, 1);
  });

  it('sends the repeat only after an explicit confirmation', () => {
    const decisions = planContentDeliveries({
      userIds: ['test-courier'],
      channels: ['email'],
      priors: [
        {
          userId: 'test-courier',
          channel: 'email',
          status: 'accepted',
          at: '2026-11-02T10:00:00.000Z',
          campaignId: 'earlier',
        },
      ],
      confirmRepeat: true,
    });
    assert.equal(decisions[0]?.action, 'repeat');
    assert.equal(countDecisions(decisions, 'repeat').email, 1);
  });

  it('retries a failed attempt and holds an unknown outcome', () => {
    const failed = planContentDeliveries({
      userIds: ['test-courier'],
      channels: ['push'],
      priors: [
        {
          userId: 'test-courier',
          channel: 'push',
          status: 'failed',
          at: '2026-11-03T10:00:00.000Z',
          campaignId: 'failed-send',
        },
      ],
      confirmRepeat: false,
    });
    assert.equal(failed[0]?.action, 'send');
    const unknown = planContentDeliveries({
      userIds: ['test-courier'],
      channels: ['email'],
      priors: [
        {
          userId: 'test-courier',
          channel: 'email',
          status: 'unconfirmed',
          at: '2026-11-03T11:00:00.000Z',
          campaignId: 'unknown-send',
        },
      ],
      confirmRepeat: true,
    });
    assert.equal(unknown[0]?.action, 'review');
  });

  it('does not treat a different subject or body as the same email', () => {
    const same = contentFingerprint('email', title, subject, message);
    const otherSubject = contentFingerprint('email', title, 'Ander onderwerp', message);
    const otherBody = contentFingerprint('email', title, subject, 'Andere tekst');
    assert.notEqual(same, otherSubject);
    assert.notEqual(same, otherBody);
    assert.equal(channelOutcomeLabel('email', 'accepted').includes('Aflevering is niet bevestigd'), true);
    assert.equal(channelOutcomeLabel('inApp', 'created'), 'In-appmelding aangemaakt');
    assert.equal(HISTORY_INCOMPLETE_NOTE.includes('onvolledig'), true);
  });

  it('marks an existing stored test notice as an in-app duplicate', () => {
    const prior = priorFromStoredNotice({
      userId: 'test-seller-courier',
      at: '2026-11-09T12:00:00.000Z',
      content: { title, subject, message },
      payload: { title, message, broadcastId: 'earlier-test-send' },
    });
    assert.equal(prior?.channel, 'inApp');
    assert.equal(prior?.status, 'created');
    const decisions = planContentDeliveries({
      userIds: ['test-seller-courier'],
      channels: ['inApp', 'email'],
      priors: prior ? [prior] : [],
      confirmRepeat: false,
    });
    assert.equal(decisions.find((item) => item.channel === 'inApp')?.action, 'skip');
    assert.equal(decisions.find((item) => item.channel === 'email')?.action, 'send');
  });
});
