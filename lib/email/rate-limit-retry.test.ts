import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import {
  __resetTransactionalEmailIdempotencyForTests,
  __setTransactionalEmailTransportForTests,
  sendTransactionalEmail,
} from './idempotent-send';
import { EMAIL_PRIORITY } from './priority';

const saved = {
  EMAIL_PAUSE_P2: process.env.EMAIL_PAUSE_P2,
  EMAIL_FORCE_TEST_MODE: process.env.EMAIL_FORCE_TEST_MODE,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_ALLOW_DEV_SEND: process.env.RESEND_ALLOW_DEV_SEND,
  VERCEL_ENV: process.env.VERCEL_ENV,
  NODE_ENV: process.env.NODE_ENV,
};

describe('a rate-limited offer can be tried once more', () => {
  before(() => {
    delete process.env.EMAIL_FORCE_TEST_MODE;
    delete process.env.EMAIL_PAUSE_P2;
    delete process.env.RESEND_ALLOW_DEV_SEND;
    process.env.VERCEL_ENV = 'production';
    process.env.RESEND_API_KEY = 're_simulated_not_a_real_key';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    __resetTransactionalEmailIdempotencyForTests();
  });

  after(() => {
    __setTransactionalEmailTransportForTests(null);
    __resetTransactionalEmailIdempotencyForTests();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('calls the provider again after a rate limit and keeps a validation rejection once', async () => {
    const calls: string[] = [];
    __setTransactionalEmailTransportForTests(async () => {
      calls.push('rate');
      if (calls.length === 1) {
        return { data: null, error: { name: 'rate_limit_exceeded', statusCode: 429, message: 'Too many requests for person@example.com' } };
      }
      return { data: { id: '4b7c1d2e-9a30-4f1b-8c2d-1234567890ab' }, error: null };
    });
    const input = {
      to: 'person@example.com',
      from: 'HomeCheff <no-reply@homecheff.eu>',
      subject: 'Tempo',
      html: '<p>tempo</p>',
      eventType: 'admin_broadcast',
      priority: EMAIL_PRIORITY.P2,
      route: 'admin/notifications/send',
      allowDuringP2Pause: true,
      idempotencyKey: 'admin-broadcast:campaign:person:email:1',
    };
    const first = await sendTransactionalEmail(input);
    assert.equal(first.status, 'failed');
    if (first.status === 'failed') {
      assert.equal(first.errorCode, 'rate_limit_exceeded');
      assert.equal(first.errorMessage.includes('person@example.com'), false);
    }
    const second = await sendTransactionalEmail(input);
    assert.equal(second.status, 'sent');
    if (second.status === 'sent') assert.equal(second.messageId, '4b7c1d2e-9a30-4f1b-8c2d-1234567890ab');
    assert.equal(calls.length, 2);

    __setTransactionalEmailTransportForTests(async () => {
      calls.push('validation');
      return { data: null, error: { name: 'validation_error', statusCode: 422, message: 'Invalid to person@example.com' } };
    });
    const rejected = await sendTransactionalEmail({ ...input, idempotencyKey: 'admin-broadcast:campaign:person:email:validation' });
    const replay = await sendTransactionalEmail({ ...input, idempotencyKey: 'admin-broadcast:campaign:person:email:validation' });
    assert.equal(rejected.status, 'failed');
    assert.equal(replay.status, 'suppressed');
    if (replay.status === 'suppressed') assert.equal(replay.reason, 'local_idempotent_replay');
    assert.equal(calls.filter((call) => call === 'validation').length, 1);
  });
});
