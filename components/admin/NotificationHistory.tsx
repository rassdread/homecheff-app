'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { uiCopy } from '@/lib/admin/notification-copy';

type ChannelStatus = {
  channel: string;
  channelId?: string;
  code?: string;
  status: string;
  received: boolean;
  detail?: string | null;
};

type HistorySummary = {
  id: string;
  subject: string;
  at: string;
  audience: string;
  channels: string[];
  recipientCount: number;
  incomplete: boolean;
  note: string | null;
  focus: {
    userId: string;
    name: string;
    email: string | null;
    channels: ChannelStatus[];
  } | null;
};

type HistoryDetail = {
  summary: HistorySummary;
  message: string;
  messageMissing: boolean;
    recipients: Array<{
      id: string;
      name: string;
      email: string | null;
      channels: ChannelStatus[];
      note?: string | null;
    }>;
};

function when(value: string, language: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Amsterdam',
  }).format(date);
}

function statusClass(status: ChannelStatus): string {
  if (status.code === 'failed' || status.status === 'Mislukt' || status.status === 'Failed') return 'text-red-800';
  if (!status.received) return 'text-amber-900';
  return 'text-gray-800';
}

function fromDay(period: string): string | null {
  if (period === 'all') return null;
  const days = Number(period);
  if (!Number.isFinite(days) || days <= 0) return null;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function NotificationHistory() {
  const { t, language } = useTranslation();
  const copy = (key: string, params?: Record<string, string | number>) => t(`admin.notificationCenter.ui.${key}`, params);
  const outcomeKey: Record<string, string> = {
    delivered: 'delivered',
    created: 'inAppCreated',
    accepted: 'emailAccepted',
    skipped_duplicate: 'skippedDuplicate',
    failed: 'failed',
    unconfirmed: 'outcomeUnknown',
    no_token: 'noPushDevice',
    suppressed: 'notOffered',
    missing: 'notRecorded',
  };
  const channelKey: Record<string, string> = { inApp: 'inAppName', push: 'pushName', email: 'emailName' };
  const statusText = (item: ChannelStatus) => {
    if (item.channelId === 'push' && item.code === 'accepted') return copy('pushAccepted');
    if (item.channelId === 'inApp' && item.code === 'created') return copy('inAppCreated');
    if (item.code && outcomeKey[item.code]) return copy(outcomeKey[item.code]);
    return item.status;
  };
  const channelText = (item: ChannelStatus) => (
    item.channelId && channelKey[item.channelId] ? copy(channelKey[item.channelId]) : item.channel
  );
  const recipientLabel = (count: number, incomplete: boolean) => {
    if (count === 0 && incomplete) return copy('recipientsUnrecorded');
    if (count === 1) return copy('oneRecipient');
    return copy('manyRecipients', { count });
  };
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('all');
  const [channel, setChannel] = useState('all');
  const [sends, setSends] = useState<HistorySummary[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<HistoryDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      const from = fromDay(period);
      if (from) params.set('from', from);
      if (channel !== 'all') params.set('channel', channel);
      fetch(`/api/admin/notifications/history?${params.toString()}`, {
        signal: controller.signal,
        headers: { 'x-homecheff-language': language },
      })
        .then(async (response) => {
          const data = await response.json().catch(() => null);
          if (!response.ok) {
            setError(typeof data?.error === 'string' ? data.error : uiCopy(language === 'en' ? 'en' : 'nl', 'admin.notificationCenter.ui.historyLoadFailed'));
            setSends([]);
            return;
          }
          setError('');
          setSends(Array.isArray(data?.sends) ? data.sends : []);
          setNote(typeof data?.note === 'string' ? data.note : '');
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(uiCopy(language === 'en' ? 'en' : 'nl', 'admin.notificationCenter.ui.historyLoadFailed'));
        });
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, period, channel, language]);

  const openSend = async (id: string) => {
    setError('');
    const response = await fetch(`/api/admin/notifications/history?id=${encodeURIComponent(id)}`, {
      headers: { 'x-homecheff-language': language },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.summary) {
      setError(typeof data?.error === 'string' ? data.error : copy('historyOpenFailed'));
      return;
    }
    setDetail(data as HistoryDetail);
  };

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4 sm:p-6">
      <div>
        <h3 className="text-base font-medium text-gray-900">{copy('historyTitle')}</h3>
        <p className="mt-1 text-sm text-gray-600">{copy('historyHelp')}</p>
      </div>
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setDetail(null);
        }}
        placeholder={copy('historySearch')}
        aria-label={copy('historySearch')}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value);
            setDetail(null);
          }}
          aria-label={copy('period')}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="all">{copy('allPeriods')}</option>
          <option value="7">{copy('last7')}</option>
          <option value="30">{copy('last30')}</option>
          <option value="90">{copy('last90')}</option>
        </select>
        <select
          value={channel}
          onChange={(event) => {
            setChannel(event.target.value);
            setDetail(null);
          }}
          aria-label={copy('channel')}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="all">{copy('allChannels')}</option>
          <option value="inApp">{copy('inAppName')}</option>
          <option value="push">{copy('pushName')}</option>
          <option value="email">{copy('emailName')}</option>
        </select>
      </div>
      {note ? <p className="text-sm text-gray-600">{note}</p> : null}
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      {detail ? (
        <div className="rounded-lg border border-gray-200 p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="text-sm text-emerald-800"
          >
            {copy('back')}
          </button>
          <h4 className="mt-2 font-medium text-gray-900">{detail.summary.subject}</h4>
          <p className="mt-1 text-sm text-gray-600">
            {when(detail.summary.at, language)} · {detail.summary.audience} · {detail.summary.channels.join(', ') || copy('channelMissing')} · {recipientLabel(detail.summary.recipientCount, detail.summary.incomplete)}
          </p>
          {detail.summary.note ? <p className="mt-1 text-sm text-amber-900">{detail.summary.note}</p> : null}
          {detail.messageMissing ? (
            <p className="mt-3 text-sm text-amber-900">{copy('messageMissing')}</p>
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{detail.message}</p>
          )}
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {detail.recipients.map((recipient) => (
              <li key={recipient.id} className="rounded border px-3 py-2 text-sm">
                <p className="truncate font-medium text-gray-900">{recipient.name}</p>
                <p className="truncate text-gray-600">{recipient.email || copy('noEmail')}</p>
                {recipient.channels.map((channel) => (
                  <p key={channel.channel} className={statusClass(channel)}>
                    {channelText(channel)}: {statusText(channel)}
                    {channel.detail ? <span className="block text-xs">{channel.detail}</span> : null}
                  </p>
                ))}
                {recipient.note ? <p className="text-gray-700">{recipient.note}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="space-y-2">
          {sends.length === 0 ? <li className="text-sm text-gray-600">{copy('historyEmpty')}</li> : null}
          {sends.map((send) => (
            <li key={send.focus ? `${send.id}:${send.focus.userId}` : send.id}>
              <button
                type="button"
                onClick={() => openSend(send.id)}
                className="w-full rounded-lg border px-3 py-2 text-left hover:bg-gray-50"
              >
                <span className="block truncate text-sm font-medium text-gray-900">{send.subject}</span>
                <span className="mt-0.5 block text-xs text-gray-600 sm:text-sm">
                  {when(send.at, language)} · {send.audience} · {send.channels.join(', ') || copy('channelMissing')} · {recipientLabel(send.recipientCount, send.incomplete)}
                </span>
                {send.focus ? (
                  <span className="mt-0.5 block text-xs text-gray-800 sm:text-sm">
                    {send.focus.name}
                    {send.focus.email ? ` · ${send.focus.email}` : ''}
                    {' · '}
                    {send.focus.channels.map((channel) => `${channelText(channel)}: ${statusText(channel)}${channel.detail ? ` (${channel.detail})` : ''}`).join(' · ')}
                  </span>
                ) : null}
                {send.note ? <span className="mt-0.5 block text-xs text-amber-900">{send.note}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
