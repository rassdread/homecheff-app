import { createHash } from "node:crypto";
import { Resend } from "resend";
import { getTransactionalFrom, validateFromHeader, getRawFromEnv } from "@/lib/email-from";
import { logEmailSendFailure, readProviderFailure, safeProviderId, summarizeEmailError } from "@/lib/email-log";
import { logEmailDeliveryDiag } from "@/lib/email-delivery-diagnostics";
import { maskSenderPreview } from "@/lib/email-delivery-status";
import {
  resolveEmailSendEnvironment,
  resolveEmailSendPolicy,
  resolveResendApiKeyForSend,
} from "@/lib/email/env-policy";
import type { EmailPriority } from "@/lib/email/priority";

export type TransactionalEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  /** Business event key — Resend Idempotency-Key when set */
  idempotencyKey?: string;
  /** Intentional user-triggered resend: still send, but key must include attempt id */
  intentionalResend?: boolean;
  eventType: string;
  priority: EmailPriority;
  businessEventId?: string;
  route?: string;
  /**
   * Skip EMAIL_PAUSE_P2 for one explicit admin action.
   * Honored only when this server sets it and the route is one of the two
   * hand-composed admin sends: selected users, or the message center.
   * A request body cannot set this. Welcome, review, contact, chat and shift stay paused.
   */
  allowDuringP2Pause?: boolean;
};

export type TransactionalEmailResult =
  | {
      status: "sent";
      messageId: string | null;
      suppressed: false;
    }
  | {
      status: "suppressed";
      messageId: null;
      suppressed: true;
      reason: string;
    }
  | {
      status: "failed";
      messageId: null;
      suppressed: false;
      errorCode: string | null;
      errorMessage: string;
    };

const APP_NAME = "marketplace";

/** Process-local short TTL for admin blast / same-key de-dupe within one instance. */
const recentKeys = new Map<string, number>();
const LOCAL_TTL_MS = 15 * 60_000;

function pruneLocal(now: number) {
  if (recentKeys.size < 2000) return;
  for (const [k, t] of recentKeys) {
    if (now - t > LOCAL_TTL_MS) recentKeys.delete(k);
  }
}

export function hashIdempotencyPayload(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 48);
}

const MANUAL_ADMIN_EMAIL_ROUTES = new Set([
  "admin/send-bulk-message",
  "admin/notifications/send",
]);

/**
 * The pause exception is the route the server chose plus the flag that server set.
 * Passing the flag on any other route, or omitting the flag, leaves P2 paused.
 */
export function manualAdminMaySendDuringP2Pause(
  route: string | undefined,
  allowDuringP2Pause: boolean | undefined
): boolean {
  return allowDuringP2Pause === true && MANUAL_ADMIN_EMAIL_ROUTES.has(route || "");
}

/**
 * Canonical transactional send — env isolation, priority tags, structured logs, Resend idempotency.
 * Does not log bodies, tokens, or API keys.
 */
