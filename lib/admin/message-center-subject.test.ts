import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { emptySelection } from '@/lib/admin/notification-audience';
import { officialDeliveryIds } from '@/lib/communication/official-admin-message';

const headline = 'HomeCheff — test bericht';
const emails: Array<{ subject?: string }> = [];
const pushes: Array<{ title?: string; body?: string }> = [];
const letters: Array<{ subject?: string; message?: string }> = [];

const sergio = {
  id: 'user-sergio',
  email: 'sergio@example.com',
  name: 'Sergio Arrias',
  username: 'sergio',
  role: 'ADMIN',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  accountDeletedAt: null,
  suspendedAt: null,
  emailVerified: new Date('2026-01-01T00:00:00Z'),
  buyerRoles: [],
  sellerRoles: [],
  stripeConnectAccountId: null,
  stripeConnectOnboardingCompleted: false,
  hasSellerProfile: false,
  commerceReviewState: null,
  delivery: null,
  pushReachable: true,
};

const canMock = typeof mock.module === 'function';

if (canMock) mock.module('@/lib/auth', {
  namedExports: {
    auth: async () => ({ user: { email: 'admin@example.com' } }),
  },
});

if (canMock) mock.module('@/lib/prisma', {
  namedExports: {
    prisma: {
      user: {
        findUnique: async () => ({ id: 'admin-1', role: 'ADMIN' }),
        findMany: async () => [],
      },
      auditLog: {
        findMany: async () => [],
        findUnique: async () => null,
        upsert: async () => ({}),
      },
      notification: {
        findMany: async () => [],
      },
    },
  },
});

if (canMock) mock.module('@/lib/admin/load-notification-audience', {
  namedExports: {
    loadAudienceCandidates: async () => [],
    loadActiveAdminsByIds: async () => [sergio],
  },
});

if (canMock) mock.module('@/lib/email/idempotent-send', {
  namedExports: {
    sendTransactionalEmail: async (input: { subject?: string }) => {
      emails.push(input);
      return { status: 'sent', messageId: 'sim_subject' };
    },
  },
});

if (canMock) mock.module('@/lib/admin/admin-broadcast-fcm', {
  namedExports: {
    sendAdminBroadcastFcmByUser: async (input: { title?: string; body?: string; userIds: string[] }) => {
      pushes.push(input);
      return {
        tokensAttempted: 1,
        success: 1,
        failures: 0,
        perUser: input.userIds.map((userId) => ({ userId, tokens: 1, offered: 1, failed: 0 })),
      };
    },
  },
});

if (canMock) mock.module('@/lib/communication/official-admin-message', {
  namedExports: {
    officialDeliveryIds,
    createOfficialAdminCopies: async (input: {
      recipientIds: string[];
      subject: string;
      message: string;
      adminUserId: string;
      action: { label: string; url: string } | null;
      broadcastId: string;
    }) => {
      letters.push(input);
      return input.recipientIds.map((recipientId) => ({
        recipientId,
        subject: input.subject,
        text: input.message,
        pushRoute: `/messages/c${recipientId}/`,
        fresh: true,
      }));
    },
  },
});

describe('one subject reaches the intercepted message-center send', () => {
  it('uses the filled subject for the preview, email, push payload and HomeCheff message', { skip: !canMock }, async () => {
const { POST } = await import('@/app/api/admin/notifications/send/route');

function request(body: Record<string, unknown>, key: string) {
  return {
    headers: {
      get(name: string) {
        const lower = name.toLowerCase();
        if (lower === 'idempotency-key') return key;
        if (lower === 'x-homecheff-language') return 'nl';
        return null;
      },
    },
    cookies: { get: () => undefined },
    json: async () => body,
  } as never;
}

const form = {
  message: 'De tekst blijft staan.',
  subject: headline,
  title: 'Andere titel die niet gebruikt mag worden',
  selection: emptySelection('applicable'),
  manualAdmins: [{ userId: 'user-sergio', channels: ['email', 'push'] }],
  sendNotification: true,
  sendEmail: true,
  confirmEmailBlast: false,
  confirmRepeat: false,
  buttonLabel: 'Open mijn bezorgdashboard',
  route: '/delivery/dashboard',
};

const previewResponse = await POST(request({ ...form, dryRun: true }, 'subject01'));
const preview = await previewResponse.json();
assert.equal(previewResponse.status, 200);
assert.equal(typeof preview.previewToken, 'string');
assert.equal(emails.length, 0);
assert.equal(pushes.length, 0);
assert.equal(letters.length, 0);

const sentResponse = await POST(request({
  ...form,
  dryRun: false,
  previewToken: preview.previewToken,
}, 'subject01'));
const sent = await sentResponse.json();
assert.equal(sentResponse.status, 200, JSON.stringify(sent));
assert.equal(emails.length, 1);
assert.equal(pushes.length, 1);
assert.equal(letters.length, 1);
assert.equal(emails[0]?.subject, headline);
assert.equal(pushes[0]?.title, headline);
assert.equal(pushes[0]?.body, 'De tekst blijft staan.');
assert.equal(letters[0]?.subject, headline);
assert.equal(letters[0]?.message, 'De tekst blijft staan.');
assert.equal(JSON.stringify(emails).includes('Andere titel'), false);
assert.equal(JSON.stringify(pushes).includes('Andere titel'), false);
assert.equal(JSON.stringify(letters).includes('Andere titel'), false);
  });
});
