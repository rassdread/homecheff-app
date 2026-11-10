import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeAdminBroadcastRoute } from '@/lib/admin/sanitize-admin-broadcast-route';
import { sendAdminBroadcastFcmByUser } from '@/lib/admin/admin-broadcast-fcm';
import { evaluateAdminEmailBlast } from '@/lib/email/admin-blast-guard';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { EMAIL_PRIORITY } from '@/lib/email/priority';
import { getTransactionalFrom } from '@/lib/email-from';
import { renderAdminBulkMessage } from '@/lib/email/admin-bulk-message-content';
import {
  UNAVAILABLE_AUDIENCE_FACTS,
  agreementState,
  agreementStateLabel,
  audienceRoleLabels,
  describeSelection,
  checkedRecipients,
  emptySelection,
  inclusionReasons,
  matchesAudience,
  selectionCanList,
  payoutConnectStatus,
  payoutConnectStatusLabel,
  parseAudienceSelection,
  previewCanonicalPayload,
  type AudienceCandidate,
  type AudienceId,
  type AudienceSelection,
} from '@/lib/admin/notification-audience';
import { loadActiveAdminsByIds, loadAudienceCandidates } from '@/lib/admin/load-notification-audience';
import {
  activeStaffRejection,
  adminChannelLines,
  mergeBroadcastRecipients,
  narrowManualAdmins,
  parseManualAdmins,
  relevantContentDecisions,
  type BroadcastChannelPlan,
} from '@/lib/admin/notification-admin-selection';
import {
  decideContentDeliveries,
  findPriorDeliveries,
  recordBroadcastCampaign,
  recordPriorDelivery,
  shouldSendChannel,
} from '@/lib/admin/load-broadcast-history';
import { alreadySentLabel, duplicatePlanLines, type DeliveryChannel } from '@/lib/admin/broadcast-history';
import {
  broadcastLedgerId,
  broadcastNotificationId,
  claimBroadcastFlight,
  emailAttemptNumber,
  emailLedgerStatus,
  formatBroadcastResult,
  ledgerAfterEmail,
  ledgerAfterInApp,
  ledgerAfterPush,
  ledgerMeta,
  parseRecipientLedger,
  planEmail,
  planInApp,
  planPush,
  releaseBroadcastFlight,
  type RecipientLedger,
} from '@/lib/admin/broadcast-delivery-plan';

export const dynamic = 'force-dynamic';

const MAX_RECIPIENTS = 5000;
const EMAIL_BATCH_SIZE = 25;
const EMAIL_BATCH_PAUSE_MS = 600;

function campaignKeyFrom(req: NextRequest, body: { idempotencyKey?: unknown } | null): string {
  const header = req.headers.get('idempotency-key')?.trim() || '';
  const raw = header || (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '');
  if (!/^[0-9a-zA-Z_-]{8,80}$/.test(raw)) return '';
  return raw;
}

function selectionFromBody(body: Record<string, unknown>): { ok: true; selection: AudienceSelection } | { ok: false; error: string } {
  if (body.selection != null) return parseAudienceSelection(body.selection);
  const targetType = typeof body.targetType === 'string' ? body.targetType.trim() : '';
  const legacy: Record<string, AudienceId> = {
    all: 'all',
    sellers: 'sellers',
    buyers: 'buyers',
    delivery: 'delivery',
  };
  const audience = legacy[targetType];
  if (!audience) {
    return { ok: false, error: 'Kies eerst een doelgroep. Een lege of onbekende selectie kan niet worden verstuurd.' };
  }
  return { ok: true, selection: emptySelection(audience) };
}

function recipientView(user: AudienceCandidate, selection: AudienceSelection) {
  const created = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
  return {
    id: user.id,
    name: user.name || user.username || 'Gebruiker',
    email: user.email,
    roles: audienceRoleLabels(user),
    connectLabel: payoutConnectStatusLabel(payoutConnectStatus(user)),
    agreementLabel: agreementStateLabel(agreementState(user)),
    reasons: inclusionReasons(user, selection),
    registeredAt: Number.isNaN(created.getTime()) ? null : created.toISOString(),
  };
}

function previewTokenFor(input: Parameters<typeof previewCanonicalPayload>[0]): string {
  return createHash('sha256').update(previewCanonicalPayload(input)).digest('hex');
}

function stampChannels(ledger: RecipientLedger, plan: BroadcastChannelPlan | undefined): RecipientLedger {
  if (!plan) return ledger;
  return { ...ledger, channels: { email: plan.email, push: plan.push, inApp: plan.inApp } };
}

