'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Users, Mail, Bell, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { AdminEmailPreview } from './AdminEmailPreview';
import { resolveAdminNoticeButton } from '@/lib/admin/admin-notice';
import { NotificationHistory } from './NotificationHistory';
import { chosenRecipients, sendBlockReason } from '@/lib/admin/notification-compose-state';
import { uiCopy } from '@/lib/admin/notification-copy';
import {
  AUDIENCE_PRESETS,
  DELIVERY_AGREEMENT_VERSION,
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
  type PushAudienceFilter,
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
  emailOffer?: 'off' | 'paused' | 'no_address' | 'ready';
};

type ScreenNotice = {
  tone: 'success' | 'partial' | 'error';
  lines: string[];
};

const RECIPIENT_PAGE_SIZE = 10;
const DRAFT_KEY = 'hc-message-center-draft';

type SelectionDrop = { count: number; reason: 'unfiltered' | 'outside' };

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

function linesFrom(data: unknown, status: number, fallback: string): ScreenNotice {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const rawLines = Array.isArray(record?.lines) ? record.lines : [];
  const lines = rawLines
    .filter((line): line is string => typeof line === 'string')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const message = typeof record?.message === 'string' ? record.message.trim() : '';
  const error = typeof record?.error === 'string' ? record.error.trim() : '';
  const visible = lines.length > 0 ? lines : message ? message.split('\n').map((line) => line.trim()).filter(Boolean) : error ? [error] : [fallback];
  const outcome = record?.outcome;
  if (status >= 200 && status < 300 && outcome === 'sent') return { tone: 'success', lines: visible };
  if (status >= 200 && status < 300 && (outcome === 'partial' || outcome === 'already_sent')) {
    return { tone: 'partial', lines: visible };
  }
  return { tone: 'error', lines: visible.length > 0 ? visible : [fallback] };
}

