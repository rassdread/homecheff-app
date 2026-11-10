import type { Prisma } from '@prisma/client';

/**
 * Per-recipient broadcast ledger decisions.
 * A channel is skipped only after a confirmed acceptance or a stored in-app row.
 * A provider failure can be retried. An unconfirmed earlier attempt is not resent
 * and is not reported as delivered.
 */

export type LedgerEmail = 'accepted' | 'failed' | 'suppressed' | 'unconfirmed' | null;
export type LedgerPush = 'offered' | 'failed' | 'no_token' | null;

export type RecipientLedger = {
  inApp: boolean;
  email: LedgerEmail;
  emailAttempt: number;
  push: LedgerPush;
  pushAttempt: number;
};

export type ChannelPlan = 'send' | 'skip_done' | 'skip_unconfirmed';

export function emptyLedger(): RecipientLedger {
  return { inApp: false, email: null, emailAttempt: 1, push: null, pushAttempt: 1 };
}

export function planInApp(ledger: RecipientLedger | null): ChannelPlan {
  if (ledger?.inApp) return 'skip_done';
  return 'send';
}

export function planEmail(ledger: RecipientLedger | null): ChannelPlan {
  if (ledger?.email === 'accepted') return 'skip_done';
  if (ledger?.email === 'unconfirmed') return 'skip_unconfirmed';
  return 'send';
}

export function planPush(ledger: RecipientLedger | null): ChannelPlan {
  if (ledger?.push === 'offered') return 'skip_done';
  return 'send';
}

export function emailLedgerStatus(result: {
  status: string;
  reason?: string;
}): 'accepted' | 'failed' | 'suppressed' | 'unconfirmed' {
  if (result.status === 'sent') return 'accepted';
  if (result.status === 'suppressed' && result.reason === 'local_idempotent_replay') return 'unconfirmed';
  if (result.status === 'suppressed') return 'suppressed';
  return 'failed';
}

export function emailAttemptNumber(ledger: RecipientLedger | null): number {
  const attempt = ledger?.emailAttempt;
  if (!attempt || attempt < 1) return 1;
  return attempt;
}

export function pushAttemptNumber(ledger: RecipientLedger | null): number {
  const attempt = ledger?.pushAttempt;
  if (!attempt || attempt < 1) return 1;
  return attempt;
}

export function ledgerAfterEmail(
  ledger: RecipientLedger | null,
  status: 'accepted' | 'failed' | 'suppressed' | 'unconfirmed',
): RecipientLedger {
  const current = ledger ?? emptyLedger();
  const attempt = emailAttemptNumber(current);
  return {
    ...current,
    email: status,
    emailAttempt: status === 'failed' || status === 'suppressed' ? attempt + 1 : attempt,
  };
}

export function ledgerAfterPush(
  ledger: RecipientLedger | null,
  status: 'offered' | 'failed' | 'no_token',
): RecipientLedger {
  const current = ledger ?? emptyLedger();
  const attempt = pushAttemptNumber(current);
  return {
    ...current,
    push: status,
    pushAttempt: status === 'failed' ? attempt + 1 : attempt,
  };
}

export function ledgerAfterInApp(ledger: RecipientLedger | null): RecipientLedger {
  return { ...(ledger ?? emptyLedger()), inApp: true };
}

export function broadcastLedgerId(campaignId: string, userId: string): string {
  const campaign = campaignId.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 80);
  const user = userId.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 80);
  return `abr:${campaign}:${user}`;
}

export function broadcastNotificationId(campaignId: string, userId: string): string {
  const campaign = campaignId.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 80);
  const user = userId.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 80);
  return `abn:${campaign}:${user}`;
}

export function parseRecipientLedger(meta: unknown): RecipientLedger | null {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const record = meta as Record<string, unknown>;
  if (record.kind !== 'admin_broadcast_recipient') return null;
  const email = record.email;
  const push = record.push;
  const emailAttempt = typeof record.emailAttempt === 'number' ? record.emailAttempt : 1;
  const pushAttempt = typeof record.pushAttempt === 'number' ? record.pushAttempt : 1;
  return {
    inApp: record.inApp === true,
    email:
      email === 'accepted' || email === 'failed' || email === 'suppressed' || email === 'unconfirmed'
        ? email
        : null,
    emailAttempt: emailAttempt >= 1 ? emailAttempt : 1,
    push: push === 'offered' || push === 'failed' || push === 'no_token' ? push : null,
    pushAttempt: pushAttempt >= 1 ? pushAttempt : 1,
  };
}

export function ledgerMeta(ledger: RecipientLedger): Prisma.InputJsonValue {
  return {
    kind: 'admin_broadcast_recipient',
    inApp: ledger.inApp,
    email: ledger.email,
    emailAttempt: ledger.emailAttempt,
    push: ledger.push,
    pushAttempt: ledger.pushAttempt,
  };
}

const inFlight = new Set<string>();

