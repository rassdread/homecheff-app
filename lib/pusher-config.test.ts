import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  classifyPublicPusherEnv,
  classifyPusherEnv,
  openPusherServer,
  PusherUnavailableError,
  subscribeRealtimeChannel,
} from './pusher-config';

const configured = {
  PUSHER_APP_ID: 'app-test',
  PUSHER_SECRET: 'secret-test',
  NEXT_PUBLIC_PUSHER_KEY: 'key-test',
  NEXT_PUBLIC_PUSHER_CLUSTER: 'eu',
};

test('a complete configuration stays available for production realtime', () => {
  assert.equal(classifyPusherEnv(configured).availability, 'configured');
  assert.equal(classifyPublicPusherEnv(configured).availability, 'configured');
  let opened = 0;
  const server = openPusherServer(configured, (options) => {
    opened += 1;
    assert.equal(options.appId, 'app-test');
    assert.equal(options.key, 'key-test');
    assert.equal(options.secret, 'secret-test');
    assert.equal(options.cluster, 'eu');
    assert.equal(options.useTLS, true);
    return { opened: true };
  });
  assert.equal(opened, 1);
  assert.deepEqual(server, { opened: true });
});

test('missing Pusher configuration is off and does not construct a client', () => {
  assert.equal(classifyPusherEnv({}).availability, 'disabled');
  assert.equal(classifyPublicPusherEnv({}).availability, 'disabled');
  assert.throws(
    () => openPusherServer({}, () => {
      throw new Error('factory must not run');
    }),
    (error) => error instanceof PusherUnavailableError && error.code === 'PUSHER_DISABLED',
  );
});

test('the disabled sentinel is off and is not used as a credential', () => {
  const env = {
    PUSHER_APP_ID: 'disabled',
    PUSHER_SECRET: 'disabled',
    NEXT_PUBLIC_PUSHER_KEY: 'disabled',
    NEXT_PUBLIC_PUSHER_CLUSTER: 'disabled',
  };
  assert.equal(classifyPusherEnv(env).availability, 'disabled');
  assert.equal(classifyPublicPusherEnv(env).availability, 'disabled');
  assert.throws(
    () => openPusherServer(env, () => {
      throw new Error('factory must not run');
    }),
    (error) => error instanceof PusherUnavailableError && error.code === 'PUSHER_DISABLED',
  );
});

test('a partial configuration is an error and does not connect', () => {
  const env = {
    PUSHER_APP_ID: 'app-test',
    PUSHER_SECRET: 'disabled',
    NEXT_PUBLIC_PUSHER_KEY: 'key-test',
    NEXT_PUBLIC_PUSHER_CLUSTER: '',
  };
  const classification = classifyPusherEnv(env);
  assert.equal(classification.availability, 'invalid');
  assert.deepEqual(classification.incomplete, ['PUSHER_SECRET', 'NEXT_PUBLIC_PUSHER_CLUSTER']);
  assert.equal(classifyPublicPusherEnv(env).availability, 'invalid');
  assert.throws(
    () => openPusherServer(env, () => {
      throw new Error('factory must not run');
    }),
    (error) =>
      error instanceof PusherUnavailableError &&
      error.code === 'PUSHER_INVALID' &&
      error.message.includes('PUSHER_SECRET') &&
      !error.message.includes('secret-test') &&
      !error.message.includes('key-test'),
  );
});

test('subscribe is not called without a client', () => {
  let calls = 0;
  const client = {
    subscribe(channelName: string) {
      calls += 1;
      return { channelName, bind() {}, unbind_all() {}, unsubscribe() {} };
    },
  };
  assert.equal(subscribeRealtimeChannel(null, 'private-delivery-user'), null);
  assert.equal(subscribeRealtimeChannel(undefined, 'private-delivery-user'), null);
  assert.equal(calls, 0);
  const channel = subscribeRealtimeChannel(client, 'private-delivery-user');
  assert.equal(channel?.channelName, 'private-delivery-user');
  assert.equal(calls, 1);
});

test('login listeners and pusher auth use the guarded realtime path', () => {
  const root = process.cwd();
  const comms = fs.readFileSync(path.join(root, 'components/communication/CommsRealtimeListener.tsx'), 'utf8');
  const delivery = fs.readFileSync(path.join(root, 'components/delivery/DeliveryNotificationListener.tsx'), 'utf8');
  const auth = fs.readFileSync(path.join(root, 'app/api/pusher/auth/route.ts'), 'utf8');
  const chat = fs.readFileSync(path.join(root, 'components/chat/ChatBox.tsx'), 'utf8');
  for (const source of [comms, delivery]) {
    assert.equal(source.includes('subscribeRealtimeChannel(getPusherClient()'), true);
    assert.equal(source.includes('pusherClient.subscribe'), false);
    assert.match(source, /if \(!channel\) return;/);
  }
  assert.match(auth, /realtime_disabled/);
  assert.match(auth, /realtime_invalid/);
  assert.match(chat, /if \(!pusher\)/);
});

test('importing the pusher module does not connect when configuration is absent', async () => {
  const previous = {
    PUSHER_APP_ID: process.env.PUSHER_APP_ID,
    PUSHER_SECRET: process.env.PUSHER_SECRET,
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  };
  delete process.env.PUSHER_APP_ID;
  delete process.env.PUSHER_SECRET;
  delete process.env.NEXT_PUBLIC_PUSHER_KEY;
  delete process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  try {
    const pusher = await import('./pusher.ts');
    assert.throws(
      () => pusher.pusherServer.trigger('private-delivery-user', 'notification', { ok: true }),
      (error) => error instanceof pusher.PusherUnavailableError && error.code === 'PUSHER_DISABLED',
    );
    assert.equal(pusher.pusherClient, null);
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