export default function NotificationCenter() {
  const { t, language } = useTranslation();
  const copy = (key: string, params?: Record<string, string | number>) => t(`admin.notificationCenter.ui.${key}`, params);
  const [draftReady, setDraftReady] = useState(false);
  const [message, setMessage] = useState('');
  const [linkPreset, setLinkPreset] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [subject, setSubject] = useState('');
  const [audience, setAudience] = useState<AudienceId>('applicable');
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const [stripe, setStripe] = useState<StripeAudienceFilter | ''>('');
  const [pushFilter, setPushFilter] = useState<PushAudienceFilter | ''>('');
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
  const [selectionDropped, setSelectionDropped] = useState<SelectionDrop | null>(null);
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
      push: pushFilter || null,
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
    if (!draftReady) return;
    if (!listable) {
      const dropped = selectedIdsRef.current.length;
      if (dropped > 0) {
        setSelectionDropped({ count: dropped, reason: 'unfiltered' });
        clearPreview();
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
        push: pushFilter || null,
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
      headers: { 'Content-Type': 'application/json', 'x-homecheff-language': language },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (!response.ok || !data?.listOnly) {
          const text = typeof data?.message === 'string' ? data.message : uiCopy(language === 'en' ? 'en' : 'nl', 'admin.notificationCenter.ui.listLoadFailed');
          setListError(text);
          return;
        }
        const recipients = readRecipients(data.recipients);
        const ids = new Set(recipients.map((recipient) => recipient.id));
        setDirectory(recipients);
        const kept = selectedIdsRef.current.filter((id) => ids.has(id));
        const dropped = selectedIdsRef.current.length - kept.length;
        if (dropped > 0) {
          setSelectionDropped({ count: dropped, reason: 'outside' });
          clearPreview();
        }
        setSelectedIds(kept);
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
        setListError(uiCopy(language === 'en' ? 'en' : 'nl', 'admin.notificationCenter.ui.listLoadFailedKeep'));
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
    pushFilter,
    verificationKind,
    verificationStatus,
    agreementOpen,
    accountStatus,
    pendingStep,
    listVersion,
    listable,
    draftReady,
    language,
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
                role: typeof row.role === 'string' ? row.role : uiCopy(language === 'en' ? 'en' : 'nl', 'admin.notificationCenter.ui.roleAdmin'),
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
  }, [adminQuery, sendEmail, sendNotification, language]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      if (typeof draft.message === 'string') setMessage(draft.message);
      if (typeof draft.subject === 'string') setSubject(draft.subject);
      if (typeof draft.linkPreset === 'string') setLinkPreset(draft.linkPreset);
      if (typeof draft.buttonLabel === 'string') setButtonLabel(draft.buttonLabel);
      if (draft.audience === 'applicable' || draft.audience === 'all' || draft.audience === 'buyers' || draft.audience === 'sellers' || draft.audience === 'delivery') {
        setAudience(draft.audience);
      }
      if (draft.matchMode === 'all' || draft.matchMode === 'any') setMatchMode(draft.matchMode);
      if (draft.stripe === 'ready' || draft.stripe === 'not_ready') setStripe(draft.stripe);
      else if (draft.stripe === 'none' || draft.stripe === 'incomplete' || draft.stripe === 'review') setStripe('not_ready');
      if (draft.push === 'registered' || draft.push === 'unregistered') setPushFilter(draft.push);
      if (typeof draft.verificationKind === 'string') setVerificationKind(draft.verificationKind as VerificationKind | '');
      if (typeof draft.verificationStatus === 'string') setVerificationStatus(draft.verificationStatus as VerificationStatus | '');
      if (typeof draft.agreementOpen === 'boolean') setAgreementOpen(draft.agreementOpen);
      if (typeof draft.accountStatus === 'string') setAccountStatus(draft.accountStatus as AccountStatusFilter | '');
      if (typeof draft.pendingStep === 'string') setPendingStep(draft.pendingStep as PendingStepId | '');
      if (Array.isArray(draft.selectedIds)) setSelectedIds(draft.selectedIds.filter((id): id is string => typeof id === 'string'));
      if (Array.isArray(draft.explicitReviewIds)) setExplicitReviewIds(draft.explicitReviewIds.filter((id): id is string => typeof id === 'string'));
      if (Array.isArray(draft.addedAdmins)) {
        setAddedAdmins(draft.addedAdmins.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const row = item as Record<string, unknown>;
          if (typeof row.id !== 'string' || typeof row.name !== 'string') return [];
          const channels = Array.isArray(row.channels)
            ? row.channels.filter((channel): channel is 'email' | 'push' => channel === 'email' || channel === 'push')
            : [];
          return [{ id: row.id, name: row.name, email: typeof row.email === 'string' ? row.email : null, channels }];
        }));
      }
      if (typeof draft.sendNotification === 'boolean') setSendNotification(draft.sendNotification);
      if (typeof draft.sendEmail === 'boolean') setSendEmail(draft.sendEmail);
      if (typeof draft.confirmEmailBlast === 'boolean') setConfirmEmailBlast(draft.confirmEmailBlast);
      if (typeof draft.confirmRepeat === 'boolean') setConfirmRepeat(draft.confirmRepeat);
      if (draft.screen === 'history' || draft.screen === 'compose') setScreen(draft.screen);
      setPreview(null);
      setPreviewStale(true);
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      message,
      subject,
      linkPreset,
      buttonLabel,
      audience,
      matchMode,
      stripe,
      push: pushFilter,
      verificationKind,
      verificationStatus,
      agreementOpen,
      accountStatus,
      pendingStep,
      selectedIds,
      explicitReviewIds,
      addedAdmins,
      sendNotification,
      sendEmail,
      confirmEmailBlast,
      confirmRepeat,
      screen,
    }));
  }, [
    draftReady,
    message,
    subject,
    linkPreset,
    buttonLabel,
    audience,
    matchMode,
    stripe,
    pushFilter,
    verificationKind,
    verificationStatus,
    agreementOpen,
    accountStatus,
    pendingStep,
    selectedIds,
    explicitReviewIds,
    addedAdmins,
    sendNotification,
    sendEmail,
    confirmEmailBlast,
    confirmRepeat,
    screen,
  ]);

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
    const hash = `${message.trim()}\n${subject.trim()}\n${linkPreset}\n${buttonLabel.trim()}`;
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
      route: linkPreset,
      buttonLabel: buttonLabel.trim(),
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
      setNotice({ tone: 'error', lines: [copy('applicableNeedsFilter')] });
      return;
    }
    if (selectedIds.length === 0 && addedAdmins.length === 0) {
      setNotice({ tone: 'error', lines: [copy('needRecipient')] });
      return;
    }
    if (!message.trim()) {
      setNotice({ tone: 'error', lines: [copy('fillMessage')] });
      return;
    }
    const noticeButton = resolveAdminNoticeButton(buttonLabel, linkPreset);
    if (!noticeButton.ok) {
      setNotice({ tone: 'error', lines: [copy(noticeButton.errorKey)] });
      return;
    }
    if (!sendNotification && !sendEmail) {
      setNotice({ tone: 'error', lines: [t('admin.notificationCenter.selectDeliveryMethod')] });
      return;
    }
    if (!subject.trim()) {
      setNotice({ tone: 'error', lines: [t('admin.notificationCenter.enterEmailSubject')] });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': campaignKey(), 'x-homecheff-language': language },
        body: JSON.stringify(payload(true)),
      });
      const data = await response.json().catch(() => null);
      const parsed = linesFrom(data, response.status, copy('fallbackNotice'));
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
        emailOffer: data.emailOffer === 'paused' || data.emailOffer === 'no_address' || data.emailOffer === 'ready' || data.emailOffer === 'off'
          ? data.emailOffer
          : undefined,
      });
      setNotice(null);
    } catch {
      clearPreview();
      setNotice({ tone: 'error', lines: [copy('previewFetchFailed')] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    setAttemptedSend(true);
    if (submitLockRef.current || isLoading) return;
    if (selectedIds.length === 0 && addedAdmins.length === 0) {
      setNotice({ tone: 'error', lines: [copy('needRecipient')] });
      return;
    }
    if (!preview?.previewToken) {
      setNotice({ tone: 'error', lines: [copy('needPreviewFirst')] });
      return;
    }
    if (preview.total === 0) {
      setNotice({ tone: 'error', lines: [copy('noneForSelection')] });
      return;
    }
    setIsLoading(true);
    submitLockRef.current = true;
    setNotice(null);
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': campaignKey(), 'x-homecheff-language': language },
        body: JSON.stringify(payload(false)),
      });
      const data = await response.json().catch(() => null);
      const parsed = linesFrom(data, response.status, copy('fallbackNotice'));
      setNotice(parsed);
      if (response.ok && data?.outcome === 'sent') {
        setAttemptedSend(false);
        setMessage('');
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
        lines: [copy('sendInterrupted')],
      });
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  const applyPreset = (id: string) => {
    const preset = AUDIENCE_PRESETS.find((item) => item.id === id);
    if (!preset?.available || !preset.selection) {
      setNotice({ tone: 'error', lines: [copy(`presets.${id}.reason`) || copy('presetUnavailable')] });
      return;
    }
    const next = preset.selection;
    setAudience(next.audience);
    setMatchMode(next.match);
    setStripe(next.stripe || '');
    setPushFilter(next.push || '');
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
    if (id === 'push') setPushFilter('');
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
    setPushFilter('');
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
      ? { tone: 'success', lines: [copy('filtersCleared')] }
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
  }, language === 'en' ? 'en' : 'nl');
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
  const filterChips = selectionFilterChips(currentSelection, language === 'en' ? 'en' : 'nl');
  const plainSummary = selectionPlainSummary(currentSelection, language === 'en' ? 'en' : 'nl');
  const withEmail = directory.filter((recipient) => recipient.email).length;
  const withPush = directory.filter((recipient) => recipient.pushReachable).length;
  const stripeName = (status: string | undefined) => (
    status === 'none' || status === 'incomplete' || status === 'ready' || status === 'review' || status === 'not_ready'
      ? stripeChoiceLabel(status, language === 'en' ? 'en' : 'nl')
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
            {copy('newMessage')}
          </button>
          <button
            type="button"
            onClick={() => setScreen('history')}
            className={`rounded-lg px-3 py-2 text-sm ${screen === 'history' ? 'bg-emerald-700 text-white' : 'border border-gray-300 text-gray-700'}`}
          >
            {copy('historyTab')}
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
            <h3 className="text-base font-semibold text-gray-900">{copy('stepAudience')}</h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {AUDIENCE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!preset.available}
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <span className="block font-medium text-gray-900">{copy(`presets.${preset.id}.label`)}</span>
                  <span className="mt-1 block text-xs text-gray-600">{preset.available ? copy(`presets.${preset.id}.description`) : copy(`presets.${preset.id}.reason`) || copy('presetUnavailable')}</span>
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
                <option value="applicable">{copy('audienceApplicable')}</option>
                <option value="all">{t('admin.notificationCenter.allUsers')}</option>
                <option value="sellers">{t('admin.notificationCenter.sellersOnly')}</option>
                <option value="buyers">{t('admin.notificationCenter.buyersOnly')}</option>
                <option value="delivery">{copy('audienceDelivery')}</option>
              </select>
            </label>
            <p className="text-sm text-gray-700">
              {audience === 'all' ? copy('audienceAllHelp') : copy('audienceApplicableHelp')}
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">{copy('stepFilters')}</h3>
            <p className="text-sm text-gray-600">{copy('verificationOneChoice')}</p>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">{copy('combineFilters')}</span>
              <select
                value={matchMode}
                onChange={(event) => {
                  setMatchMode(event.target.value as 'all' | 'any');
                  invalidatePreview();
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">{copy('matchAll')}</option>
                <option value="any">{copy('matchAny')}</option>
              </select>
              <span className="mt-1 block text-sm text-gray-700">
                {matchMode === 'all' ? copy('matchAllHelp') : copy('matchAnyHelp')}
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">{copy('stripeLabel')}</span>
                <span className="mt-1 block text-xs text-gray-600">{copy('stripeShared')}</span>
                <select
                  value={stripe}
                  onChange={(event) => {
                    setStripe(event.target.value as StripeAudienceFilter | '');
                    invalidatePreview();
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{copy('noStripeFilter')}</option>
                  <option value="ready">{stripeChoiceLabel('ready', language === 'en' ? 'en' : 'nl')}</option>
                  <option value="not_ready">{stripeChoiceLabel('not_ready', language === 'en' ? 'en' : 'nl')}</option>
                </select>
                <span className="mt-1 block text-xs text-gray-600">{copy('stripeFilterHelp')}</span>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">{copy('pushLabel')}</span>
                <select
                  value={pushFilter}
                  onChange={(event) => {
                    setPushFilter(event.target.value as PushAudienceFilter | '');
                    invalidatePreview();
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{copy('noPushFilter')}</option>
                  <option value="registered">{copy('pushRegistered')}</option>
                  <option value="unregistered">{copy('pushUnregistered')}</option>
                </select>
                <span className="mt-1 block text-xs text-gray-600">{copy('pushFilterHelp')}</span>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">{copy('emailVerification')}</span>
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
                  <option value="">{copy('noEmailFilter')}</option>
                  <option value="verified">{copy('emailVerified')}</option>
                  <option value="unverified">{copy('emailUnverified')}</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">{copy('account')}</span>
                <select
                  value={accountStatus}
                  onChange={(event) => {
                    setAccountStatus(event.target.value as AccountStatusFilter | '');
                    invalidatePreview();
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{copy('noAccountFilter')}</option>
                  <option value="active">{copy('accountActive')}</option>
                  <option value="blocked">{copy('accountBlocked')}</option>
                  <option value="courier_blocked">{copy('courierBlocked')}</option>
                </select>
              </label>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{copy('deliverySection')}</p>
                <p className="text-xs text-gray-600">{copy('deliverySectionHelp')}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">{copy('courierVerification')}</span>
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
                    <option value="">{copy('noCourierFilter')}</option>
                    <option value="verified">{copy('courierVerified')}</option>
                    <option value="unverified">{copy('courierUnverified')}</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">{copy('pendingStep')}</span>
                  <select
                    value={pendingStep}
                    onChange={(event) => {
                      setPendingStep(event.target.value as PendingStepId | '');
                      invalidatePreview();
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{copy('noStepFilter')}</option>
                    <option value="delivery_age">{copy('stepAge')}</option>
                    <option value="delivery_pricing">{copy('stepPrice')}</option>
                    <option value="delivery_service_area">{copy('stepArea')}</option>
                    <option value="delivery_availability">{copy('stepAvailability')}</option>
                    <option value="delivery_company_name">{copy('stepCompany')}</option>
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
                  {copy('agreementCheckbox', { name: agreementVersionLabel(DELIVERY_AGREEMENT_VERSION, language === 'en' ? 'en' : 'nl') })}
                </span>
              </label>
            </div>

            {(audience === 'sellers' || audience === 'applicable' || audience === 'all' || verificationKind === 'commerce_review') && (
              <label className="block text-sm">
                <span className="font-medium text-gray-700">{copy('salesReview')}</span>
                <span className="mt-1 block text-xs text-gray-600">{copy('salesReviewHelp')}</span>
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
                  <option value="">{copy('noSalesReview')}</option>
                  <option value="verified">{copy('salesReviewDone')}</option>
                  <option value="unverified">{copy('salesReviewNeeded')}</option>
                  <option value="pending">{copy('salesReviewPending')}</option>
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
                  <span className="sr-only">{copy('removeChip', { label: chip.label })}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-800"
              >
                {copy('clearFilters')}
              </button>
            </div>
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{plainSummary}</p>
            <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <summary className="cursor-pointer font-medium text-gray-900">{copy('technicalDetails')}</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {['activityUnavailable', 'factInactive', 'factStripePending', 'factEmail', 'factCourier', 'factTerms', 'factSharedStripe', 'factUnknownCheck'].map((key) => (
                  <li key={key}>{copy(key)}</li>
                ))}
              </ul>
            </details>
          </section>

          <div id="notification-recipients" className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{copy('stepRecipients')}</h3>
              <p className="text-sm text-gray-900">
                {!listable
                  ? copy('recipientsNeedFilter')
                  : listLoading
                    ? copy('recipientsLoading')
                    : copy('filterCount', { unique: directory.length, checked: selectedCount })}
              </p>
              {listable && !listLoading && directory.length > 0 && (
                <p className="text-sm text-gray-700">
                  {copy('filterStats', { email: withEmail, noEmail: directory.length - withEmail, push: withPush, noPush: directory.length - withPush })}
                  {query ? ` ${copy('searchShows', { count: searchHits.length })}` : ''} {copy('filterListNote')}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2" style={{ overflowAnchor: 'none' }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{copy('selectedHeading')}</h4>
                <p className="text-sm text-gray-900">{copy('selectedCount', { count: chosen.length })}</p>
              </div>
              <p className="text-sm text-gray-800">{copy('selectedExplain')}</p>
              {selectionDropped && (
                <p className="text-sm font-medium text-amber-950">
                  {copy(
                    selectionDropped.reason === 'unfiltered'
                      ? (selectionDropped.count === 1 ? 'dropUnfilteredOne' : 'dropUnfilteredMany')
                      : (selectionDropped.count === 1 ? 'dropOutsideOne' : 'dropOutsideMany'),
                    { count: selectionDropped.count },
                  )}
                </p>
              )}
              {chosen.length === 0 ? (
                <p className="text-sm text-gray-700">{copy('selectedEmpty')}</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {visibleChosen.map((person) => (
                      <li key={person.id} className="flex flex-wrap items-start justify-between gap-2 rounded border border-emerald-100 bg-white px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-800">{person.email || copy('noEmail')}</p>
                          <p className="text-xs text-gray-700">
                            {person.fromAudience && person.manual
                              ? copy('originBoth')
                              : person.manual
                                ? copy('originManual')
                                : person.fromAudience
                                  ? copy('originAudience')
                                  : copy('originMissing')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeChosen(person.id)}
                          className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-800"
                        >
                          {copy('remove')}
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
                      {selectionExpanded ? copy('showLess') : copy('showAll', { count: chosen.length })}
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
                  placeholder={copy('searchName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const reviewIds = directory.filter((recipient) => recipient.requiresExplicitCheck).map((recipient) => recipient.id);
                      setExplicitReviewIds(reviewIds);
                      changeChecked(directory.map((recipient) => recipient.id));
                    }}
                    disabled={directory.length === 0}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                  >
                    {copy('selectAll')}
                  </button>
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        const reviewIds = searchHits.filter((recipient) => recipient.requiresExplicitCheck).map((recipient) => recipient.id);
                        setExplicitReviewIds((current) => [...new Set([...current, ...reviewIds])]);
                        changeChecked([...new Set([
                          ...selectedIds,
                          ...searchHits.map((recipient) => recipient.id),
                        ])]);
                      }}
                      disabled={searchHits.length === 0}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
                    >
                      {copy('selectSearch')}
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
                    {copy('clearSelection')}
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  {query ? copy('selectSearchHelp') : copy('selectAllHelp')}
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
                  <p className="text-sm text-gray-600">{copy('noUsers')}</p>
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
                        aria-label={copy('selectPerson', { name: recipient.name })}
                        className="mt-1 rounded border-gray-300 text-emerald-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{recipient.name}</p>
                        <p className="text-sm text-gray-800">{recipient.roles.join(' · ') || copy('noRole')}</p>
                        <p className="text-sm text-gray-600">{recipient.email || copy('noEmail')}</p>
                        {stripe && (recipient.connectLabel || recipient.stripeStatus) ? <p className="text-sm text-gray-900">{copy('stripeLine', { status: recipient.connectLabel || stripeName(recipient.stripeStatus) })}</p> : null}
                        <p className="text-sm text-gray-700">
                          {recipient.email ? copy('emailPresent') : copy('emailDrops')}
                          {' '}
                          {recipient.pushReachable ? copy('pushPresent') : copy('pushDrops')}
                        </p>
                        {recipient.requiresExplicitCheck ? (
                          <p className="text-sm text-amber-900">{copy('explicitCheck')}</p>
                        ) : null}
                        <p className="text-sm text-emerald-900">{(recipient.reasons || []).join(' · ')}</p>
                        {(recipient.alreadySent || []).map((prior) => (
                          <p key={`${prior.channel}-${prior.at}`} className="text-sm text-amber-900">
                            {copy('alreadySent', { label: prior.label })}
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
                      {copy('previous')}
                    </button>
                    <span>{copy('page', { page: safePage + 1, total: pageCount })}</span>
                    <button
                      type="button"
                      onClick={() => setRecipientPage(Math.min(pageCount - 1, safePage + 1))}
                      disabled={safePage >= pageCount - 1}
                      className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                    >
                      {copy('next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {(sendEmail || sendNotification) && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div>
                <h3 className="text-base font-medium text-gray-900">{copy('addAdmin')}</h3>
                <p className="text-sm text-gray-700">{copy('addAdminHelp')}</p>
              </div>
              <input
                type="search"
                value={adminQuery}
                onChange={(event) => setAdminQuery(event.target.value)}
                placeholder={copy('adminSearchPlaceholder')}
                aria-label={copy('adminSearchLabel')}
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
                          {copy('add')}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
              {addedAdmins.length === 0 ? (
                <p className="text-sm text-gray-600">{copy('noAdminYet')}</p>
              ) : (
                <ul className="space-y-3">
                  {addedAdmins.map((admin) => (
                    <li key={admin.id} className="rounded border px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                      <p className="text-sm text-gray-600">{admin.email || copy('noEmail')}</p>
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
                            {copy('emailName')}
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
                            {copy('pushName')}
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
                            {copy('bothChannels')}
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
                          {copy('remove')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">{copy('stepChannels')}</h3>
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
                <span className="text-sm text-gray-700">{copy('inAppPush')}</span>
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

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">{copy('stepMessage')}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="notice-subject">
                {t('admin.notificationCenter.emailSubject')}
              </label>
              <input
                id="notice-subject"
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
              <p className="mt-1 text-sm text-gray-500">{t('admin.notificationCenter.subjectHelp')}</p>
            </div>
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
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">{copy('stepAction')}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="notice-button-label">
                {copy('buttonLabel')}
              </label>
              <input
                id="notice-button-label"
                type="text"
                value={buttonLabel}
                onChange={(event) => {
                  setButtonLabel(event.target.value);
                  invalidatePreview();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={copy('buttonLabelPlaceholder')}
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="notice-button-route">
                {copy('buttonDestination')}
              </label>
              <select
                id="notice-button-route"
                value={linkPreset}
                onChange={(event) => {
                  setLinkPreset(event.target.value);
                  invalidatePreview();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">{copy('buttonNone')}</option>
                <option value="/delivery/dashboard">{copy('routeStripe')}</option>
                <option value="/delivery/settings">{copy('routeDeliverySettings')}</option>
                <option value="/sell/new">{copy('routeSell')}</option>
                <option value="/app">{t('admin.notificationCenter.routeBetaApp')}</option>
                <option value="/mijn-hcp">{t('admin.notificationCenter.routeMijnHcp')}</option>
                <option value="/profile">{t('admin.notificationCenter.routeProfile')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">{copy('buttonHelp')}</p>
            </div>
          </div>

          {sendEmail && preview?.emailOffer === 'paused' && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950" role="status">
              <p className="font-medium">{copy('emailPaused')}</p>
            </div>
          )}
          {sendEmail && preview?.emailOffer === 'ready' && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950" role="status">
              <p className="font-medium">{copy('emailReady')}</p>
            </div>
          )}
          {sendEmail && preview?.emailOffer === 'no_address' && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">
              <p className="font-medium">{copy('noEmail')}</p>
            </div>
          )}

          {sendEmail && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-medium">{copy('emailCapacityTitle')}</p>
              <p className="mt-1">{copy('emailCapacityBody')}</p>
              {preview?.requiresConfirm && (
                <label className="mt-3 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={confirmEmailBlast}
                    onChange={(event) => setConfirmEmailBlast(event.target.checked)}
                    aria-invalid={fieldInvalid('email-confirm')}
                    className="mt-1 rounded border-gray-300 text-emerald-600"
                  />
                  <span>{copy('emailConfirm')}</span>
                </label>
              )}
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
              {copy('repeatConfirm')}
            </span>
          </label>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">{copy('stepPreview')}</h3>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => document.getElementById('notification-recipients')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              disabled={!listable}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-emerald-700 text-emerald-800 disabled:opacity-50"
            >
              {copy('viewRecipients')}
            </button>
            <button
              type="button"
              onClick={loadPreview}
              disabled={isLoading || chosen.length === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-emerald-700 text-emerald-800 disabled:opacity-50"
            >
              {(previewStale || (preview != null && preview.total === 0)) ? copy('refreshPreview') : copy('previewButton')}
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
              ? copy('sendingBusy')
              : sendBlock
                ? t(sendBlock.action)
                : copy('previewMatches')}
          </p>
          </div>
        </form>
      </div>

      {(preview || (sendEmail && message.trim())) && (
        <div className={`grid items-start gap-4 ${preview && sendEmail && message.trim() ? 'xl:grid-cols-[minmax(0,1fr)_420px]' : ''}`}>
      {preview && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4" role="status">
          <h3 className="text-lg font-medium text-gray-900">{copy('definitiveSelection')}</h3>
          {preview.proof && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              {copy('proof', { unique: preview.proof.unique, fromFilters: preview.proof.fromFilters, manualOnly: preview.proof.manualOnly })}
              {preview.proof.fromFilters === 0 ? ` ${copy('proofNone')}` : ` ${copy('proofUnchecked')}`}
            </p>
          )}
          <ul className="space-y-1 text-sm text-gray-800">
            {(preview.proof ? preview.lines.filter((line) => line !== preview.proof?.line) : preview.lines).map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-900">
            {copy('channelTotals', { inApp: preview.channels.inApp, push: preview.channels.push, email: preview.channels.email })}
            {' '}{copy('acceptanceNotDelivery')}
          </p>
          {preview.error && <p className="text-sm text-red-800">{preview.error}</p>}
          {!preview.previewToken && (
            <p className="text-sm font-medium text-amber-900">
              {copy('previewChanged')}
            </p>
          )}
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {preview.recipients.map((recipient) => (
              <li key={recipient.id} className="rounded border px-3 py-2">
                <p className="font-medium text-gray-900">{recipient.name}</p>
                <p className="text-gray-800">{recipient.roles.join(' · ') || copy('noRole')}</p>
                <p className="text-gray-600">{recipient.email || copy('noEmail')}</p>
                {recipient.stripeStatus ? <p className="text-gray-900">{copy('stripeLine', { status: recipient.connectLabel || stripeName(recipient.stripeStatus) })}</p> : null}
                {recipient.requiresExplicitCheck ? (
                  <p className="text-amber-900">{copy('explicitChecked')}</p>
                ) : null}
                <p className="text-emerald-900">{(recipient.reasons || []).join(' · ')}</p>
                {(recipient.channelLines || []).map((line) => (
                  <p key={line} className="text-gray-800">{line}</p>
                ))}
                {(recipient.alreadySent || []).map((prior) => (
                  <p key={`${prior.channel}-${prior.at}`} className="text-amber-900">{copy('alreadySent', { label: prior.label })}</p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
          {sendEmail && message.trim() && (
            <AdminEmailPreview
              subject={subject}
              message={message}
              lang={language === 'en' ? 'en' : 'nl'}
              recipientName={(preview?.recipients?.[0] ?? chosen[0])?.name}
              recipientCount={preview?.recipients?.length || chosen.length}
              action={{ label: copy('openNotice'), url: 'https://homecheff.eu/messages/' }}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{copy('usersCard')}</h3>
              <p className="text-sm text-gray-500">{copy('usersCardHelp')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg"><Mail className="w-6 h-6 text-green-600" /></div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{copy('emailCard')}</h3>
              <p className="text-sm text-gray-500">{copy('emailCardHelp')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg"><AlertCircle className="w-6 h-6 text-purple-600" /></div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{copy('repeatCard')}</h3>
              <p className="text-sm text-gray-500">{copy('repeatCardHelp')}</p>
            </div>
          </div>
        </div>
      </div>
      </>
      ) : null}
    </div>
  );
}
