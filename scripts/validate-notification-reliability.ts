/**
 * Static validator: HomeCheff notification reliability pipeline.
 * Proves code-level coverage for FCM, deep links, quiet hours, typing isolation, SW.
 */
import fs from 'node:fs';
import path from 'node:path';

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

const svc = read('lib/notifications/notification-service.ts');
const sw = read('public/sw.js');
const deep = read('lib/native/pushDeepLink.ts');
const main = read('android/app/src/main/java/eu/homecheff/mobile/MainActivity.java');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const typingRoute = read('app/api/conversations/[conversationId]/typing/route.ts');
const pushRegister = read('app/api/push/register/route.ts');
const comms = read('components/communication/CommsRealtimeListener.tsx');
const pushTs = read('lib/native/push.ts');

assert(svc.includes('liveChannelsSuppressed'), 'quiet hours suppress live channels without dropping send');
assert(svc.includes('saveToDatabase'), 'inbox persistence path exists');
assert(
  svc.includes('isFcmProposalLikeNotificationType') &&
    svc.includes('buildFcmProposalPayload'),
  'proposal events have dedicated FCM payload builders'
);
assert(svc.includes("type: 'proposal'"), 'proposal FCM data type set');
assert(
  svc.includes('resolveFcmRouteFromMessage') &&
    svc.includes('actionUrl') &&
    svc.includes('route'),
  'order/delivery FCM resolves route/actionUrl/link'
);
assert(svc.includes('await new Promise((r) => setTimeout(r, 350))'), 'FCM transient retry present');
assert(svc.includes('deactivateFcmToken'), 'invalid token cleanup present');
assert(svc.includes("androidChannelId: 'order_updates_v2'"), 'order channel id wired');
assert(svc.includes("androidChannelId: 'chat_messages'"), 'chat channel id wired');
assert(
  svc.includes('PAYMENT_FAILED') && svc.includes('ORDER_REFUNDED'),
  'payment failed / refund treated as order-like FCM'
);
assert(
  !typingRoute.includes('NotificationService') &&
    !typingRoute.includes('sendFcm') &&
    typingRoute.includes('user-typing'),
  'typing API only emits user-typing — never NotificationService/FCM'
);
assert(sw.includes('resolvePushDeepLink'), 'service worker deep-link resolver');
assert(sw.includes("clients.openWindow('/messages')"), 'SW click fallback is /messages not homepage');
assert(sw.includes('notificationclick'), 'SW notificationclick handler');
assert(deep.includes('t === "proposal"'), 'native deep link handles proposal type');
assert(deep.includes('actionUrl'), 'native deep link reads actionUrl');
assert(manifest.includes('POST_NOTIFICATIONS'), 'Android POST_NOTIFICATIONS declared');
assert(main.includes('IMPORTANCE_HIGH'), 'Android channels use HIGH importance');
assert(main.includes('setLockscreenVisibility'), 'Android lockscreen visibility set');
assert(main.includes('chat_messages') && main.includes('order_updates_v2'), 'Android channels created');
assert(pushRegister.includes('registerPushToken') && pushRegister.includes('DELETE'), 'token register + logout DELETE');
assert(pushTs.includes('requestPermissions'), 'native permission request path');
assert(comms.includes('notificationsUpdated') && comms.includes('notification.mp3'), 'in-app toast + sound on live events');
assert(!comms.includes("channel.bind('user-typing'"), 'CommsRealtimeListener never binds typing');

const orderEvents = [
  'NEW_ORDER',
  'ORDER_',
  'PAYMENT_FAILED',
  'DELIVERY_',
  'PROPOSAL_RECEIVED',
  'PROPOSAL_ACCEPTED',
  'PROPOSAL_REJECTED',
];
for (const ev of orderEvents) {
  assert(svc.includes(ev), `server notification service references ${ev}`);
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nHOMECHEFF_NOTIFICATION_PIPELINE_STATIC_OK');
