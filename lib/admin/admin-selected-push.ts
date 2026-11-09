import { isValidFcmTokenShape } from "@/lib/pushTokenValidation";
import { canonicalLogoUrl } from "@/lib/brand/canonical-logo";
import { parseInternalPathFromUnknownInput } from "@/lib/native/safeRoute";
import type { AdminBulkPushReport } from "@/lib/email/admin-bulk-delivery";

const ANDROID_CHANNEL = "announcements";

type PushSender = (token: string) => Promise<void>;

type PushTestDouble = {
  tokens: Array<{ token: string }>;
  send: PushSender | null;
};

let testDouble: PushTestDouble | null = null;

/** Test-only stand-in. Production leaves this unset and calls Firebase. */
export function __setSelectedUserPushForTests(double: PushTestDouble | null) {
  testDouble = double;
}

function truncate(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function invalidToken(error: unknown): boolean {
  const code =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : "";
  const message = error instanceof Error ? error.message : "";
  return (
    code.includes("registration-token-not-registered") ||
    code.includes("invalid-registration-token") ||
    code === "messaging/invalid-argument" ||
    message.includes("registration-token-not-registered") ||
    message.includes("Requested entity was not found")
  );
}

async function deactivateToken(token: string): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false, updatedAt: new Date() },
    });
  } catch {
    /* The send result still counts as failed. */
  }
}

async function firebaseSender(input: {
  title: string;
  body: string;
  broadcastId: string;
}): Promise<PushSender | null> {
  const { getFirebaseMessaging } = await import("@/lib/firebase/admin");
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;
  const title = truncate(input.title || "HomeCheff", 64);
  const body = truncate(input.body || "Bericht", 110);
  const route = parseInternalPathFromUnknownInput("/notifications/") ?? "/notifications/";
  const icon = canonicalLogoUrl("notification");
  return async (token: string) => {
    try {
      await messaging.send({
        token,
        notification: { title, body },
        data: { type: "announcement", route, broadcastId: input.broadcastId },
        android: {
          priority: "high",
          notification: { channelId: ANDROID_CHANNEL, sound: "default", title, body },
        },
        apns: {
          headers: { "apns-priority": "10", "apns-push-type": "alert" },
          payload: { aps: { alert: { title, body }, sound: "default" } },
        },
        webpush: { notification: { title, body, icon, badge: icon } },
      });
    } catch (error) {
      if (invalidToken(error)) await deactivateToken(token);
      throw error;
    }
  };
}

/**
 * Push for hand-picked users. A missing or invalid token is not a device.
 * Firebase is called only when at least one suitable token exists.
 */
export async function sendSelectedUserPush(input: {
  userIds: string[];
  title: string;
  body: string;
  broadcastId: string;
}): Promise<AdminBulkPushReport> {
  const rows = testDouble
    ? testDouble.tokens
    : await (async () => {
        const { prisma } = await import("@/lib/prisma");
        return prisma.pushToken.findMany({
          where: { userId: { in: input.userIds }, isActive: true, type: "FCM" },
          select: { token: true },
        });
      })();
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const row of rows) {
    const token = row.token?.trim();
    if (!token || seen.has(token) || !isValidFcmTokenShape(token)) continue;
    seen.add(token);
    tokens.push(token);
  }
  if (tokens.length === 0) {
    return { requested: true, status: "no_device", tokens: 0, offered: 0, failed: 0 };
  }

  const send = testDouble ? testDouble.send : await firebaseSender(input);
  if (!send) {
    return {
      requested: true,
      status: "failed",
      tokens: tokens.length,
      offered: 0,
      failed: tokens.length,
    };
  }

  let offered = 0;
  let failed = 0;
  for (const token of tokens) {
    try {
      await send(token);
      offered += 1;
    } catch {
      failed += 1;
    }
  }
  const status = failed === 0 ? "offered" : offered === 0 ? "failed" : "partial";
  return { requested: true, status, tokens: tokens.length, offered, failed };
}