export async function sendTransactionalEmail(
  input: TransactionalEmailInput
): Promise<TransactionalEmailResult> {
  const env = resolveEmailSendEnvironment();
  const policy = resolveEmailSendPolicy();
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const recipientCount = recipients.length;
  const route = input.route || input.eventType;
  const senderPreview = maskSenderPreview(input.from || getRawFromEnv());

  const baseDiag = {
    app: APP_NAME,
    route,
    eventType: input.eventType,
    priority: input.priority,
    recipientCount,
    environment: env,
    businessEventId: input.businessEventId
      ? input.businessEventId.slice(0, 64)
      : undefined,
    intentionalResend: Boolean(input.intentionalResend),
    hasIdempotencyKey: Boolean(input.idempotencyKey),
    senderPreview,
  };

  if (!policy.allow) {
    logEmailDeliveryDiag("email_send_skipped", {
      ...baseDiag,
      reason: policy.reason,
    }, 5_000);
    return {
      status: "suppressed",
      messageId: null,
      suppressed: true,
      reason: policy.reason,
    };
  }

  // Operator kill-switch: pause P2 (welcome/review/broadcast) without blocking P0/P1.
  // Only the two hand-composed admin routes may pass, and only when they set the flag themselves.
  const selectedUserAdminBypass = manualAdminMaySendDuringP2Pause(
    input.route,
    input.allowDuringP2Pause
  );
  if (
    input.priority === "P2" &&
    (process.env.EMAIL_PAUSE_P2 === "1" || process.env.EMAIL_PAUSE_P2 === "true") &&
    !selectedUserAdminBypass
  ) {
    logEmailDeliveryDiag(
      "email_send_skipped",
      { ...baseDiag, reason: "p2_paused" },
      5_000
    );
    return {
      status: "suppressed",
      messageId: null,
      suppressed: true,
      reason: "p2_paused",
    };
  }

  const apiKey = resolveResendApiKeyForSend();
  if (!apiKey) {
    logEmailDeliveryDiag("email_config_missing", { ...baseDiag, reason: "missing_api_key" });
    return {
      status: "suppressed",
      messageId: null,
      suppressed: true,
      reason: "missing_api_key",
    };
  }

  const from = input.from || getTransactionalFrom();
  if (!validateFromHeader(from)) {
    logEmailDeliveryDiag("email_invalid_sender", { ...baseDiag });
    return {
      status: "failed",
      messageId: null,
      suppressed: false,
      errorCode: "invalid_from",
      errorMessage: "invalid_from",
    };
  }

  const idempotencyKey = input.idempotencyKey?.trim().slice(0, 256) || undefined;
  if (idempotencyKey && !input.intentionalResend) {
    const now = Date.now();
    pruneLocal(now);
    const prev = recentKeys.get(idempotencyKey);
    if (prev && now - prev < LOCAL_TTL_MS) {
      logEmailDeliveryDiag(
        "email_send_skipped",
        { ...baseDiag, reason: "local_idempotent_replay" },
        2_000
      );
      return {
        status: "suppressed",
        messageId: null,
        suppressed: true,
        reason: "local_idempotent_replay",
      };
    }
    recentKeys.set(idempotencyKey, now);
  }

  logEmailDeliveryDiag(
    "email_send_attempt",
    {
      ...baseDiag,
      resendApiKeyPresent: true,
      fromEmailValid: true,
    },
    10_000
  );

  try {
    const { data, error } = transportOverride
      ? await transportOverride({
          from,
          to: recipients,
          subject: input.subject,
          html: input.html,
        })
      : await new Resend(apiKey).emails.send(
      {
        from,
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        tags: [
          { name: "app", value: APP_NAME },
          { name: "priority", value: input.priority },
          { name: "event", value: input.eventType.slice(0, 50) },
          { name: "environment", value: env.slice(0, 20) },
        ],
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    if (error) {
      const failure = readProviderFailure(error);
      if (idempotencyKey && failure.code === "rate_limit_exceeded") {
        recentKeys.delete(idempotencyKey);
      }
      const category = failure.code === "rate_limit_exceeded" ? "email_provider_rate_limit" : "email_provider_unknown";
      logEmailSendFailure(input.eventType, error, {
        recipientEmail: recipients[0],
      });
      logEmailDeliveryDiag(category, {
        ...baseDiag,
        reason: failure.code || summarizeEmailError(error, 80),
      });
      // If local key was set and provider rejected as duplicate, keep key
      return {
        status: "failed",
        messageId: null,
        suppressed: false,
        errorCode: failure.code,
        errorMessage: failure.reason || summarizeEmailError(error, 120),
      };
    }

    const messageId = safeProviderId(
      data && typeof data === "object" && "id" in data ? (data as { id: unknown }).id : null
    );

    logEmailDeliveryDiag("email_send_success", {
      ...baseDiag,
      resendIdSuffix: messageId ? messageId.slice(-12) : undefined,
    });

    return { status: "sent", messageId, suppressed: false };
  } catch (e) {
    logEmailSendFailure(input.eventType, e, { recipientEmail: recipients[0] });
    logEmailDeliveryDiag("email_provider_unknown", {
      ...baseDiag,
      reason: summarizeEmailError(e, 80),
    });
    if (idempotencyKey) recentKeys.delete(idempotencyKey);
    const failure = readProviderFailure(e);
    return {
      status: "failed",
      messageId: null,
      suppressed: false,
      errorCode: failure.code || "transport",
      errorMessage: failure.reason || summarizeEmailError(e, 120),
    };
  }
}

/** Test helper — clear local idempotency map */
export function __resetTransactionalEmailIdempotencyForTests() {
  recentKeys.clear();
}

export type TransactionalEmailTransport = (input: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}) => Promise<{
  data: { id: string } | null;
  error: { message: string; name?: string; statusCode?: number } | null;
}>;

/** Test-only stand-in for Resend. Production leaves this unset and calls Resend. */
let transportOverride: TransactionalEmailTransport | null = null;

export function __setTransactionalEmailTransportForTests(
  transport: TransactionalEmailTransport | null
) {
  transportOverride = transport;
}
