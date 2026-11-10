'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Users, Mail, Bell, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { AdminEmailPreview } from './AdminEmailPreview';
import { NotificationHistory } from './NotificationHistory';
import {
  AUDIENCE_PRESETS,
  DELIVERY_AGREEMENT_VERSION,
  UNAVAILABLE_AUDIENCE_FACTS,
  accountStatusLabel,
  pendingStepLabel,
  payoutConnectStatusLabel,
  selectionCanList,
  stripeFilterLabel,
  verificationFilterLabel,
  type AccountStatusFilter,
  type AudienceId,
  type AudienceSelection,
  type PayoutConnectStatus,
  type PendingStepId,
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
  reasons?: string[];
  registeredAt: string | null;
  alreadySent?: Array<{ channel: string; at: string; label: string }>;
};

type PreviewPayload = {
  previewToken: string | null;
  summary: string[];
  total: number;
  found: number;
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
  const [stripe, setStripe] = useState<PayoutConnectStatus | ''>('');
  const [verificationKind, setVerificationKind] = useState<VerificationKind | ''>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>('');
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatusFilter | ''>('');
  const [pendingStep, setPendingStep] = useState<PendingStepId | ''>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const [notice, setNotice] = useState<ScreenNotice | null>(null);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const submitLockRef = useRef(false);
  const contentKeyRef = useRef<{ hash: string; key: string } | null>(null);

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
      setDirectory([]);
      setListError(null);
      setListLoading(false);
      setSelectedIds([]);
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
      message: message.trim(),
      subject: subject.trim(),
      title: pushTitle.trim(),
    };
    setDirectory([]);
    setListLoading(true);
    setListError(null);
    setPreview(null);
    setConfirmEmailBlast(false);
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
          setDirectory([]);
          setSelectedIds([]);
          setListError(text);
          return;
        }
        const recipients = readRecipients(data.recipients);
        const ids = new Set(recipients.map((recipient) => recipient.id));
        setDirectory(recipients);
        setSelectedIds((current) => current.filter((id) => ids.has(id)));
        setRecipientPage(0);
        setListError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setDirectory([]);
        setSelectedIds([]);
        setListError('De ontvangerslijst kon niet worden geladen.');
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
    message,
    subject,
    pushTitle,
  ]);

  const invalidatePreview = () => {
    setPreview(null);
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
    setNotice(null);
    if (!selectionCanList(selection())) {
      setNotice({ tone: 'error', lines: ['Alle toepasselijke rollen zonder statusfilter selecteert niemand. Kies een filter, of kies bewust Alle gebruikers.'] });
      return;
    }
    if (selectedIds.length === 0) {
      setNotice({ tone: 'error', lines: ['Vink minstens één ontvanger aan. Er is niets verstuurd.'] });
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
        setPreview(null);
        setNotice(parsed);
        return;
      }
      setPreview({
        previewToken: data.previewToken,
        summary: Array.isArray(data.summary) ? data.summary : [],
        total: typeof data.total === 'number' ? data.total : 0,
        found: typeof data.found === 'number' ? data.found : directory.length,
        channels: data.channels || { inApp: 0, push: 0, email: 0 },
        recipients: readRecipients(data.recipients),
        requiresConfirm: Boolean(data.requiresConfirm),
        lines: parsed.lines,
        error: typeof data.error === 'string' ? data.error : undefined,
      });
      setNotice(null);
    } catch {
      setPreview(null);
      setNotice({ tone: 'error', lines: ['Het voorbeeld kon niet worden opgehaald. Er is niets verstuurd.'] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLockRef.current || isLoading) return;
    if (selectedIds.length === 0) {
      setNotice({ tone: 'error', lines: ['Vink minstens één ontvanger aan. Er is niets verstuurd.'] });
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
        setMessage('');
        setPushTitle('');
        setSubject('');
        setPreview(null);
        setConfirmEmailBlast(false);
        setConfirmRepeat(false);
        contentKeyRef.current = null;
      }
      if (data?.code === 'PREVIEW_STALE') {
        setPreview(null);
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
    setVerificationKind('');
    setVerificationStatus('');
    setAgreementOpen(false);
    setAccountStatus('');
    setPendingStep('');
    setPreview(null);
    setNotice(null);
  };

  const changeChecked = (next: string[]) => {
    setSelectedIds(next);
    setPreview(null);
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

  const verificationChoices: VerificationStatus[] =
    verificationKind === 'commerce_review' ? ['verified', 'unverified', 'pending'] : ['verified', 'unverified'];

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
        <form onSubmit={handleSendMessage} className="space-y-6">
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Veelgebruikte selecties</p>
            <div className="grid gap-2 md:grid-cols-3">
              {AUDIENCE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!preset.available}
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-lg border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <span className="block font-medium">{preset.label}</span>
                  {!preset.available && <span className="mt-1 block text-xs">Geblokkeerd: geen betrouwbaar activiteitssignaal.</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="audience">
              {t('admin.notificationCenter.targetGroup')}
            </label>
            <select
              id="audience"
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value as AudienceId);
                invalidatePreview();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="applicable">Alle toepasselijke rollen</option>
              <option value="all">{t('admin.notificationCenter.allUsers')}</option>
              <option value="sellers">{t('admin.notificationCenter.sellersOnly')}</option>
              <option value="buyers">{t('admin.notificationCenter.buyersOnly')}</option>
              <option value="delivery">Bezorgpartners</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              De rol is optioneel. Alle toepasselijke rollen zonder statusfilter selecteert niemand. Alle gebruikers is een aparte keuze voor een brede verzending. Iemand met meerdere rollen verschijnt één keer.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900">Filter op status</h3>
            <p className="mt-1 text-xs text-gray-500">
              De filters gelden meteen, ook zonder rol. Kies je daarna een rol, dan blijven alleen mensen uit die rol over.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Filters combineren</span>
              <select
                value={matchMode}
                onChange={(event) => {
                  setMatchMode(event.target.value as 'all' | 'any');
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Aan alle gekozen filters</option>
                <option value="any">Aan minstens één gekozen filter</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Stripe Connect</span>
              <select
                value={stripe}
                onChange={(event) => {
                  setStripe(event.target.value as PayoutConnectStatus | '');
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Geen Stripe-filter</option>
                <option value="none">{payoutConnectStatusLabel('none')}</option>
                <option value="incomplete">{payoutConnectStatusLabel('incomplete')}</option>
                <option value="ready">{payoutConnectStatusLabel('ready')}</option>
                <option value="review">{payoutConnectStatusLabel('review')}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Verificatie</span>
              <select
                value={verificationKind}
                onChange={(event) => {
                  const kind = event.target.value as VerificationKind | '';
                  setVerificationKind(kind);
                  setVerificationStatus('');
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Geen verificatiefilter</option>
                <option value="email">HomeCheff-e-mailverificatie</option>
                <option value="courier">Bezorgerverificatie</option>
                <option value="commerce_review">Verkoopreview</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Verificatiestatus</span>
              <select
                value={verificationStatus}
                disabled={!verificationKind}
                onChange={(event) => {
                  setVerificationStatus(event.target.value as VerificationStatus | '');
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              >
                <option value="">Kies een status</option>
                {verificationChoices.map((status) => (
                  <option key={status} value={status}>
                    {status === 'verified' ? 'Geverifieerd' : status === 'unverified' ? 'Nog niet geverifieerd' : 'In behandeling'}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Accountstatus</span>
              <select
                value={accountStatus}
                onChange={(event) => {
                  setAccountStatus(event.target.value as AccountStatusFilter | '');
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Geen accountstatusfilter</option>
                <option value="active">Actief</option>
                <option value="blocked">Geblokkeerd</option>
                <option value="courier_blocked">Bezorger geblokkeerd</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Laatste activiteit</span>
              <select
                disabled
                value=""
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              >
                <option value="">Niet beschikbaar</option>
              </select>
              <span className="mt-1 block text-xs text-gray-500">
                HomeCheff slaat geen laatste login of laatste activiteit op. 30, 60 en 90 dagen blijven uit.
              </span>
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
              Bezorgovereenkomst staat nog open voor versie {DELIVERY_AGREEMENT_VERSION}. Dit staat los van Stripe.
              Acceptatie zonder versie telt niet als open en niet als geaccepteerd.
            </span>
          </label>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Niet beschikbaar</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {UNAVAILABLE_AUDIENCE_FACTS.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Laatste activiteit: 30, 60 en 90 dagen blijven geblokkeerd. Accountstatus inactief ontbreekt.
              {audience ? ` Gekozen Stripe-label: ${stripe ? stripeFilterLabel(stripe, audience) : 'geen filter'}.` : ''}
              {verificationKind && verificationStatus
                ? ` ${verificationFilterLabel({ kind: verificationKind, status: verificationStatus })}.`
                : ''}
              {accountStatus ? ` ${accountStatusLabel(accountStatus)}.` : ''}
              {pendingStep ? ` ${pendingStepLabel(pendingStep)}.` : ''}
            </p>
          </div>

          <div id="notification-recipients" className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div>
              <h3 className="text-base font-medium text-gray-900">Ontvangers</h3>
              <p className="text-sm text-gray-700">
                {!listable
                  ? 'Kies een statusfilter of een doelgroep. Alle toepasselijke rollen zonder filter selecteert niemand.'
                  : listLoading
                    ? 'Ontvangers laden…'
                    : `${selectedCount} geselecteerd van ${directory.length} gevonden${query ? `. Zoekopdracht toont ${searchHits.length}` : ''}.`}
              </p>
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
                    onClick={() => changeChecked(directory.map((recipient) => recipient.id))}
                    disabled={directory.length === 0}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                  >
                    Selecteer alle resultaten
                  </button>
                  {query && (
                    <button
                      type="button"
                      onClick={() => changeChecked([...new Set([...selectedIds, ...searchHits.map((recipient) => recipient.id)])])}
                      disabled={searchHits.length === 0}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                    >
                      Selecteer zoekresultaten
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => changeChecked([])}
                    disabled={selectedIds.length === 0}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                  >
                    Wis selectie
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  {query
                    ? 'Selecteer alle resultaten vinkt alle filterresultaten aan, ook buiten deze zoekopdracht en op andere pagina’s. Selecteer zoekresultaten vinkt alleen deze zoekopdracht aan. Wis selectie haalt elk vinkje weg.'
                    : 'Selecteer alle resultaten vinkt alle filterresultaten aan, ook op andere pagina’s. Wis selectie haalt elk vinkje weg. Zoeken of bladeren bewaart de vinkjes.'}
                </p>
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
                          changeChecked(
                            event.target.checked
                              ? [...selectedIds, recipient.id]
                              : selectedIds.filter((id) => id !== recipient.id),
                          );
                        }}
                        aria-label={`Selecteer ${recipient.name}`}
                        className="mt-1 rounded border-gray-300 text-emerald-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{recipient.name}</p>
                        <p className="text-sm text-gray-800">{recipient.roles.join(' · ') || 'Geen rol'}</p>
                        <p className="text-sm text-gray-600">{recipient.email || 'Geen e-mailadres'}</p>
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

          <div>
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
                  <option value="/settings/app">{t('admin.notificationCenter.routeAppSettings')}</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('admin.notificationCenter.emailSubjectPlaceholder')}
                maxLength={100}
              />
            </div>
          )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t('common.typeMessageHere')}
              maxLength={500}
            />
            <div className="mt-1 text-sm text-gray-500">{message.length}/500 {t('common.characters')}</div>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={confirmRepeat}
              onChange={(event) => {
                setConfirmRepeat(event.target.checked);
                setPreview(null);
              }}
              className="mt-1 rounded border-gray-300 text-emerald-600"
            />
            <span>
              Herhaling bevestigen. Ontvangers die dit bericht al via hetzelfde kanaal kregen, krijgen het opnieuw.
              Het voorbeeld toont hoeveel ontvangers dat zijn. Zonder dit vinkje worden die duplicaten overgeslagen.
            </span>
          </label>

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
              disabled={isLoading || !listable || selectedIds.length === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-emerald-700 text-emerald-800 disabled:opacity-50"
            >
              Voorbeeld bekijken
            </button>
            <button
              type="submit"
              disabled={isLoading || !preview?.previewToken || preview.total === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('admin.notificationCenter.sending') : t('admin.notificationCenter.sendMessage')}
              <Send className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      </div>

      {(preview || (sendEmail && message.trim())) && (
        <div className={`grid items-start gap-4 ${preview && sendEmail && message.trim() ? 'xl:grid-cols-[minmax(0,1fr)_420px]' : ''}`}>
      {preview && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4" role="status">
          <h3 className="text-lg font-medium text-gray-900">Definitieve selectie</h3>
          <ul className="space-y-1 text-sm text-gray-800">
            {preview.lines.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-900">
            {preview.total} aangevinkt van {preview.found} gevonden. In-app {preview.channels.inApp}. Push-bereikbaar {preview.channels.push}. E-mailadres {preview.channels.email}.
            Elk aangevinkt account telt één keer per kanaal. Niet aangevinkte filterresultaten krijgen niets.
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
                <p className="text-emerald-900">{(recipient.reasons || []).join(' · ')}</p>
                {(recipient.alreadySent || []).map((prior) => (
                  <p key={`${prior.channel}-${prior.at}`} className="text-amber-900">Dit bericht al verstuurd. {prior.label}</p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
          {sendEmail && message.trim() && (
            <AdminEmailPreview subject={subject} message={message} />
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
