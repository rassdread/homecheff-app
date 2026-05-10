import { prisma } from '@/lib/prisma';
import { getFirebaseMessaging } from '@/lib/firebase/admin';
import {
  isValidFcmTokenShape,
  maskPushTokenForLogs,
} from '@/lib/pushTokenValidation';
import { getPublicAppUrl } from '@/lib/public-app-url';
import { parseInternalPathFromUnknownInput } from '@/lib/native/safeRoute';

const ANDROID_CHANNEL = 'announcements';

function fcmErrCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const o = err as { code?: string; errorInfo?: { code?: string } };
    if (typeof o.code === 'string') return o.code;
    if (typeof o.errorInfo?.code === 'string') return o.errorInfo.code;
  }
  return '';
}

async function deactivateToken(token: string): Promise<void> {
  try {
    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false, updatedAt: new Date() },
    });
  } catch {
    /* ignore */
  }
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * Admin-omgeving: stuur één FCM-bericht per actief token voor de opgegeven gebruikers.
 * Gebruikt kanaal `announcements` (Android 8+). Geen marketing-pref-check: serviceberichten.
 */
export async function sendAdminBroadcastFcm(opts: {
  userIds: string[];
  title: string;
  body: string;
  /** Moet al gesaneerd zijn (safeRoute). */
  route: string;
  broadcastId: string;
}): Promise<{ tokensAttempted: number; success: number; failures: number }> {
  const messaging = getFirebaseMessaging();
  if (!messaging || opts.userIds.length === 0) {
    return { tokensAttempted: 0, success: 0, failures: 0 };
  }

  const routeParsed =
    parseInternalPathFromUnknownInput(opts.route) ?? '/notifications/';
  const title = truncate(opts.title || 'HomeCheff', 64);
  const body = truncate(opts.body || 'Bericht', 110);

  const rows = await prisma.pushToken.findMany({
    where: {
      userId: { in: opts.userIds },
      isActive: true,
      type: 'FCM',
    },
    select: { token: true },
  });

  const seen = new Set<string>();
  const webIcon = `${getPublicAppUrl()}/icon.png`;
  let success = 0;
  let failures = 0;

  const data: Record<string, string> = {
    type: 'announcement',
    route: routeParsed,
    broadcastId: opts.broadcastId,
  };

  for (const row of rows) {
    const token = row.token;
    if (!token || seen.has(token)) continue;
    seen.add(token);
    if (!isValidFcmTokenShape(token)) continue;

    const notification = { title, body };
    const androidNotification = {
      channelId: ANDROID_CHANNEL,
      sound: 'default',
      title,
      body,
    };

    try {
      await messaging.send({
        token,
        notification,
        data,
        android: {
          priority: 'high',
          notification: androidNotification,
        },
        apns: {
          headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
            },
          },
        },
        webpush: {
          notification: { title, body, icon: webIcon, badge: webIcon },
        },
      });
      success += 1;
    } catch (err: unknown) {
      failures += 1;
      const code = fcmErrCode(err);
      const msg = err instanceof Error ? err.message : String(err);
      const invalid =
        code.includes('registration-token-not-registered') ||
        code.includes('invalid-registration-token') ||
        code === 'messaging/invalid-argument' ||
        msg.includes('registration-token-not-registered') ||
        msg.includes('Requested entity was not found');
      if (invalid) {
        await deactivateToken(token);
        if (process.env.NODE_ENV === 'development') {
          console.info(
            '[admin-broadcast-fcm] token deactivated',
            maskPushTokenForLogs(token)
          );
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('[admin-broadcast-fcm] send failed', code || msg.slice(0, 120));
      }
    }
  }

  if (process.env.NODE_ENV === 'development' && seen.size > 0) {
    console.info('[admin-broadcast-fcm] summary', {
      users: opts.userIds.length,
      uniqueTokens: seen.size,
      success,
      failures,
    });
  }

  return { tokensAttempted: seen.size, success, failures };
}
