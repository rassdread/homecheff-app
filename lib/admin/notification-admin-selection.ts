import { isReservedNonMailboxEmail } from '@/lib/admin/user-population';

/**
 * Admins can be checked inside a matching audience, or added beside it.
 * Push follows the existing send route: it also creates an in-app notice.
 * One person is counted once per channel.
 */

export type AdminChannel = 'email' | 'push';

export type ManualAdminInput = {
  userId: string;
  channels: AdminChannel[];
};

export type BroadcastChannelPlan = {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  source: 'audience' | 'manual' | 'both';
};

export type StaffAccountCheck = {
  role: string;
  email: string | null;
  accountDeletedAt: Date | string | null;
  suspendedAt: Date | string | null;
};

const MAX_MANUAL_ADMINS = 20;

function isAdminChannel(value: unknown): value is AdminChannel {
  return value === 'email' || value === 'push';
}

export function parseManualAdmins(
  value: unknown,
): { ok: true; admins: ManualAdminInput[] } | { ok: false; error: string } {
  if (value == null) return { ok: true, admins: [] };
  if (!Array.isArray(value)) {
    return { ok: false, error: 'De handmatige beheerdersselectie is ongeldig.' };
  }
  if (value.length > MAX_MANUAL_ADMINS) {
    return { ok: false, error: 'Er zijn te veel handmatig toegevoegde beheerders.' };
  }
  const byId = new Map<string, Set<AdminChannel>>();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, error: 'De handmatige beheerdersselectie is ongeldig.' };
    }
    const record = item as Record<string, unknown>;
    const userId = typeof record.userId === 'string' ? record.userId.trim() : '';
    if (!userId) {
      return { ok: false, error: 'Een handmatig toegevoegde beheerder heeft geen account.' };
    }
    if (!Array.isArray(record.channels) || record.channels.length === 0) {
      return { ok: false, error: 'Kies e-mail, push of beide voor de toegevoegde beheerder.' };
    }
    const channels = new Set<AdminChannel>();
    for (const channel of record.channels) {
      if (!isAdminChannel(channel)) {
        return { ok: false, error: 'Kies e-mail, push of beide voor de toegevoegde beheerder.' };
      }
      channels.add(channel);
    }
    const existing = byId.get(userId) ?? new Set<AdminChannel>();
    for (const channel of channels) existing.add(channel);
    byId.set(userId, existing);
  }
  return {
    ok: true,
    admins: [...byId].map(([userId, channels]) => ({
      userId,
      channels: [...channels].sort(),
    })),
  };
}

/** A switched-off send method drops that channel. An admin with no channel left is removed. */
export function narrowManualAdmins(
  admins: readonly ManualAdminInput[],
  send: { sendEmail: boolean; sendNotification: boolean },
): ManualAdminInput[] {
  return admins.flatMap((admin) => {
    const channels = admin.channels.filter((channel) => (channel === 'email' ? send.sendEmail : send.sendNotification));
    if (channels.length === 0) return [];
    return [{ userId: admin.userId, channels }];
  });
}

export function mergeBroadcastRecipients(input: {
  audienceUserIds: readonly string[];
  manual: readonly ManualAdminInput[];
  sendEmail: boolean;
  sendNotification: boolean;
}): BroadcastChannelPlan[] {
  const manual = narrowManualAdmins(input.manual, input);
  const manualById = new Map(manual.map((admin) => [admin.userId, admin]));
  const seen = new Set<string>();
  const plans: BroadcastChannelPlan[] = [];
  for (const userId of input.audienceUserIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);
    const extra = manualById.get(userId);
    const push = input.sendNotification || Boolean(extra?.channels.includes('push'));
    plans.push({
      userId,
      email: input.sendEmail || Boolean(extra?.channels.includes('email')),
      push,
      inApp: push,
      source: extra ? 'both' : 'audience',
    });
  }
  for (const admin of manual) {
    if (seen.has(admin.userId)) continue;
    seen.add(admin.userId);
    const push = admin.channels.includes('push');
    plans.push({
      userId: admin.userId,
      email: admin.channels.includes('email'),
      push,
      inApp: push,
      source: 'manual',
    });
  }
  return plans;
}

export function activeStaffRejection(user: StaffAccountCheck | null): string | null {
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return 'Een handmatig toegevoegde ontvanger is geen actief beheerdersaccount.';
  }
  if (user.accountDeletedAt || user.suspendedAt) {
    return 'Een handmatig toegevoegde ontvanger is geen actief beheerdersaccount.';
  }
  if (isReservedNonMailboxEmail(user.email)) {
    return 'Test- en systeemaccounts blijven uitgesloten.';
  }
  return null;
}

export function adminChannelLines(input: {
  plan: Pick<BroadcastChannelPlan, 'email' | 'push' | 'inApp'>;
  pushReachable: boolean;
  hasEmail: boolean;
}): string[] {
  const lines: string[] = [];
  if (input.plan.email) {
    lines.push(
      input.hasEmail
        ? 'E-mail: zelfde onderwerp, tekst en HomeCheff-opmaak.'
        : 'E-mail: geen e-mailadres.',
    );
  }
  if (input.plan.push) {
    lines.push(
      input.pushReachable
        ? 'Push: zelfde titel, tekst en interne bestemming.'
        : 'Push: geen geldig pushapparaat geregistreerd.',
    );
  }
  if (input.plan.inApp) {
    lines.push('In-appmelding: wordt aangemaakt samen met push.');
  }
  return lines;
}

export function relevantContentDecisions<T extends { userId: string; channel: 'inApp' | 'push' | 'email' }>(
  decisions: readonly T[],
  plans: readonly BroadcastChannelPlan[],
): T[] {
  const byId = new Map(plans.map((plan) => [plan.userId, plan]));
  return decisions.filter((decision) => {
    const plan = byId.get(decision.userId);
    if (!plan) return false;
    if (decision.channel === 'email') return plan.email;
    if (decision.channel === 'push') return plan.push;
    return plan.inApp;
  });
}
