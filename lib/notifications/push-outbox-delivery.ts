/**
 * Process claimed NotificationPushOutbox rows via Firebase Admin FCM.
 */
import { getFirebaseMessaging } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';
import { isValidFcmTokenShape, maskPushTokenForLogs } from '@/lib/pushTokenValidation';
import {
  claimDueOutboxRows,
  markOutboxFailedPermanent,
  markOutboxRetry,
  markOutboxSent,
  type FcmOutboxPayload,
  type OutboxRow,
} from '@/lib/notifications/push-outbox';

function fcmErrorCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const e = err as { code?: string; errorInfo?: { code?: string } };
  return String(e.code || e.errorInfo?.code || '');
}

function isInvalidTokenError(err: unknown): boolean {
  const code = fcmErrorCode(err);
  const msg = err instanceof Error ? err.message : String(err);
  return (
    code.includes('registration-token-not-registered') ||
    code.includes('invalid-registration-token') ||
    code === 'messaging/invalid-argument' ||
    msg.includes('registration-token-not-registered') ||
    msg.includes('Requested entity was not found')
  );
}

async function deactivateFcmToken(token: string): Promise<void> {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "PushToken"
    SET "isActive" = false, "updatedAt" = ${now}
    WHERE "token" = ${token}
  `.catch(() => undefined);
}

function buildFcmMessage(
  token: string,
  payload: FcmOutboxPayload
): Parameters<NonNullable<ReturnType<typeof getFirebaseMessaging>>['send']>[0] {
  const avatarUrl = payload.avatarUrl || undefined;
  const webIcon = payload.webIcon || undefined;
  const notification: { title: string; body: string; imageUrl?: string } = {
    title: payload.title,
    body: payload.body,
  };
  if (avatarUrl) notification.imageUrl = avatarUrl;

  const androidNotification: {
    channelId: string;
    sound: string;
    title: string;
    body: string;
    imageUrl?: string;
  } = {
    channelId: payload.androidChannelId || 'chat_messages',
    sound: 'default',
    title: payload.title,
    body: payload.body,
  };
  if (avatarUrl) androidNotification.imageUrl = avatarUrl;

  return {
    token,
    notification,
    data: payload.data,
    android: {
      priority: 'high',
      notification: androidNotification,
    },
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: 'default',
        },
      },
      ...(avatarUrl ? { fcmOptions: { imageUrl: avatarUrl } } : {}),
    },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        ...(webIcon ? { icon: webIcon, badge: webIcon } : {}),
        ...(avatarUrl ? { image: avatarUrl } : {}),
      },
      fcmOptions: {
        link: payload.data.route || payload.data.actionUrl || undefined,
      },
      data: payload.data,
    },
  };
}

async function deliverOne(row: OutboxRow): Promise<'sent' | 'failed' | 'retry'> {
  if (!isValidFcmTokenShape(row.token)) {
    await markOutboxFailedPermanent(row.id, 'invalid_token_shape');
    await deactivateFcmToken(row.token);
    return 'failed';
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    await markOutboxRetry(
      row.id,
      'firebase_admin_not_configured',
      row.attemptCount,
      row.maxAttempts
    );
    return 'retry';
  }

  try {
    await messaging.send(buildFcmMessage(row.token, row.payload));
    await markOutboxSent(row.id);
    return 'sent';
  } catch (err: unknown) {
    if (isInvalidTokenError(err)) {
      await deactivateFcmToken(row.token);
      await markOutboxFailedPermanent(
        row.id,
        fcmErrorCode(err) || 'invalid_registration_token'
      );
      if (process.env.NODE_ENV === 'development') {
        console.info(
          '[outbox] token deactivated',
          maskPushTokenForLogs(row.token)
        );
      }
      return 'failed';
    }
    const msg = err instanceof Error ? err.message : String(err);
    await markOutboxRetry(
      row.id,
      fcmErrorCode(err) || msg,
      row.attemptCount,
      row.maxAttempts
    );
    return 'retry';
  }
}

export type ProcessOutboxResult = {
  claimed: number;
  sent: number;
  failed: number;
  retry: number;
};

export async function processDuePushOutbox(
  limit = 40
): Promise<ProcessOutboxResult> {
  const rows = await claimDueOutboxRows(limit);
  let sent = 0;
  let failed = 0;
  let retry = 0;
  for (const row of rows) {
    const r = await deliverOne(row);
    if (r === 'sent') sent += 1;
    else if (r === 'failed') failed += 1;
    else retry += 1;
  }
  return { claimed: rows.length, sent, failed, retry };
}