async function readLedgers(campaignId: string, userIds: string[]): Promise<Map<string, RecipientLedger>> {
  const map = new Map<string, RecipientLedger>();
  for (let i = 0; i < userIds.length; i += 500) {
    const slice = userIds.slice(i, i + 500);
    const rows = await prisma.auditLog.findMany({
      where: { id: { in: slice.map((userId) => broadcastLedgerId(campaignId, userId)) } },
      select: { id: true, meta: true },
    });
    for (const row of rows) {
      const ledger = parseRecipientLedger(row.meta);
      if (!ledger) continue;
      const userId = slice.find((id) => broadcastLedgerId(campaignId, id) === row.id);
      if (userId) map.set(userId, ledger);
    }
  }
  return map;
}

async function saveLedger(campaignId: string, userId: string, ledger: RecipientLedger): Promise<void> {
  const id = broadcastLedgerId(campaignId, userId);
  const meta = ledgerMeta(ledger);
  await prisma.auditLog.upsert({
    where: { id },
    create: {
      id,
      userId,
      action: 'admin_broadcast_recipient',
      meta,
    },
    update: { meta },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Je bent niet aangemeld.', message: 'Je bent niet aangemeld.' },
        { status: 401 },
      );
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Alleen een beheerder kan dit bericht versturen.', message: 'Alleen een beheerder kan dit bericht versturen.' },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Het verzoek kon niet worden gelezen.', message: 'Het verzoek kon niet worden gelezen.' },
        { status: 400 },
      );
    }
    const record = body as Record<string, unknown>;
    const message = typeof record.message === 'string' ? record.message.trim() : '';
    const sendNotification = Boolean(record.sendNotification);
    const sendEmail = Boolean(record.sendEmail);
    const confirmEmailBlast = Boolean(record.confirmEmailBlast);
    const confirmRepeat = record.confirmRepeat === true;
    const dryRun = Boolean(record.dryRun);
    const subject = typeof record.subject === 'string' ? record.subject.trim() : '';
    const titleRaw = typeof record.title === 'string' ? record.title.trim() : '';
    const routeRaw = record.route;
    const campaignId = campaignKeyFrom(req, record);
    const listOnly = record.listOnly === true;

    const parsed = selectionFromBody(record);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error, message: parsed.error }, { status: 400 });
    }
    const selection = parsed.selection;
    const manualParsed = parseManualAdmins(record.manualAdmins);
    if (!manualParsed.ok) {
      return NextResponse.json(
        { error: manualParsed.error, message: manualParsed.error, lines: [manualParsed.error] },
        { status: 400 },
      );
    }
    const manualAdmins = narrowManualAdmins(manualParsed.admins, { sendEmail, sendNotification });
    if (!selectionCanList(selection) && (listOnly || manualAdmins.length === 0)) {
      const error = 'Alle toepasselijke rollen zonder statusfilter selecteert niemand. Kies een filter, of kies bewust Alle gebruikers.';
      return NextResponse.json({ error, message: error, lines: [error] }, { status: 400 });
    }

    if (!listOnly) {
      if (!message) {
        return NextResponse.json(
          { error: 'Vul een bericht in.', message: 'Vul een bericht in.' },
          { status: 400 },
        );
      }
      if (!sendNotification && !sendEmail) {
        return NextResponse.json(
          {
            error: 'Kies in-appmelding of e-mail. Een lege verzendmethode is geblokkeerd.',
            message: 'Kies in-appmelding of e-mail. Een lege verzendmethode is geblokkeerd.',
          },
          { status: 400 },
        );
      }
      if (sendEmail && !subject) {
        return NextResponse.json(
          { error: 'Vul een onderwerp in voor de e-mail.', message: 'Vul een onderwerp in voor de e-mail.' },
          { status: 400 },
        );
      }
    }

    const candidates = selectionCanList(selection) ? await loadAudienceCandidates(prisma, selection) : [];
    const matched = candidates.filter((user) => matchesAudience(user, selection));
    if (matched.length > MAX_RECIPIENTS) {
      const error = `Te veel ontvangers (${matched.length}). Het maximum per actie is ${MAX_RECIPIENTS}.`;
      return NextResponse.json({ error, message: error }, { status: 400 });
    }

    if (listOnly) {
      const listed = `${matched.length} gebruikers voldoen aan de filters. Vink aan wie het bericht krijgt.`;
      const empty = 'Geen gebruikers voor deze filters.';
      const priors = message
        ? await findPriorDeliveries(prisma, matched.map((user) => user.id), {
            title: titleRaw,
            subject,
            message,
            channels: ['inApp', 'push', 'email'],
          })
        : [];
      const content = message
        ? decideContentDeliveries({
            userIds: matched.map((user) => user.id),
            channels: ['inApp', 'push', 'email'],
            priors,
            confirmRepeat: false,
          })
        : { decisions: [], lines: [] };
      return NextResponse.json({
        listOnly: true,
        total: matched.length,
        recipients: matched.map((user) => ({
          ...recipientView(user, selection),
          alreadySent: content.decisions
            .filter((decision) => decision.userId === user.id && decision.action === 'skip' && decision.at)
            .map((decision) => ({
              channel: decision.channel,
              at: decision.at,
              label: alreadySentLabel(decision.channel, decision.at || ''),
            })),
        })),
        message: matched.length === 0 ? empty : listed,
        lines: [matched.length === 0 ? empty : listed],
      });
    }

    const includeUserIds = Array.isArray(record.includeUserIds) ? record.includeUserIds : [];
    if (includeUserIds.length + manualAdmins.length > MAX_RECIPIENTS) {
      const error = `Te veel aangevinkte ontvangers. Het maximum per actie is ${MAX_RECIPIENTS}.`;
      return NextResponse.json({ error, message: error, lines: [error] }, { status: 400 });
    }
    const requestedIds = includeUserIds.filter((id): id is string => typeof id === 'string');
    const checked = requestedIds.length === 0
      ? { ok: true as const, recipients: [] as AudienceCandidate[] }
      : checkedRecipients(matched, requestedIds);
    if (!checked.ok) {
      return NextResponse.json(
        { error: checked.error, message: checked.error, lines: [checked.error], code: checked.code === 'outside' ? 'PREVIEW_STALE' : 'NONE_CHECKED' },
        { status: checked.code === 'outside' ? 409 : 400 },
      );
    }
    const manualUsers = await loadActiveAdminsByIds(prisma, manualAdmins.map((admin) => admin.userId));
    const manualById = new Map(manualUsers.map((user) => [user.id, user]));
    for (const admin of manualAdmins) {
      const rejection = activeStaffRejection(manualById.get(admin.userId) ?? null);
      if (rejection) {
        return NextResponse.json({ error: rejection, message: rejection, lines: [rejection] }, { status: 400 });
      }
    }
    const plans = mergeBroadcastRecipients({
      audienceUserIds: checked.recipients.map((user) => user.id),
      manual: manualAdmins,
      sendEmail,
      sendNotification,
    });
    if (plans.length === 0) {
      const error = 'Vink minstens één ontvanger aan of voeg een beheerder toe. Er is niets verstuurd.';
      return NextResponse.json({ error, message: error, lines: [error], code: 'NONE_CHECKED' }, { status: 400 });
    }
    if (plans.length > MAX_RECIPIENTS) {
      const error = `Te veel aangevinkte ontvangers. Het maximum per actie is ${MAX_RECIPIENTS}.`;
      return NextResponse.json({ error, message: error, lines: [error] }, { status: 400 });
    }
    const userById = new Map<string, AudienceCandidate>();
    for (const user of checked.recipients) userById.set(user.id, user);
    for (const user of manualUsers) {
      if (!userById.has(user.id)) userById.set(user.id, user);
    }
    const chosen = plans.flatMap((plan) => {
      const user = userById.get(plan.userId);
      return user ? [user] : [];
    });
    const planById = new Map(plans.map((plan) => [plan.userId, plan]));
    const wants = (userId: string, channel: 'email' | 'push' | 'inApp') => planById.get(userId)?.[channel] === true;

    const emailUsers = chosen.filter((user) => wants(user.id, 'email') && user.email);
    const blastGate = evaluateAdminEmailBlast({
      sendEmail: emailUsers.length > 0,
      emailRecipientCount: emailUsers.length,
      targetType: selection.audience === 'all' && chosen.length === matched.length && manualAdmins.length === 0 ? 'all' : 'custom',
      confirmEmailBlast,
      idempotencyKey: campaignId,
    });
    const safeRoute = sanitizeAdminBroadcastRoute(routeRaw);
    const pushTitle = titleRaw.length > 0 ? titleRaw.slice(0, 120) : 'HomeCheff';
    const requestedChannels: DeliveryChannel[] = [
      ...(plans.some((plan) => plan.inApp) ? (['inApp'] as DeliveryChannel[]) : []),
      ...(plans.some((plan) => plan.push) ? (['push'] as DeliveryChannel[]) : []),
      ...(plans.some((plan) => plan.email) ? (['email'] as DeliveryChannel[]) : []),
    ];
    const contentPriors = await findPriorDeliveries(prisma, chosen.map((user) => user.id), {
      title: pushTitle,
      subject,
      message,
      channels: requestedChannels,
    });
    const contentPlan = decideContentDeliveries({
      userIds: chosen.map((user) => user.id),
      channels: requestedChannels,
      priors: contentPriors,
      confirmRepeat,
    });
    const relevantDecisions = relevantContentDecisions(contentPlan.decisions, plans);
    const contentLines = duplicatePlanLines(relevantDecisions);
    const previewToken = previewTokenFor({
      selection,
      message,
      subject,
      title: pushTitle,
      route: safeRoute,
      sendNotification,
      sendEmail,
      confirmRepeat,
      recipientIds: chosen.map((user) => user.id),
      manualAdmins,
    });
    const summary = describeSelection(selection);
    const channels = {
      inApp: plans.filter((plan) => plan.inApp).length,
      push: plans.filter((plan) => plan.push && userById.get(plan.userId)?.pushReachable).length,
      email: emailUsers.length,
    };
    const previewRecipient = (user: AudienceCandidate) => {
      const plan = planById.get(user.id)!;
      const staff = user.role === 'ADMIN' || user.role === 'SUPERADMIN' || plan.source !== 'audience';
      const reasons = plan.source === 'manual'
        ? ['Handmatig toegevoegde beheerder, buiten de doelgroep']
        : plan.source === 'both'
          ? ['In de doelgroep en handmatig toegevoegd', ...inclusionReasons(user, selection)]
          : inclusionReasons(user, selection);
      return {
        ...recipientView(user, selection),
        reasons,
        channelLines: staff
          ? adminChannelLines({ plan, pushReachable: user.pushReachable, hasEmail: Boolean(user.email) })
          : [],
        alreadySent: relevantDecisions
          .filter((decision) => decision.userId === user.id && (decision.action === 'skip' || decision.action === 'repeat') && decision.at)
          .map((decision) => ({
            channel: decision.channel,
            at: decision.at,
            label: alreadySentLabel(decision.channel, decision.at || ''),
          })),
      };
    };

    if (dryRun) {
      const lines = [
        `Definitieve selectie: ${chosen.length} ontvanger(s), waarvan ${matched.length} binnen de filters. In-app ${channels.inApp}, push-bereikbaar ${channels.push}, e-mailadres ${channels.email}. Dezelfde persoon telt één keer per kanaal.`,
        ...summary,
        ...(manualAdmins.length > 0
          ? [`${manualAdmins.length} beheerder(s) handmatig toegevoegd. Kanalen worden samengevoegd als dezelfde persoon ook is aangevinkt.`]
          : []),
        ...contentLines,
      ];
      if (!blastGate.ok) lines.push(blastGate.error);
      return NextResponse.json({
        dryRun: true,
        previewToken: blastGate.ok || blastGate.code !== 'HARD_LIMIT' ? previewToken : null,
        summary,
        unavailable: UNAVAILABLE_AUDIENCE_FACTS,
        total: chosen.length,
        found: matched.length,
        channels,
        duplicateLines: contentLines,
        recipients: chosen.map(previewRecipient),
        requiresConfirm: blastGate.ok ? blastGate.requiresConfirm : blastGate.code === 'CONFIRM_REQUIRED',
        emailRecipientCount: emailUsers.length,
        gate: blastGate.ok ? 'ok' : blastGate.code,
        error: blastGate.ok ? undefined : blastGate.error,
        message: lines[0],
        lines,
      });
    }

    if (!blastGate.ok) {
      return NextResponse.json(
        {
          error: blastGate.error,
          message: blastGate.error,
          lines: [blastGate.error],
          code: blastGate.code,
          emailRecipientCount: blastGate.emailRecipientCount,
          softMax: blastGate.softMax,
          hardMax: blastGate.hardMax,
          requiresConfirm: true,
        },
        { status: 400 },
      );
    }
    if (!campaignId) {
      const error = 'Idempotency-Key ontbreekt. Vernieuw het voorbeeld en verstuur opnieuw, zodat een herhaling niemand dubbel aanschrijft.';
      return NextResponse.json({ error, message: error, lines: [error] }, { status: 400 });
    }
    const providedPreview = typeof record.previewToken === 'string' ? record.previewToken : '';
    if (!providedPreview || providedPreview !== previewToken) {
      const error = 'De selectie is gewijzigd na het voorbeeld. Bekijk het voorbeeld opnieuw voordat je verstuurt.';
      return NextResponse.json({ error, message: error, lines: [error], code: 'PREVIEW_STALE' }, { status: 409 });
    }
    if (!claimBroadcastFlight(campaignId)) {
      const error = 'Deze verzending loopt al. Wacht op de uitslag voordat je het opnieuw probeert.';
      return NextResponse.json({ error, message: error, lines: [error] }, { status: 409 });
    }

    try {
      const sentAt = new Date().toISOString();
      await recordBroadcastCampaign(prisma, {
        campaignId,
        source: 'notifications',
        subject,
        title: pushTitle,
        message,
        audience: selection.audience,
        channels: {
          inApp: plans.some((plan) => plan.inApp),
          push: plans.some((plan) => plan.push),
          email: plans.some((plan) => plan.email),
        },
        at: sentAt,
      });
      const ledgers = await readLedgers(campaignId, chosen.map((user) => user.id));
      const payload = {
        title: pushTitle,
        body: message,
        message,
        from: 'Admin',
        timestamp: new Date().toISOString(),
        link: safeRoute,
        broadcastId: campaignId,
        data: { type: 'ADMIN_ANNOUNCEMENT', route: safeRoute },
      };

      let notificationsCreated = 0;
      let notificationsSkipped = 0;
      if (plans.some((plan) => plan.inApp)) {
        const pending = chosen.filter(
          (user) => wants(user.id, 'inApp') && planInApp(ledgers.get(user.id) ?? null) === 'send' && shouldSendChannel(relevantDecisions, user.id, 'inApp'),
        );
        notificationsSkipped = chosen.filter((user) => wants(user.id, 'inApp')).length - pending.length;
        if (pending.length > 0) {
          const created = await prisma.notification.createMany({
            data: pending.map((user) => ({
              id: broadcastNotificationId(campaignId, user.id),
              userId: user.id,
              type: 'ADMIN_NOTICE' as const,
              payload,
            })),
            skipDuplicates: true,
          });
          notificationsCreated = created.count;
          notificationsSkipped += pending.length - created.count;
          for (const user of pending) {
            const next = stampChannels(ledgerAfterInApp(ledgers.get(user.id) ?? null), planById.get(user.id));
            ledgers.set(user.id, next);
            await saveLedger(campaignId, user.id, next);
            await recordPriorDelivery(prisma, {
              userId: user.id,
              channel: 'inApp',
              status: 'created',
              at: sentAt,
              campaignId,
              title: pushTitle,
              subject,
              message,
            });
          }
        }
      }

      let pushOffered = 0;
      let pushFailed = 0;
      let pushSkipped = 0;
      let pushNoToken = 0;
      if (plans.some((plan) => plan.push)) {
        const pending = chosen.filter(
          (user) => wants(user.id, 'push') && planPush(ledgers.get(user.id) ?? null) === 'send' && shouldSendChannel(relevantDecisions, user.id, 'push'),
        );
        pushSkipped = chosen.filter((user) => wants(user.id, 'push')).length - pending.length;
        if (pending.length > 0) {
          const push = await sendAdminBroadcastFcmByUser({
            userIds: pending.map((user) => user.id),
            title: pushTitle,
            body: message.slice(0, 500),
            route: safeRoute,
            broadcastId: campaignId,
          });
          pushOffered = push.success;
          pushFailed = push.failures;
          for (const result of push.perUser) {
            const status = result.offered > 0 ? 'offered' : result.tokens === 0 ? 'no_token' : 'failed';
            if (status === 'no_token') pushNoToken += 1;
            const next = stampChannels(ledgerAfterPush(ledgers.get(result.userId) ?? null, status), planById.get(result.userId));
            ledgers.set(result.userId, next);
            await saveLedger(campaignId, result.userId, next);
            if (status === 'offered' || status === 'failed') {
              await recordPriorDelivery(prisma, {
                userId: result.userId,
                channel: 'push',
                status: status === 'offered' ? 'accepted' : 'failed',
                at: sentAt,
                campaignId,
                title: pushTitle,
                subject,
                message,
              });
            }
          }
        }
      }

      let emailsAccepted = 0;
      let emailsFailed = 0;
      let emailsSuppressed = 0;
      let emailsUnconfirmed = 0;
      let emailsSkipped = 0;
      if (plans.some((plan) => plan.email)) {
        const pending = emailUsers.filter(
          (user) => planEmail(ledgers.get(user.id) ?? null) === 'send' && shouldSendChannel(relevantDecisions, user.id, 'email'),
        );
        emailsSkipped = emailUsers.filter((user) => planEmail(ledgers.get(user.id) ?? null) === 'skip_done').length;
        emailsUnconfirmed = emailUsers.filter((user) => planEmail(ledgers.get(user.id) ?? null) === 'skip_unconfirmed').length;
        for (let i = 0; i < pending.length; i += EMAIL_BATCH_SIZE) {
          const batch = pending.slice(i, i + EMAIL_BATCH_SIZE);
          await Promise.all(
            batch.map(async (user) => {
              const attempt = emailAttemptNumber(ledgers.get(user.id) ?? null);
              const letter = renderAdminBulkMessage({
                recipientName: user.name || '',
                message,
              });
              const result = await sendTransactionalEmail({
                from: getTransactionalFrom(),
                to: [user.email!],
                subject,
                html: letter.html,
                text: letter.text,
                eventType: 'admin_broadcast',
                priority: EMAIL_PRIORITY.P2,
                route: 'admin/notifications/send',
                idempotencyKey: `admin-broadcast:${campaignId}:${user.id}:email:${attempt}`,
                businessEventId: campaignId,
              });
              const status = emailLedgerStatus(result);
              if (status === 'accepted') emailsAccepted += 1;
              else if (status === 'unconfirmed') emailsUnconfirmed += 1;
              else if (status === 'suppressed') emailsSuppressed += 1;
              else emailsFailed += 1;
              const next = stampChannels(ledgerAfterEmail(ledgers.get(user.id) ?? null, status), planById.get(user.id));
              ledgers.set(user.id, next);
              await saveLedger(campaignId, user.id, next);
              await recordPriorDelivery(prisma, {
                userId: user.id,
                channel: 'email',
                status: status === 'accepted' ? 'accepted' : status === 'unconfirmed' ? 'unconfirmed' : 'failed',
                at: sentAt,
                campaignId,
                title: pushTitle,
                subject,
                message,
              });
            }),
          );
          if (i + EMAIL_BATCH_SIZE < pending.length) {
            await new Promise((resolve) => setTimeout(resolve, EMAIL_BATCH_PAUSE_MS));
          }
        }
      }

      const report = formatBroadcastResult({
        notificationsCreated,
        notificationsSkipped,
        pushOffered,
        pushFailed,
        pushSkipped,
        pushNoToken,
        emailsAccepted,
        emailsFailed,
        emailsSuppressed,
        emailsUnconfirmed,
        emailsSkipped,
        emailRequested: plans.some((plan) => plan.email),
        pushRequested: plans.some((plan) => plan.push),
        inAppRequested: plans.some((plan) => plan.inApp),
      });

      console.info(
        '[admin_email_blast]',
        JSON.stringify({
          broadcastId: campaignId,
          audience: selection.audience,
          outcome: report.outcome,
          notificationsCreated,
          pushOffered,
          pushFailed,
          emailsAccepted,
          emailsFailed,
          adminEmail: session.user.email,
          ts: Date.now(),
        }),
      );

      return NextResponse.json(
        {
          success: report.success,
          outcome: report.outcome,
          message: report.message,
          lines: [...report.lines, ...contentLines],
          notificationsCreated,
          notificationsSkipped,
          pushOffered,
          pushFailed,
          pushSkipped,
          pushNoToken,
          emailsAccepted,
          emailsFailed,
          emailsSuppressed,
          emailsUnconfirmed,
          emailsSkipped,
          emailRequested: sendEmail,
          pushRequested: sendNotification,
        },
        { status: report.httpStatus },
      );
    } finally {
      releaseBroadcastFlight(campaignId);
    }
  } catch (error) {
    console.error(
      '[admin/notifications/send]',
      error instanceof Error ? error.message.slice(0, 200) : 'error',
    );
    const message = 'De verzending is op de server vastgelopen. Er is niet bevestigd dat het bericht is aangeboden.';
    return NextResponse.json({ error: message, message, lines: [message] }, { status: 500 });
  }
}

