import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HISTORY_INCOMPLETE_NOTE,
  channelOutcomeLabel,
  channelsFromMessageType,
  contentFingerprint,
  countDecisions,
  describeChannelOutcomes,
  filterHistorySends,
  historyDay,
  planContentDeliveries,
  priorDeliveryId,
  priorFromStoredNotice,
  readStoredBroadcastNotice,
  recipientCountLabel,
  rowsForHistoryQuery,
  type HistoryListSend,
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
    assert.equal(channelOutcomeLabel('email', 'accepted'), 'E-mail geaccepteerd door maildienst');
    assert.equal(channelOutcomeLabel('email', 'accepted').includes('Afgeleverd'), false);
    assert.equal(channelOutcomeLabel('email', 'delivered'), 'Afgeleverd');
    assert.equal(channelOutcomeLabel('inApp', 'created'), 'In-appmelding aangemaakt');
    assert.equal(channelOutcomeLabel('email', 'failed'), 'Mislukt');
    assert.equal(channelOutcomeLabel('email', 'skipped_duplicate'), 'Overgeslagen als duplicaat');
    assert.equal(channelOutcomeLabel('email', 'unconfirmed'), 'Uitkomst onbekend');
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

describe('send history overview', () => {
  const older: HistoryListSend = {
    id: 'older-send',
    subject: 'Eerste testbericht',
    at: '2026-11-01T10:00:00.000Z',
    audience: 'Niet geregistreerd',
    channels: ['In-app', 'E-mail'],
    channelIds: ['inApp', 'email'],
    recipientCount: 2,
    incomplete: true,
    note: HISTORY_INCOMPLETE_NOTE,
  };
  const newer: HistoryListSend = {
    id: 'newer-send',
    subject: 'Tweede testbericht',
    at: '2026-11-09T22:30:00.000Z',
    audience: 'Bezorgpartners',
    channels: ['In-app', 'Push'],
    channelIds: ['inApp', 'push'],
    recipientCount: 1,
    incomplete: false,
    note: null,
  };

  it('lists the newest send first and keeps the period and channel filters', () => {
    assert.equal(historyDay('2026-11-09T23:30:00.000Z'), '2026-11-10');
    const newestFirst = filterHistorySends([older, newer], { from: null, to: null, channel: 'all' });
    assert.deepEqual(newestFirst.map((send) => send.id), ['newer-send', 'older-send']);
    const emailOnly = filterHistorySends([older, newer], { from: '2026-11-01', to: '2026-11-02', channel: 'email' });
    assert.deepEqual(emailOnly.map((send) => send.id), ['older-send']);
    assert.equal(recipientCountLabel(1, false), '1 ontvanger');
    assert.equal(recipientCountLabel(0, true), 'Ontvangers niet geregistreerd');
  });

  it('opens the original message from a person and keeps skipped or failed outcomes unread', () => {
    const stored = readStoredBroadcastNotice({
      title: subject,
      message,
      messageType: 'email',
      broadcastId: 'test-broadcast',
      from: 'admin',
    });
    assert.equal(stored?.message, message);
    assert.deepEqual(channelsFromMessageType(stored?.messageType ?? null), ['inApp', 'email']);
    assert.equal(readStoredBroadcastNotice({ title: 'Nieuwe badge', body: 'badge', data: { kind: 'HCP_BADGE' } }), null);
    const outcomes = describeChannelOutcomes(['inApp', 'email'], { inApp: 'created', email: 'missing' });
    assert.equal(outcomes[0]?.status, 'In-appmelding aangemaakt');
    assert.equal(outcomes[0]?.received, true);
    assert.equal(outcomes[1]?.status, 'Niet geregistreerd');
    assert.equal(outcomes[1]?.received, false);
    const failed = describeChannelOutcomes(['push'], { push: 'failed' });
    const skipped = describeChannelOutcomes(['email'], { email: 'skipped_duplicate' });
    assert.equal(failed[0]?.received, false);
    assert.equal(skipped[0]?.status, 'Overgeslagen als duplicaat');
    assert.equal(skipped[0]?.received, false);
    const rows = rowsForHistoryQuery({
      sends: [older, newer],
      membership: [
        { sendId: 'older-send', userId: 'test-seller-courier', channels: outcomes },
        { sendId: 'newer-send', userId: 'test-courier', channels: failed },
      ],
      people: [
        { id: 'test-seller-courier', name: 'Test verkoper', email: 'seller@homecheff.invalid', username: 'test-seller' },
        { id: 'test-courier', name: 'Test bezorger', email: 'courier@homecheff.invalid', username: 'test-courier' },
      ],
      query: 'seller@homecheff.invalid',
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.id, 'older-send');
    assert.equal(rows[0]?.subject, 'Eerste testbericht');
    assert.equal(rows[0]?.focus?.channels.some((channel) => channel.channel === 'E-mail'), true);
    const bySubject = rowsForHistoryQuery({
      sends: [older, newer],
      membership: [],
      people: [],
      query: 'Tweede',
    });
    assert.equal(bySubject[0]?.id, 'newer-send');
    assert.equal(bySubject[0]?.focus, null);
  });
});
