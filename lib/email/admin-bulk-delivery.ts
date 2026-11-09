/**
 * Outcome of an admin bulk e-mail. Success means every requested recipient
 * was accepted by the provider. A HTTP 200 alone is not success.
 */

export type AdminBulkEmailStatus = "sent" | "failed" | "suppressed";

export type AdminBulkEmailAttempt = {
  status: AdminBulkEmailStatus;
  reason?: string;
};

export type AdminBulkOutcome =
  | "sent"
  | "partial"
  | "failed"
  | "notification_only"
  | "replay";

export type AdminBulkSendReport = {
  success: boolean;
  outcome: AdminBulkOutcome;
  notificationsSent: number;
  emailsAttempted: number;
  emailsSent: number;
  emailsFailed: number;
  emailsSuppressed: number;
  message: string;
  httpStatus: number;
};

export type BulkSendFeedback = {
  tone: "success" | "partial" | "error";
  message: string;
};

const REASON_TEXT: Record<string, string> = {
  p2_paused: "P2-mail staat gepauzeerd (EMAIL_PAUSE_P2)",
  missing_api_key: "de Resend-sleutel ontbreekt",
  test_suppress: "verzending is in de testomgeving onderdrukt",
  dev_suppress: "verzending vanuit development is onderdrukt",
  preview_no_dedicated_key: "preview mag geen productiemail versturen",
  preview_blocks_production_key: "preview mag de productiesleutel niet gebruiken",
  invalid_from: "het afzenderadres is ongeldig",
  local_idempotent_replay: "dezelfde mail is kort geleden al aangeboden",
  provider_rejected: "de provider heeft de mail geweigerd",
};

function describeReasons(attempts: AdminBulkEmailAttempt[]): string {
  const reasons = [
    ...new Set(
      attempts
        .map((attempt) => attempt.reason)
        .filter((reason): reason is string => Boolean(reason))
    ),
  ];
  if (reasons.length === 0) return "de provider heeft de mail niet geaccepteerd";
  return reasons
    .map((reason) => REASON_TEXT[reason] || "de provider heeft de mail niet geaccepteerd")
    .join("; ");
}

function noticeSentence(count: number): string {
  if (count <= 0) return "";
  const noun = count === 1 ? "gebruiker" : "gebruikers";
  return ` De in-app melding staat wel bij ${count} ${noun}.`;
}

export function attemptFromTransactionalResult(result: {
  status: string;
  reason?: string;
  errorMessage?: string;
}): AdminBulkEmailAttempt {
  if (result.status === "sent") return { status: "sent" };
  if (result.status === "suppressed") {
    return { status: "suppressed", reason: result.reason || "suppressed" };
  }
  if (result.errorMessage === "invalid_from") {
    return { status: "failed", reason: "invalid_from" };
  }
  return { status: "failed", reason: "provider_rejected" };
}

export async function collectAdminBulkAttempts(
  users: Array<{ email: string | null }>,
  send: (email: string) => Promise<{ status: string; reason?: string }>
): Promise<AdminBulkEmailAttempt[]> {
  const attempts: AdminBulkEmailAttempt[] = [];
  for (const user of users) {
    if (!user.email) continue;
    const result = await send(user.email);
    attempts.push(attemptFromTransactionalResult(result));
  }
  return attempts;
}

export function reportAdminBulkReplay(): AdminBulkSendReport {
  return {
    success: false,
    outcome: "replay",
    notificationsSent: 0,
    emailsAttempted: 0,
    emailsSent: 0,
    emailsFailed: 0,
    emailsSuppressed: 0,
    message:
      "Deze verzending is al eerder gestart. Er is nu geen nieuwe e-mail aan de provider aangeboden.",
    httpStatus: 409,
  };
}

