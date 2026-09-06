import { createHash } from "node:crypto";
import { Resend } from "resend";
import { getTransactionalFrom, validateFromHeader, getRawFromEnv } from "@/lib/email-from";
import { logEmailSendFailure, summarizeEmailError } from "@/lib/email-log";
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
  if (
    input.priority === "P2" &&
    (process.env.EMAIL_PAUSE_P2 === "1" || process.env.EMAIL_PAUSE_P2 === "true")
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
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
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
      logEmailSendFailure(input.eventType, error, {
        recipientEmail: recipients[0],
      });
      logEmailDeliveryDiag("email_provider_unknown", {
        ...baseDiag,
        reason: summarizeEmailError(error, 80),
      });
      // If local key was set and provider rejected as duplicate, keep key
      return {
        status: "failed",
        messageId: null,
        suppressed: false,
        errorMessage: summarizeEmailError(error, 120),
      };
    }

    const messageId =
      data && typeof data === "object" && "id" in data && typeof (data as { id: unknown }).id === "string"
        ? String((data as { id: string }).id)
        : null;

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
    return {
      status: "failed",
      messageId: null,
      suppressed: false,
      errorMessage: summarizeEmailError(e, 120),
    };
  }
}

/** Test helper — clear local idempotency map */
export function __resetTransactionalEmailIdempotencyForTests() {
  recentKeys.clear();
}