export function claimBroadcastFlight(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

export function releaseBroadcastFlight(key: string): void {
  inFlight.delete(key);
}

export function __resetBroadcastFlightForTests(): void {
  inFlight.clear();
}

export type BroadcastSendCounts = {
  notificationsCreated: number;
  notificationsSkipped: number;
  pushOffered: number;
  pushFailed: number;
  pushSkipped: number;
  pushNoToken: number;
  emailsAccepted: number;
  emailsFailed: number;
  emailsSuppressed: number;
  emailsUnconfirmed: number;
  emailsSkipped: number;
  emailRequested: boolean;
  pushRequested: boolean;
  inAppRequested: boolean;
};

export type BroadcastOutcome = 'sent' | 'partial' | 'failed' | 'already_sent';

export function formatBroadcastResult(counts: BroadcastSendCounts): {
  success: boolean;
  outcome: BroadcastOutcome;
  lines: string[];
  message: string;
  httpStatus: number;
} {
  const lines: string[] = [];
  if (counts.inAppRequested) {
    lines.push(
      counts.notificationsCreated > 0
        ? `In-app: ${counts.notificationsCreated} melding(en) aangemaakt.`
        : 'In-app: geen nieuwe melding aangemaakt.',
    );
    if (counts.notificationsSkipped > 0) {
      lines.push(
        `In-app: ${counts.notificationsSkipped} ontvanger(s) hadden deze melding al en zijn niet opnieuw aangeschreven.`,
      );
    }
  } else {
    lines.push('In-app: niet gekozen.');
  }

  if (counts.pushRequested) {
    lines.push(
      `Push: ${counts.pushOffered} aangeboden aan de pushdienst, ${counts.pushFailed} mislukt, ${counts.pushNoToken} zonder geschikt apparaat. Aflevering op het toestel is niet bevestigd.`,
    );
    if (counts.pushSkipped > 0) {
      lines.push(
        `Push: ${counts.pushSkipped} ontvanger(s) waren al aangeboden en zijn niet opnieuw aangeschreven.`,
      );
    }
  } else {
    lines.push('Push: niet gekozen.');
  }

  if (counts.emailRequested) {
    lines.push(
      `E-mail: ${counts.emailsAccepted} geaccepteerd door de maildienst, ${counts.emailsFailed} geweigerd, ${counts.emailsSuppressed} niet aangeboden. Acceptatie is geen afleverbevestiging.`,
    );
    if (counts.emailsSkipped > 0) {
      lines.push(
        `E-mail: ${counts.emailsSkipped} ontvanger(s) waren al geaccepteerd en zijn niet opnieuw aangeschreven.`,
      );
    }
    if (counts.emailsUnconfirmed > 0) {
      lines.push(
        `E-mail: ${counts.emailsUnconfirmed} eerdere poging(en) zijn niet opnieuw verstuurd omdat de maildienst de acceptatie niet heeft bevestigd.`,
      );
    }
  } else {
    lines.push('E-mail: niet gekozen.');
  }

  const newWork =
    counts.notificationsCreated + counts.pushOffered + counts.emailsAccepted;
  const problems =
    counts.pushFailed +
    counts.emailsFailed +
    counts.emailsSuppressed +
    counts.emailsUnconfirmed;
  const skipped =
    counts.notificationsSkipped + counts.pushSkipped + counts.emailsSkipped;
  const requested =
    (counts.inAppRequested ? 1 : 0) +
    (counts.pushRequested ? 1 : 0) +
    (counts.emailRequested ? 1 : 0);

  let outcome: BroadcastOutcome = 'failed';
  if (newWork === 0 && problems === 0 && skipped > 0) outcome = 'already_sent';
  else if (newWork > 0 && problems === 0) outcome = 'sent';
  else if (newWork > 0 && problems > 0) outcome = 'partial';
  else if (newWork === 0 && problems > 0) outcome = 'failed';
  else if (requested === 0) outcome = 'failed';

  if (outcome === 'partial') lines.push('Gedeeltelijk gelukt. Ontvangers die het bericht al kregen, zijn overgeslagen.');
  if (outcome === 'already_sent') {
    lines.push('Geen nieuwe berichten. Een herhaling heeft niemand opnieuw aangeschreven.');
  }
  if (outcome === 'failed' && lines.length > 0) {
    lines.push('Niets is als geaccepteerd of aangemaakt bevestigd.');
  }

  const message = lines.filter((line) => line.trim().length > 0).join('\n');
  const safeLines = message.split('\n').filter((line) => line.trim().length > 0);
  const httpStatus = outcome === 'failed' ? 502 : 200;
  return {
    success: outcome === 'sent',
    outcome,
    lines: safeLines.length > 0 ? safeLines : ['De verzending gaf geen leesbare uitslag.'],
    message: message.trim() || 'De verzending gaf geen leesbare uitslag.',
    httpStatus,
  };
}
