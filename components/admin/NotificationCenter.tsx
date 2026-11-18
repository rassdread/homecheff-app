'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Users, Mail, Bell, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { AdminEmailPreview } from './AdminEmailPreview';
import { adminEmailActionForRoute } from '@/lib/email/admin-bulk-message-content';
import { NotificationHistory } from './NotificationHistory';
import { chosenRecipients, sendBlockReason } from '@/lib/admin/notification-compose-state';
import {
  AUDIENCE_PRESETS,
  DELIVERY_AGREEMENT_VERSION,
  UNAVAILABLE_AUDIENCE_FACTS,
  agreementVersionLabel,
  selectionCanList,
  selectionFilterChips,
  selectionPlainSummary,
  stripeChoiceLabel,
  type AccountStatusFilter,
  type AudienceId,
  type AudienceSelection,
  type PendingStepId,
  type SelectionFilterChip,
  type StripeAudienceFilter,
  type VerificationKind,
  type VerificationStatus,
} from '@/lib/admin/notification-audience';

type PreviewRecipient = {
  id: string;
  name: string;
  email: string | null;
  roles: string[];
  connectLabel: string;
  agreementLabel: string;
  stripeStatus?: string;
  pushReachable?: boolean;
  requiresExplicitCheck?: boolean;
  reasons?: string[];
  registeredAt: string | null;
  alreadySent?: Array<{ channel: string; at: string; label: string }>;
  channelLines?: string[];
};

type AddedAdmin = {
  id: string;
  name: string;
  email: string | null;
  channels: Array<'email' | 'push'>;
};

type AdminHit = {
  id: string;
  name: string;
  email: string | null;
  role: string;
};

type PreviewPayload = {
  previewToken: string | null;
  summary: string[];
  total: number;
  found: number;
  proof?: { unique: number; fromFilters: number; manualOnly: number; both: number; line: string };
  channels: { inApp: number; push: number; email: number };
  recipients: PreviewRecipient[];
  requiresConfirm: boolean;
  lines: string[];
  error?: string;
};

type ScreenNotice = {
  tone: 'success' | 'partial' | 'error';
  lines: string[];
};

const FALLBACK = 'De server gaf geen leesbare uitslag. Er is niet bevestigd dat het bericht is aangeboden.';
const RECIPIENT_PAGE_SIZE = 10;

function readRecipients(value: unknown): PreviewRecipient[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string') return [];
    return [{
      id: row.id,
      name: row.name,
      email: typeof row.email === 'string' ? row.email : null,
      roles: Array.isArray(row.roles) ? row.roles.filter((role): role is string => typeof role === 'string') : [],
      connectLabel: typeof row.connectLabel === 'string' ? row.connectLabel : '',
      agreementLabel: typeof row.agreementLabel === 'string' ? row.agreementLabel : '',
      stripeStatus: typeof row.stripeStatus === 'string' ? row.stripeStatus : '',
      pushReachable: row.pushReachable === true,
      requiresExplicitCheck: row.requiresExplicitCheck === true,
      reasons: Array.isArray(row.reasons) ? row.reasons.filter((reason): reason is string => typeof reason === 'string') : [],
      registeredAt: typeof row.registeredAt === 'string' ? row.registeredAt : null,
      alreadySent: Array.isArray(row.alreadySent)
        ? row.alreadySent.flatMap((item) => {
            if (!item || typeof item !== 'object') return [];
            const prior = item as Record<string, unknown>;
            if (typeof prior.label !== 'string' || typeof prior.at !== 'string') return [];
            return [{ channel: typeof prior.channel === 'string' ? prior.channel : '', at: prior.at, label: prior.label }];
          })
        : [],
      channelLines: Array.isArray(row.channelLines)
        ? row.channelLines.filter((line): line is string => typeof line === 'string' && line.trim().length > 0)
        : [],
    }];
  });
}