export function reportAdminBulkSend(input: {
  emailRequested: boolean;
  notificationsSent: number;
  attempts: AdminBulkEmailAttempt[];
}): AdminBulkSendReport {
  const emailsAttempted = input.attempts.length;
  const emailsSent = input.attempts.filter((attempt) => attempt.status === "sent").length;
  const emailsFailed = input.attempts.filter((attempt) => attempt.status === "failed").length;
  const emailsSuppressed = input.attempts.filter(
    (attempt) => attempt.status === "suppressed"
  ).length;
  const base = {
    notificationsSent: input.notificationsSent,
    emailsAttempted,
    emailsSent,
    emailsFailed,
    emailsSuppressed,
  };

  if (!input.emailRequested) {
    const stored = input.notificationsSent > 0;
    return {
      ...base,
      success: stored,
      outcome: "notification_only",
      message: stored
        ? `In-app melding opgeslagen voor ${input.notificationsSent} ${
            input.notificationsSent === 1 ? "gebruiker" : "gebruikers"
          }. Er is geen e-mail verstuurd.`
        : "Er is geen e-mail en geen melding verstuurd.",
      httpStatus: stored ? 200 : 500,
    };
  }

  if (emailsAttempted === 0) {
    return {
      ...base,
      success: false,
      outcome: "failed",
      message: `Geen e-mail aangeboden aan de provider: geen van de geselecteerde gebruikers heeft een e-mailadres.${noticeSentence(
        input.notificationsSent
      )}`,
      httpStatus: 422,
    };
  }

  if (emailsSent === emailsAttempted) {
    const noun = emailsAttempted === 1 ? "ontvanger" : "ontvangers";
    return {
      ...base,
      success: true,
      outcome: "sent",
      message: `E-mail is aangeboden aan de e-mailprovider voor ${emailsSent} van ${emailsAttempted} ${noun}.`,
      httpStatus: 200,
    };
  }

  const unresolved = input.attempts.filter((attempt) => attempt.status !== "sent");
  if (emailsSent > 0) {
    return {
      ...base,
      success: false,
      outcome: "partial",
      message: `Gedeeltelijk gelukt: ${emailsSent} van ${emailsAttempted} e-mails zijn aangeboden aan de provider. ${emailsFailed} geweigerd en ${emailsSuppressed} niet aangeboden (${describeReasons(
        unresolved
      )}).${noticeSentence(input.notificationsSent)}`,
      httpStatus: 200,
    };
  }

  const noun = emailsAttempted === 1 ? "ontvanger" : "ontvangers";
  return {
    ...base,
    success: false,
    outcome: "failed",
    message: `Geen e-mail aangeboden aan de provider voor ${emailsAttempted} ${noun}. Reden: ${describeReasons(
      input.attempts
    )}.${noticeSentence(input.notificationsSent)}`,
    httpStatus: 502,
  };
}

/**
 * Reads the bulk-send JSON. A success tone is returned only when the body
 * explicitly says the provider accepted every requested recipient.
 */
export function interpretBulkSendResponse(
  status: number,
  data: unknown
): BulkSendFeedback {
  const record =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const explicitMessage = typeof record?.message === "string" ? record.message.trim() : "";
  const explicitError = typeof record?.error === "string" ? record.error.trim() : "";
  const message = explicitMessage || explicitError;
  const outcome = record?.outcome;
  const success = record?.success === true;
  const sent = typeof record?.emailsSent === "number" ? record.emailsSent : null;
  const attempted =
    typeof record?.emailsAttempted === "number" ? record.emailsAttempted : null;
  const countsConfirmSend =
    sent !== null && attempted !== null && attempted > 0 && sent === attempted;

  if (
    status >= 200 &&
    status < 300 &&
    success &&
    outcome === "sent" &&
    countsConfirmSend &&
    message
  ) {
    return { tone: "success", message };
  }

  if (outcome === "partial" && message) {
    return { tone: "partial", message };
  }

  if (outcome === "notification_only" && message) {
    return { tone: success ? "partial" : "error", message };
  }

  if ((outcome === "failed" || outcome === "replay") && message) {
    return { tone: "error", message };
  }

  const unconfirmedSuccessClaim = success || outcome === "sent";
  if (message && !unconfirmedSuccessClaim) {
    return { tone: "error", message };
  }

  return {
    tone: "error",
    message:
      "De server bevestigde niet dat de e-mail is aangeboden aan de provider. Er is geen succesmelding.",
  };
}