function linesFrom(data: unknown, status: number): ScreenNotice {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const rawLines = Array.isArray(record?.lines) ? record.lines : [];
  const lines = rawLines
    .filter((line): line is string => typeof line === 'string')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const message = typeof record?.message === 'string' ? record.message.trim() : '';
  const error = typeof record?.error === 'string' ? record.error.trim() : '';
  const visible = lines.length > 0 ? lines : message ? message.split('\n').map((line) => line.trim()).filter(Boolean) : error ? [error] : [FALLBACK];
  const outcome = record?.outcome;
  if (status >= 200 && status < 300 && outcome === 'sent') return { tone: 'success', lines: visible };
  if (status >= 200 && status < 300 && (outcome === 'partial' || outcome === 'already_sent')) {
    return { tone: 'partial', lines: visible };
  }
  return { tone: 'error', lines: visible.length > 0 ? visible : [FALLBACK] };
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [pushTitle, setPushTitle] = useState('');
  const [linkPreset, setLinkPreset] = useState('/notifications');
  const [subject, setSubject] = useState('');
  const [audience, setAudience] = useState<AudienceId>('applicable');
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const [stripe, setStripe] = useState<StripeAudienceFilter | ''>('');
  const [verificationKind, setVerificationKind] = useState<VerificationKind | ''>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>('');
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatusFilter | ''>('');
  const [pendingStep, setPendingStep] = useState<PendingStepId | ''>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [explicitReviewIds, setExplicitReviewIds] = useState<string[]>([]);
  const [stripeNotes, setStripeNotes] = useState<string[]>([]);
  const [directory, setDirectory] = useState<PreviewRecipient[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const [recipientPage, setRecipientPage] = useState(0);
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [confirmEmailBlast, setConfirmEmailBlast] = useState(false);
  const [confirmRepeat, setConfirmRepeat] = useState(false);
  const [screen, setScreen] = useState<'compose' | 'history'>('compose');
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [previewStale, setPreviewStale] = useState(false);
  const [selectionDropped, setSelectionDropped] = useState<string | null>(null);
  const [selectionExpanded, setSelectionExpanded] = useState(false);
  const [attemptedSend, setAttemptedSend] = useState(false);
  const [notice, setNotice] = useState<ScreenNotice | null>(null);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [addedAdmins, setAddedAdmins] = useState<AddedAdmin[]>([]);
  const [adminQuery, setAdminQuery] = useState('');
  const [adminHits, setAdminHits] = useState<AdminHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const submitLockRef = useRef(false);
  const contentKeyRef = useRef<{ hash: string; key: string } | null>(null);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const selection = (): AudienceSelection => {
    return {
      audience,
      match: matchMode,
      stripe: stripe || null,
      verification:
        verificationKind && verificationStatus
          ? { kind: verificationKind, status: verificationStatus }
          : null,
      agreementVersion: agreementOpen ? DELIVERY_AGREEMENT_VERSION : null,
      accountStatus: accountStatus || null,
      pendingStep: pendingStep || null,
      excludeUserIds: [],
    };
  };

  const listable = selectionCanList(selection());

  useEffect(() => {
    if (!listable) {
      const dropped = selectedIdsRef.current.length;
      if (dropped > 0) {
        setSelectionDropped(`${dropped} aangevinkte persoon of personen zijn uit de selectie gehaald. Deze doelgroep zonder filter selecteert niemand. Handmatig toegevoegde beheerders blijven staan.`);
      }
      setDirectory((current) => (current.length === 0 ? current : []));
      setListError(null);
      setListLoading(false);
      setSelectedIds((current) => (current.length === 0 ? current : []));
      setExplicitReviewIds((current) => (current.length === 0 ? current : []));
      setStripeNotes((current) => (current.length === 0 ? current : []));
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(() => {
    const body = {
      listOnly: true,
      selection: {
        audience,
        match: matchMode,
        stripe: stripe || null,
        verification:
          verificationKind && verificationStatus
            ? { kind: verificationKind, status: verificationStatus }
            : null,
        agreementVersion: agreementOpen ? DELIVERY_AGREEMENT_VERSION : null,
        accountStatus: accountStatus || null,
        pendingStep: pendingStep || null,
        excludeUserIds: [],
      },
    };
    setListLoading(true);
    setListError(null);
    fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (!response.ok || !data?.listOnly) {
          const text = typeof data?.message === 'string' ? data.message : 'De ontvangerslijst kon niet worden geladen.';
          setListError(text);
          return;
        }
        const recipients = readRecipients(data.recipients);
        const ids = new Set(recipients.map((recipient) => recipient.id));
        setDirectory(recipients);
        setSelectedIds((current) => {
          const next = current.filter((id) => ids.has(id));
          const dropped = current.length - next.length;
          if (dropped > 0) {
            setSelectionDropped(`${dropped} aangevinkte persoon of personen vallen buiten de nieuwe filters en gaan niet mee. Handmatig toegevoegde beheerders blijven staan.`);
          }
          return next;
        });
        setExplicitReviewIds((current) => current.filter((id) => (
          ids.has(id) && recipients.some((recipient) => recipient.id === id && recipient.requiresExplicitCheck)
        )));
        setStripeNotes(
          Array.isArray(data.stripeCountLines)
            ? data.stripeCountLines.filter((line: unknown): line is string => typeof line === 'string' && line.trim().length > 0)
            : [],
        );
        setRecipientPage(0);
        setListError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setListError('De ontvangerslijst kon niet worden geladen. De selectie en de tekst blijven staan.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });
    }, 400);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [
    audience,
    matchMode,
    stripe,
    verificationKind,
    verificationStatus,
    agreementOpen,
    accountStatus,
    pendingStep,
    listVersion,
    listable,
  ]);

  useEffect(() => {
    setAddedAdmins((current) => {
      let changed = false;
      const next = current.flatMap((admin) => {
        const channels = admin.channels.filter((channel) => (channel === 'email' ? sendEmail : sendNotification));
        if (channels.length !== admin.channels.length) changed = true;
        if (channels.length === 0) return [];
        return [{ ...admin, channels }];
      });
      return changed ? next : current;
    });
  }, [sendEmail, sendNotification]);

  useEffect(() => {
    if (!sendEmail && !sendNotification) {
      setAdminHits([]);
      return;
    }
    const query = adminQuery.trim();
    if (query.length < 2) {
      setAdminHits([]);
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(() => {
      fetch(`/api/admin/notifications/admins?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await response.json().catch(() => null);
          if (controller.signal.aborted) return;
          const rows = Array.isArray(data?.admins) ? data.admins : [];
          setAdminHits(
            rows.flatMap((item: unknown) => {
              if (!item || typeof item !== 'object') return [];
              const row = item as Record<string, unknown>;
              if (typeof row.id !== 'string' || typeof row.name !== 'string') return [];
              return [{
                id: row.id,
                name: row.name,
                email: typeof row.email === 'string' ? row.email : null,
                role: typeof row.role === 'string' ? row.role : 'Beheerder',
              }];
            }),
          );
        })
        .catch(() => {
          if (!controller.signal.aborted) setAdminHits([]);
        });
    }, 300);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [adminQuery, sendEmail, sendNotification]);

  const clearPreview = () => {
    setPreview((current) => {
      if (current) setPreviewStale(true);
      return null;
    });
  };

  const invalidatePreview = () => {
    clearPreview();
    setConfirmEmailBlast(false);
    setConfirmRepeat(false);
  };

  const campaignKey = () => {
    const hash = `${message.trim()}\n${subject.trim()}\n${pushTitle.trim()}\n${linkPreset}`;
    if (!contentKeyRef.current || contentKeyRef.current.hash !== hash) {
      contentKeyRef.current = {
        hash,
        key: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `admin-blast-${Date.now()}`,
      };
    }
    return contentKeyRef.current.key;
  };

  const payload = (dryRun: boolean) => {
    const current = selection();
    return {
      message: message.trim(),
      subject: subject.trim(),
      title: pushTitle.trim() || undefined,
      route: linkPreset,
      selection: current,
      includeUserIds: selectedIds,
      explicitReviewUserIds: explicitReviewIds.filter((id) => selectedIds.includes(id)),
      manualAdmins: addedAdmins.map((admin) => ({ userId: admin.id, channels: admin.channels })),
      sendNotification,
      sendEmail,
      confirmEmailBlast: sendEmail ? confirmEmailBlast : false,
      confirmRepeat,
      dryRun,
      previewToken: dryRun ? undefined : preview?.previewToken,
      idempotencyKey: campaignKey(),
    };
  };

  const loadPreview = async () => {
    setAttemptedSend(true);
    setNotice(null);
    if (!selectionCanList(selection()) && addedAdmins.length === 0) {
      setNotice({ tone: 'error', lines: ['Alle toepasselijke rollen zonder statusfilter selecteert niemand. Kies een filter, of kies bewust Alle gebruikers.'] });
      return;
    }
    if (selectedIds.length === 0 && addedAdmins.length === 0) {
      setNotice({ tone: 'error', lines: ['Vink minstens één ontvanger aan of voeg een beheerder toe. Er is niets verstuurd.'] });
      return;
    }
    if (!message.trim()) {
      setNotice({ tone: 'error', lines: ['Vul een bericht in.'] });
      return;
    }
    if (!sendNotification && !sendEmail) {
      setNotice({ tone: 'error', lines: [t('admin.notificationCenter.selectDeliveryMethod')] });
      return;
    }
    if (sendEmail && !subject.trim()) {
      setNotice({ tone: 'error', lines: [t('admin.notificationCenter.enterEmailSubject')] });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': campaignKey() },
        body: JSON.stringify(payload(true)),
      });
      const data = await response.json().catch(() => null);
      const parsed = linesFrom(data, response.status);
      if (!response.ok || !data || data.previewToken == null) {
        clearPreview();
        setNotice(parsed);
        return;
      }
      setPreviewStale(false);
      setPreview({
        previewToken: data.previewToken,
        summary: Array.isArray(data.summary) ? data.summary : [],
        total: typeof data.total === 'number' ? data.total : 0,
        found: typeof data.found === 'number' ? data.found : directory.length,
        proof: data.proof && typeof data.proof === 'object' ? data.proof : undefined,
        channels: data.channels || { inApp: 0, push: 0, email: 0 },
        recipients: readRecipients(data.recipients),
        requiresConfirm: Boolean(data.requiresConfirm),
        lines: parsed.lines,
        error: typeof data.error === 'string' ? data.error : undefined,
      });
      setNotice(null);
    } catch {
      clearPreview();
      setNotice({ tone: 'error', lines: ['Het voorbeeld kon niet worden opgehaald. Er is niets verstuurd. De tekst en de ontvangers blijven staan.'] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    setAttemptedSend(true);
    if (submitLockRef.current || isLoading) return;
    if (selectedIds.length === 0 && addedAdmins.length === 0) {
      setNotice({ tone: 'error', lines: ['Vink minstens één ontvanger aan of voeg een beheerder toe. Er is niets verstuurd.'] });
      return;
    }
    if (!preview?.previewToken) {
      setNotice({ tone: 'error', lines: ['Bekijk eerst het voorbeeld. Verzenden blijft geblokkeerd tot het voorbeeld klopt.'] });
      return;
    }
    if (preview.total === 0) {
      setNotice({ tone: 'error', lines: ['Geen ontvangers voor deze selectie. Er is niets verstuurd.'] });
      return;
    }
    setIsLoading(true);
    submitLockRef.current = true;
    setNotice(null);
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': campaignKey() },
        body: JSON.stringify(payload(false)),
      });
      const data = await response.json().catch(() => null);
      const parsed = linesFrom(data, response.status);
      setNotice(parsed);
      if (response.ok && data?.outcome === 'sent') {
        setAttemptedSend(false);
        setMessage('');
        setPushTitle('');
        setSubject('');
        setAddedAdmins([]);
        setAdminQuery('');
        setAdminHits([]);
        setPreview(null);
        setPreviewStale(false);
        setConfirmEmailBlast(false);
        setConfirmRepeat(false);
        contentKeyRef.current = null;
      }
      if (data?.code === 'PREVIEW_STALE') {
        clearPreview();
        setListVersion((current) => current + 1);
      }
    } catch {
      setNotice({
        tone: 'error',
        lines: ['De verzending is afgebroken voordat de server een uitslag gaf. Er is niet bevestigd dat het bericht is aangeboden.'],
      });
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  const applyPreset = (id: string) => {
    const preset = AUDIENCE_PRESETS.find((item) => item.id === id);
    if (!preset?.available || !preset.selection) {
      setNotice({ tone: 'error', lines: [preset?.reason || 'Deze selectie is niet beschikbaar.'] });
      return;
    }
    const next = preset.selection;
    setAudience(next.audience);
    setMatchMode(next.match);
    setStripe(next.stripe || '');
    setVerificationKind(next.verification?.kind || '');
    setVerificationStatus(next.verification?.status || '');
    setAgreementOpen(Boolean(next.agreementVersion));
    setAccountStatus(next.accountStatus || '');
    setPendingStep(next.pendingStep || '');
    clearPreview();
    setNotice(null);
  };

  const removeChip = (id: SelectionFilterChip['id']) => {
    if (id === 'stripe') setStripe('');
    if (id === 'verification') {
      setVerificationKind('');
      setVerificationStatus('');
    }
    if (id === 'agreement') setAgreementOpen(false);
    if (id === 'account') setAccountStatus('');
    if (id === 'pending') setPendingStep('');
    invalidatePreview();
  };

  const clearFilters = () => {
    setStripe('');
    setVerificationKind('');
    setVerificationStatus('');
    setAgreementOpen(false);
    setAccountStatus('');
    setPendingStep('');
    setMatchMode('all');
    clearPreview();
    setConfirmEmailBlast(false);
    setConfirmRepeat(false);
    setNotice(audience === 'all'
      ? { tone: 'success', lines: ['Filters gewist. De doelgroep blijft Alle gebruikers, omdat je die zelf hebt gekozen.'] }
      : null);
  };

  const changeChecked = (next: string[]) => {
    setSelectedIds(next);
    setSelectionDropped(null);
    clearPreview();
    setConfirmEmailBlast(false);
  };

  const query = recipientQuery.trim().toLowerCase();
  const searchHits = directory.filter((recipient) => {
    if (!query) return true;
    return [recipient.name, recipient.email || ''].join(' ').toLowerCase().includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(searchHits.length / RECIPIENT_PAGE_SIZE));
  const safePage = Math.min(recipientPage, pageCount - 1);
  const pageStart = safePage * RECIPIENT_PAGE_SIZE;
  const visibleRecipients = searchHits.slice(pageStart, pageStart + RECIPIENT_PAGE_SIZE);
  const selectedSet = new Set(selectedIds);
  const selectedCount = selectedIds.filter((id) => directory.some((recipient) => recipient.id === id)).length;
  const chosen = chosenRecipients({
    selectedIds,
    directory: directory.map((person) => ({ id: person.id, name: person.name, email: person.email })),
    manual: addedAdmins.map((admin) => ({ id: admin.id, name: admin.name, email: admin.email })),
  });
  const visibleChosen = selectionExpanded ? chosen : chosen.slice(0, 5);
  const sendBlock = sendBlockReason({
    message,
    sendNotification,
    sendEmail,
    subject,
    recipientCount: chosen.length,
    listable,
    hasPreview: Boolean(preview?.previewToken),
    previewTotal: preview?.previewToken ? preview.total : 0,
    previewStale,
    emailConfirmRequired: Boolean(preview?.requiresConfirm),
    emailConfirmed: confirmEmailBlast,
  });
  const fieldInvalid = (field: 'message' | 'channel' | 'subject' | 'recipients' | 'preview' | 'email-confirm') => (
    attemptedSend && sendBlock?.field === field
  );
  const removeChosen = (id: string) => {
    setSelectedIds((current) => current.filter((item) => item !== id));
    setExplicitReviewIds((current) => current.filter((item) => item !== id));
    setAddedAdmins((current) => current.filter((admin) => admin.id !== id));
    setSelectionDropped(null);
    clearPreview();
    setConfirmEmailBlast(false);
  };

  const currentSelection = selection();
  const filterChips = selectionFilterChips(currentSelection);
  const plainSummary = selectionPlainSummary(currentSelection);
  const withEmail = directory.filter((recipient) => recipient.email).length;
  const withPush = directory.filter((recipient) => recipient.pushReachable).length;
  const stripeName = (status: string | undefined) => (
    status === 'none' || status === 'incomplete' || status === 'ready' || status === 'review' || status === 'not_ready'
      ? stripeChoiceLabel(status)
      : ''
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('admin.notificationCenter.title')}</h2>
        <p className="text-gray-600">{t('admin.notificationCenter.subtitle')}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setScreen('compose')}
            className={`rounded-lg px-3 py-2 text-sm ${screen === 'compose' ? 'bg-emerald-700 text-white' : 'border border-gray-300 text-gray-700'}`}
          >
            Nieuw bericht
          </button>
          <button
            type="button"
            onClick={() => setScreen('history')}
            className={`rounded-lg px-3 py-2 text-sm ${screen === 'history' ? 'bg-emerald-700 text-white' : 'border border-gray-300 text-gray-700'}`}
          >
            Verzendgeschiedenis
          </button>
        </div>
      </div>

      {screen === 'history' ? <NotificationHistory /> : null}
      {screen === 'compose' ? (
      <>
      {notice && (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.tone === 'success'
              ? 'border-green-700 bg-green-50 text-green-950'
              : notice.tone === 'partial'
                ? 'border-amber-700 bg-amber-50 text-amber-950'
                : 'border-red-700 bg-red-50 text-red-950'
          }`}
        >
          <ul className="space-y-1">
            {notice.lines.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form
          onSubmit={handleSendMessage}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
            event.preventDefault();
          }}
          className="space-y-6"
        >
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">1. Doelgroep</h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {AUDIENCE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!preset.available}
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <span className="block font-medium text-gray-900">{preset.label}</span>
                  <span className="mt-1 block text-xs text-gray-600">{preset.available ? preset.description : preset.reason}</span>
                </button>
              ))}
            </div>
            <label className="block text-sm" htmlFor="audience">
              <span className="font-medium text-gray-700">{t('admin.notificationCenter.targetGroup')}</span>
              <select
                id="audience"
                value={audience}
                onChange={(event) => {
                  setAudience(event.target.value as AudienceId);
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="applicable">Alle toepasselijke rollen</option>
                <option value="all">{t('admin.notificationCenter.allUsers')}</option>
                <option value="sellers">{t('admin.notificationCenter.sellersOnly')}</option>
                <option value="buyers">{t('admin.notificationCenter.buyersOnly')}</option>
                <option value="delivery">Bezorgpartners</option>
              </select>
            </label>
            <p className="text-sm text-gray-700">
              {audience === 'all'
                ? 'Alle gebruikers is een bewuste keuze. Beheerders en test- en systeemaccounts blijven buiten de lijst.'
                : 'Zonder gekozen rol selecteert Alle toepasselijke rollen niemand. Iemand met meerdere rollen telt één keer.'}
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">2. Filters</h3>
            <p className="text-sm text-gray-600">E-mail, bezorgerverificatie en verkoopreview zijn één verificatie. De laatste keuze geldt.</p>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Voorwaarden combineren</span>
              <select
                value={matchMode}
                onChange={(event) => {
                  setMatchMode(event.target.value as 'all' | 'any');
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">EN — alle gekozen filters</option>
                <option value="any">OF — minstens één filter</option>
              </select>
              <span className="mt-1 block text-sm text-gray-700">
                {matchMode === 'all'
                  ? 'EN: een ontvanger moet aan elke gekozen voorwaarde voldoen.'
                  : 'OF: een ontvanger moet aan minstens één gekozen voorwaarde voldoen.'}
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Stripe</span>
                <span className="mt-1 block text-xs text-gray-600">Zelfde account voor verkoop en bezorging.</span>
                <select
                  value={stripe}
                  onChange={(event) => {
                    setStripe(event.target.value as StripeAudienceFilter | '');
                    invalidatePreview();
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Geen Stripe-filter</option>
                  <option value="none">{stripeChoiceLabel('none')}</option>
                  <option value="incomplete">{stripeChoiceLabel('incomplete')}</option>
                  <option value="ready">{stripeChoiceLabel('ready')}</option>
                  <option value="not_ready">{stripeChoiceLabel('not_ready')}</option>
                  <option value="review">{stripeChoiceLabel('review')}</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">E-mailverificatie</span>
                <select
                  value={verificationKind === 'email' ? verificationStatus : ''}
                  onChange={(event) => {
                    const status = event.target.value as VerificationStatus | '';
                    if (status) {
                      setVerificationKind('email');
                      setVerificationStatus(status);
                    } else if (verificationKind === 'email') {
                      setVerificationKind('');
                      setVerificationStatus('');
                    }
                    invalidatePreview();
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Geen e-mailfilter</option>
                  <option value="verified">E-mail geverifieerd</option>
                  <option value="unverified">E-mail nog niet geverifieerd</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Account</span>
                <select
                  value={accountStatus}
                  onChange={(event) => {
                    setAccountStatus(event.target.value as AccountStatusFilter | '');
                    invalidatePreview();
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Geen accountfilter</option>
                  <option value="active">Actief</option>
                  <option value="blocked">Geblokkeerd</option>
                  <option value="courier_blocked">Bezorger geblokkeerd</option>
                </select>
              </label>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Bezorging</p>
                <p className="text-xs text-gray-600">Geldt voor mensen met een bezorgprofiel, ook als ze nog een andere rol hebben.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Bezorgerverificatie</span>
                  <select
                    value={verificationKind === 'courier' ? verificationStatus : ''}
                    onChange={(event) => {
                      const status = event.target.value as VerificationStatus | '';
                      if (status) {
                        setVerificationKind('courier');
                        setVerificationStatus(status);
                      } else if (verificationKind === 'courier') {
                        setVerificationKind('');
                        setVerificationStatus('');
                      }
                      invalidatePreview();
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Geen bezorgerfilter</option>
                    <option value="verified">Bezorger geverifieerd</option>
                    <option value="unverified">Bezorger nog niet geverifieerd</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Openstaande bezorgstap</span>
                  <select
                    value={pendingStep}
                    onChange={(event) => {
                      setPendingStep(event.target.value as PendingStepId | '');
                      invalidatePreview();
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Geen stapfilter</option>
                    <option value="delivery_age">Leeftijd</option>
                    <option value="delivery_pricing">Tarief</option>
                    <option value="delivery_service_area">Werkgebied</option>
                    <option value="delivery_availability">Beschikbaarheid</option>
                    <option value="delivery_company_name">Bedrijfsnaam</option>
                  </select>
                </label>
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={agreementOpen}
                  onChange={(event) => {
                    setAgreementOpen(event.target.checked);
                    invalidatePreview();
                  }}
                  className="mt-1 rounded border-gray-300 text-emerald-600"
                />
                <span>
                  {agreementVersionLabel(DELIVERY_AGREEMENT_VERSION)} nog niet geaccepteerd. Dit staat los van Stripe.
                  Een acceptatie zonder vastgelegde versie telt niet mee. Bestaande acceptaties blijven geldig.
                </span>
              </label>
            </div>

            {(audience === 'sellers' || audience === 'applicable' || audience === 'all' || verificationKind === 'commerce_review') && (
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Verkoopreview</span>
                <span className="mt-1 block text-xs text-gray-600">Alleen voor verkopers. In behandeling bestaat hier wel.</span>
                <select
                  value={verificationKind === 'commerce_review' ? verificationStatus : ''}
                  onChange={(event) => {
                    const status = event.target.value as VerificationStatus | '';
                    if (status) {
                      setVerificationKind('commerce_review');
                      setVerificationStatus(status);
                    } else if (verificationKind === 'commerce_review') {
                      setVerificationKind('');
                      setVerificationStatus('');
                    }
                    invalidatePreview();
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Geen verkoopreview</option>
                  <option value="verified">Verkoopreview afgerond</option>
                  <option value="unverified">Verkoopreview nodig</option>
                  <option value="pending">Verkoopreview in behandeling</option>
                </select>
              </label>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => removeChip(chip.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-50 px-3 py-1 text-sm text-emerald-900"
                >
                  {chip.label}
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Verwijder filter {chip.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-800"
              >
                Filters wissen
              </button>
            </div>
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{plainSummary}</p>
            <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <summary className="cursor-pointer font-medium text-gray-900">Technische toelichting</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {UNAVAILABLE_AUDIENCE_FACTS.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </details>
          </section>

          <div id="notification-recipients" className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">3. Ontvangers</h3>
              <p className="text-sm text-gray-900">
                {!listable
                  ? 'Kies een filter of een doelgroep. Alle toepasselijke rollen zonder filter selecteert niemand.'
                  : listLoading
                    ? 'Ontvangers laden…'
                    : `Unieke filterresultaten: ${directory.length}. Aangevinkt: ${selectedCount}.`}
              </p>
              {listable && !listLoading && directory.length > 0 && (
                <p className="text-sm text-gray-700">
                  E-mailadres {withEmail}, zonder e-mail {directory.length - withEmail}. Pushapparaat {withPush}, zonder apparaat {directory.length - withPush}.
                  {query ? ` Zoekopdracht toont ${searchHits.length}.` : ''} Dit is de filterlijst. Alleen aangevinkte namen gaan mee.
                </p>
              )}
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2" style={{ overflowAnchor: 'none' }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">Geselecteerde ontvangers</h4>
                <p className="text-sm text-gray-900">{chosen.length} geselecteerd</p>
              </div>
              <p className="text-sm text-gray-800">
                Dit zijn de mensen die meegaan. Filterresultaten zijn niet automatisch geselecteerd.
              </p>
              {selectionDropped && <p className="text-sm font-medium text-amber-950">{selectionDropped}</p>}
              {chosen.length === 0 ? (
                <p className="text-sm text-gray-700">Nog niemand. Vink iemand aan of voeg een beheerder toe.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {visibleChosen.map((person) => (
                      <li key={person.id} className="flex flex-wrap items-start justify-between gap-2 rounded border border-emerald-100 bg-white px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-800">{person.email || 'Geen e-mailadres'}</p>
                          <p className="text-xs text-gray-700">
                            {person.fromAudience && person.manual
                              ? 'Uit de doelgroep en handmatig toegevoegd'
                              : person.manual
                                ? 'Handmatig toegevoegd'
                                : person.fromAudience
                                  ? 'Uit de doelgroep'
                                  : 'Niet meer in de filterresultaten'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeChosen(person.id)}
                          className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-800"
                        >
                          Verwijderen
                        </button>
                      </li>
                    ))}
                  </ul>
                  {chosen.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setSelectionExpanded((current) => !current)}
                      className="text-sm font-medium text-emerald-800"
                    >
                      {selectionExpanded ? 'Minder tonen' : `Toon alle ${chosen.length} geselecteerde ontvangers`}
                    </button>
                  )}
                </>
              )}
            </div>
            {listable && (
              <>
                <input
                  type="search"
                  value={recipientQuery}
                  onChange={(event) => {
                    setRecipientQuery(event.target.value);
                    setRecipientPage(0);
                  }}
                  placeholder="Zoek op naam of e-mailadres"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const bulk = directory.filter((recipient) => !recipient.requiresExplicitCheck).map((recipient) => recipient.id);
                      const kept = explicitReviewIds.filter((id) => directory.some((recipient) => recipient.id === id && recipient.requiresExplicitCheck));
                      setExplicitReviewIds(kept);
                      changeChecked([...new Set([...kept, ...bulk])]);
                    }}
                    disabled={directory.length === 0}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                  >
                    Selecteer alle resultaten
                  </button>
                  {query && (
                    <button
                      type="button"
                      onClick={() => changeChecked([...new Set([
                        ...selectedIds,
                        ...searchHits.filter((recipient) => !recipient.requiresExplicitCheck).map((recipient) => recipient.id),
                      ])])}
                      disabled={searchHits.length === 0}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                    >
                      Selecteer zoekresultaten
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setExplicitReviewIds([]);
                      changeChecked([]);
                    }}
                    disabled={selectedIds.length === 0}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                  >
                    Wis selectie
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  {query
                    ? 'Selecteer alle resultaten vinkt de filterresultaten aan, behalve accounts met Stripe-koppeling controleren. Die vink je apart aan. Selecteer zoekresultaten doet hetzelfde voor deze zoekopdracht. Wis selectie haalt elk vinkje weg.'
                    : 'Selecteer alle resultaten vinkt de filterresultaten aan, ook op andere pagina’s, behalve accounts met Stripe-koppeling controleren. Die vink je apart aan. Wis selectie haalt elk vinkje weg. Zoeken of bladeren bewaart de vinkjes.'}
                </p>
                {stripeNotes.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-800">
                    {stripeNotes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
                {listError && <p className="text-sm text-red-800">{listError}</p>}
                {!listLoading && !listError && directory.length === 0 && (
                  <p className="text-sm text-gray-600">Geen gebruikers voor deze filters.</p>
                )}
                <ul className="divide-y divide-gray-100">
                  {visibleRecipients.map((recipient) => (
                    <li key={recipient.id} className="flex items-start gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(recipient.id)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            changeChecked([...selectedIds, recipient.id]);
                            if (recipient.requiresExplicitCheck) {
                              setExplicitReviewIds((current) => current.includes(recipient.id) ? current : [...current, recipient.id]);
                            }
                          } else {
                            changeChecked(selectedIds.filter((id) => id !== recipient.id));
                            setExplicitReviewIds((current) => current.filter((id) => id !== recipient.id));
                          }
                        }}
                        aria-label={`Selecteer ${recipient.name}`}
                        className="mt-1 rounded border-gray-300 text-emerald-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{recipient.name}</p>
                        <p className="text-sm text-gray-800">{recipient.roles.join(' · ') || 'Geen rol'}</p>
                        <p className="text-sm text-gray-600">{recipient.email || 'Geen e-mailadres'}</p>
                        {stripe ? <p className="text-sm text-gray-900">Stripe: {stripeName(recipient.stripeStatus) || recipient.connectLabel}</p> : null}
                        <p className="text-sm text-gray-700">
                          {recipient.email ? 'E-mailadres aanwezig.' : 'Geen e-mailadres, e-mail valt af.'}
                          {' '}
                          {recipient.pushReachable ? 'Pushapparaat aanwezig.' : 'Geen pushapparaat, push valt af.'}
                        </p>
                        {recipient.requiresExplicitCheck ? (
                          <p className="text-sm text-amber-900">Apart aanvinken. Selecteer alle resultaten slaat dit account over.</p>
                        ) : null}
                        <p className="text-sm text-emerald-900">{(recipient.reasons || []).join(' · ')}</p>
                        {(recipient.alreadySent || []).map((prior) => (
                          <p key={`${prior.channel}-${prior.at}`} className="text-sm text-amber-900">
                            Dit bericht al verstuurd. {prior.label}
                          </p>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                {searchHits.length > RECIPIENT_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setRecipientPage(Math.max(0, safePage - 1))}
                      disabled={safePage === 0}
                      className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                    >
                      Vorige
                    </button>
                    <span>Pagina {safePage + 1} van {pageCount}</span>
                    <button
                      type="button"
                      onClick={() => setRecipientPage(Math.min(pageCount - 1, safePage + 1))}
                      disabled={safePage >= pageCount - 1}
                      className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                    >
                      Volgende
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">4. Bericht en kanalen</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.notificationCenter.message')}
              </label>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  invalidatePreview();
                }}
                rows={4}
                aria-invalid={fieldInvalid('message')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${fieldInvalid('message') ? 'border-red-600' : 'border-gray-300'}`}
                placeholder={t('common.typeMessageHere')}
                maxLength={500}
              />
              <div className="mt-1 text-sm text-gray-500">{message.length}/500 {t('common.characters')}</div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.notificationCenter.deliveryMethod')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(event) => {
                    setSendNotification(event.target.checked);
                    invalidatePreview();
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Bell className="w-4 h-4 ml-2 mr-2 text-gray-600" />
                <span className="text-sm text-gray-700">In-appmelding en push</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(event) => {
                    setSendEmail(event.target.checked);
                    invalidatePreview();
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 ml-2 mr-2 text-gray-600" />
                <span className="text-sm text-gray-700">{t('admin.notificationCenter.sendEmail')}</span>
              </label>
            </div>
          </div>

          {(sendEmail || sendNotification) && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div>
                <h3 className="text-base font-medium text-gray-900">Beheerder toevoegen</h3>
                <p className="text-sm text-gray-700">
                  Zoek jezelf of een andere beheerder op naam of e-mailadres. Vink niemand in de lijst aan en voeg alleen jezelf toe. Het voorbeeld toont dan één unieke ontvanger en nul uit de filters. Die persoon mag buiten de doelgroep vallen.
                  Een nieuwe verzending begint zonder toegevoegde beheerders. E-mail gebruikt hetzelfde onderwerp, dezelfde tekst en dezelfde HomeCheff-opmaak.
                  Push gebruikt dezelfde titel, tekst en interne bestemming, en maakt ook een in-appmelding aan.
                </p>
              </div>
              <input
                type="search"
                value={adminQuery}
                onChange={(event) => setAdminQuery(event.target.value)}
                placeholder="Zoek een beheerder op naam of e-mailadres"
                aria-label="Beheerder zoeken"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {adminHits.filter((hit) => !addedAdmins.some((admin) => admin.id === hit.id)).length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {adminHits
                    .filter((hit) => !addedAdmins.some((admin) => admin.id === hit.id))
                    .map((hit) => (
                      <li key={hit.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{hit.name}</p>
                          <p className="text-sm text-gray-600">{hit.role}{hit.email ? ` · ${hit.email}` : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const channels: Array<'email' | 'push'> = [
                              ...(sendEmail ? (['email'] as const) : []),
                              ...(sendNotification ? (['push'] as const) : []),
                            ];
                            setAddedAdmins((current) => current.some((admin) => admin.id === hit.id)
                              ? current
                              : [...current, { id: hit.id, name: hit.name, email: hit.email, channels }]);
                            invalidatePreview();
                          }}
                          className="px-3 py-2 rounded-lg border border-emerald-700 text-sm text-emerald-800"
                        >
                          Toevoegen
                        </button>
                      </li>
                    ))}
                </ul>
              )}
              {addedAdmins.length === 0 ? (
                <p className="text-sm text-gray-600">Nog geen beheerder toegevoegd.</p>
              ) : (
                <ul className="space-y-3">
                  {addedAdmins.map((admin) => (
                    <li key={admin.id} className="rounded border px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                      <p className="text-sm text-gray-600">{admin.email || 'Geen e-mailadres'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {sendEmail && (
                          <label className="flex items-center gap-2 text-sm text-gray-800">
                            <input
                              type="checkbox"
                              checked={admin.channels.includes('email')}
                              onChange={() => {
                                setAddedAdmins((current) => current.flatMap((item) => {
                                  if (item.id !== admin.id) return [item];
                                  const channels = item.channels.includes('email')
                                    ? item.channels.filter((channel) => channel !== 'email')
                                    : [...item.channels, 'email' as const];
                                  return channels.length === 0 ? [] : [{ ...item, channels }];
                                }));
                                invalidatePreview();
                              }}
                              className="rounded border-gray-300 text-emerald-600"
                            />
                            E-mail
                          </label>
                        )}
                        {sendNotification && (
                          <label className="flex items-center gap-2 text-sm text-gray-800">
                            <input
                              type="checkbox"
                              checked={admin.channels.includes('push')}
                              onChange={() => {
                                setAddedAdmins((current) => current.flatMap((item) => {
                                  if (item.id !== admin.id) return [item];
                                  const channels = item.channels.includes('push')
                                    ? item.channels.filter((channel) => channel !== 'push')
                                    : [...item.channels, 'push' as const];
                                  return channels.length === 0 ? [] : [{ ...item, channels }];
                                }));
                                invalidatePreview();
                              }}
                              className="rounded border-gray-300 text-emerald-600"
                            />
                            Push
                          </label>
                        )}
                        {sendEmail && sendNotification && (
                          <button
                            type="button"
                            onClick={() => {
                              setAddedAdmins((current) => current.map((item) => (
                                item.id === admin.id ? { ...item, channels: ['email', 'push'] } : item
                              )));
                              invalidatePreview();
                            }}
                            className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-800"
                          >
                            Beide
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAddedAdmins((current) => current.filter((item) => item.id !== admin.id));
                            invalidatePreview();
                          }}
                          className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-800"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {sendEmail && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-medium">E-mailcapaciteit</p>
              <p className="mt-1">
                Admin-e-mail deelt de transactionele mailcapaciteit met betalingen en auth. Grote doelgroepen vragen een extra bevestiging.
                Een e-mail telt pas als geaccepteerd wanneer de maildienst dat bevestigt, niet als afgeleverd.
              </p>
              {preview?.requiresConfirm && (
                <label className="mt-3 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={confirmEmailBlast}
                    onChange={(event) => setConfirmEmailBlast(event.target.checked)}
                    aria-invalid={fieldInvalid('email-confirm')}
                    className="mt-1 rounded border-gray-300 text-emerald-600"
                  />
                  <span>Ik bevestig dat ik bewust e-mail naar deze doelgroep stuur.</span>
                </label>
              )}
            </div>
          )}

          {sendNotification && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.notificationCenter.pushTitle')}
                </label>
                <input
                  type="text"
                  value={pushTitle}
                  onChange={(event) => {
                    setPushTitle(event.target.value);
                    invalidatePreview();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('admin.notificationCenter.pushTitlePlaceholder')}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.notificationCenter.linkPreset')}
                </label>
                <select
                  value={linkPreset}
                  onChange={(event) => {
                    setLinkPreset(event.target.value);
                    invalidatePreview();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="/notifications">{t('admin.notificationCenter.routeInbox')}</option>
                  <option value="/delivery/dashboard">Stripe en bezorginstellingen</option>
                  <option value="/delivery/settings">Bezorginstellingen</option>
                  <option value="/sell/new">Aanbod plaatsen</option>
                  <option value="/app">{t('admin.notificationCenter.routeBetaApp')}</option>
                  <option value="/mijn-hcp">{t('admin.notificationCenter.routeMijnHcp')}</option>
                  <option value="/profile">{t('admin.notificationCenter.routeProfile')}</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">{t('admin.notificationCenter.linkHelp')}</p>
              </div>
            </div>
          )}

          {sendEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.notificationCenter.emailSubject')} *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                  invalidatePreview();
                }}
                aria-invalid={fieldInvalid('subject')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${fieldInvalid('subject') ? 'border-red-600' : 'border-gray-300'}`}
                placeholder={t('admin.notificationCenter.emailSubjectPlaceholder')}
                maxLength={100}
              />
            </div>
          )}

          <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={confirmRepeat}
              onChange={(event) => {
                setConfirmRepeat(event.target.checked);
                clearPreview();
              }}
              className="mt-1 rounded border-gray-300 text-emerald-600"
            />
            <span>
              Herhaling bevestigen. Ontvangers die dit bericht al via hetzelfde kanaal kregen, krijgen het opnieuw.
              Het voorbeeld toont hoeveel ontvangers dat zijn. Zonder dit vinkje worden die duplicaten overgeslagen.
            </span>
          </label>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">5. Voorbeeld en verzending</h3>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => document.getElementById('notification-recipients')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              disabled={!listable}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-emerald-700 text-emerald-800 disabled:opacity-50"
            >
              Ontvangers bekijken
            </button>
            <button
              type="button"
              onClick={loadPreview}
              disabled={isLoading || chosen.length === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-emerald-700 text-emerald-800 disabled:opacity-50"
            >
              {sendBlock?.refreshPreview ? 'Voorbeeld vernieuwen' : 'Voorbeeld bekijken'}
            </button>
            <button
              type="submit"
              disabled={isLoading || sendBlock !== null}
              aria-describedby="send-block-reason"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('admin.notificationCenter.sending') : t('admin.notificationCenter.sendMessage')}
              <Send className="w-4 h-4 ml-2" />
            </button>
          </div>
          <p id="send-block-reason" className="text-sm text-amber-950" role="status">
            {isLoading
              ? 'Bezig. Wacht op de uitslag voordat je opnieuw klikt.'
              : sendBlock
                ? sendBlock.action
                : 'Het voorbeeld klopt. Verzenden gebruikt deze selectie.'}
          </p>
          </div>
        </form>
      </div>

      {(preview || (sendEmail && message.trim())) && (
        <div className={`grid items-start gap-4 ${preview && sendEmail && message.trim() ? 'xl:grid-cols-[minmax(0,1fr)_420px]' : ''}`}>
      {preview && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4" role="status">
          <h3 className="text-lg font-medium text-gray-900">Definitieve selectie</h3>
          {preview.proof && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              Unieke ontvangers: {preview.proof.unique}. Uit de filters: {preview.proof.fromFilters}. Alleen handmatig toegevoegd: {preview.proof.manualOnly}.
              {preview.proof.fromFilters === 0 ? ' Niemand uit de doelgroep gaat mee.' : ' Niet aangevinkte filterresultaten gaan niet mee.'}
            </p>
          )}
          <ul className="space-y-1 text-sm text-gray-800">
            {(preview.proof ? preview.lines.filter((line) => line !== preview.proof?.line) : preview.lines).map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-900">
            In-app {preview.channels.inApp}. Push-bereikbaar {preview.channels.push}. E-mail met adres {preview.channels.email}.
            Geaccepteerd door de mail- of pushdienst is niet hetzelfde als afgeleverd.
          </p>
          {preview.error && <p className="text-sm text-red-800">{preview.error}</p>}
          {!preview.previewToken && (
            <p className="text-sm font-medium text-amber-900">
              De selectie is gewijzigd. Bekijk het voorbeeld opnieuw voordat je verstuurt.
            </p>
          )}
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {preview.recipients.map((recipient) => (
              <li key={recipient.id} className="rounded border px-3 py-2">
                <p className="font-medium text-gray-900">{recipient.name}</p>
                <p className="text-gray-800">{recipient.roles.join(' · ') || 'Geen rol'}</p>
                <p className="text-gray-600">{recipient.email || 'Geen e-mailadres'}</p>
                {recipient.stripeStatus ? <p className="text-gray-900">Stripe: {stripeName(recipient.stripeStatus) || recipient.connectLabel}</p> : null}
                {recipient.requiresExplicitCheck ? (
                  <p className="text-amber-900">Apart aangevinkt. Selecteer alle resultaten neemt dit account niet mee.</p>
                ) : null}
                <p className="text-emerald-900">{(recipient.reasons || []).join(' · ')}</p>
                {(recipient.channelLines || []).map((line) => (
                  <p key={line} className="text-gray-800">{line}</p>
                ))}
                {(recipient.alreadySent || []).map((prior) => (
                  <p key={`${prior.channel}-${prior.at}`} className="text-amber-900">Dit bericht al verstuurd. {prior.label}</p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
          {sendEmail && message.trim() && (
            <AdminEmailPreview subject={subject} message={message} action={adminEmailActionForRoute(linkPreset)} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Gebruikers</h3>
              <p className="text-sm text-gray-500">Zelfde Stripe-status als in Gebruikersbeheer</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg"><Mail className="w-6 h-6 text-green-600" /></div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">E-mail</h3>
              <p className="text-sm text-gray-500">Alleen geaccepteerd als de maildienst dat zegt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg"><AlertCircle className="w-6 h-6 text-purple-600" /></div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Herhalen</h3>
              <p className="text-sm text-gray-500">Wie het bericht al kreeg, wordt overgeslagen</p>
            </div>
          </div>
        </div>
      </div>
      </>
      ) : null}
    </div>
  );
}
