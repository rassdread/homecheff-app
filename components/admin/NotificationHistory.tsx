'use client';

import { useEffect, useState } from 'react';

type ChannelStatus = {
  channel: string;
  status: string;
  received: boolean;
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
  }>;
};

function when(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Amsterdam',
  }).format(date);
}

function recipientLabel(count: number, incomplete: boolean): string {
  if (count === 0 && incomplete) return 'Ontvangers niet geregistreerd';
  if (count === 1) return '1 ontvanger';
  return `${count} ontvangers`;
}

function statusClass(status: ChannelStatus): string {
  if (status.status === 'Mislukt') return 'text-red-800';
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
      fetch(`/api/admin/notifications/history?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await response.json().catch(() => null);
          if (!response.ok) {
            setError(typeof data?.error === 'string' ? data.error : 'De verzendgeschiedenis kon niet worden geladen.');
            setSends([]);
            return;
          }
          setError('');
          setSends(Array.isArray(data?.sends) ? data.sends : []);
          setNote(typeof data?.note === 'string' ? data.note : '');
        })
        .catch(() => {
          if (!controller.signal.aborted) setError('De verzendgeschiedenis kon niet worden geladen.');
        });
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, period, channel]);

  const openSend = async (id: string) => {
    setError('');
    const response = await fetch(`/api/admin/notifications/history?id=${encodeURIComponent(id)}`);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.summary) {
      setError(typeof data?.error === 'string' ? data.error : 'Deze verzending kon niet worden geopend.');
      return;
    }
    setDetail(data as HistoryDetail);
  };

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4 sm:p-6">
      <div>
        <h3 className="text-base font-medium text-gray-900">Verzendgeschiedenis</h3>
        <p className="mt-1 text-sm text-gray-600">
          Nieuwste verzending eerst. Zoek een persoon om diens berichten met onderwerp, tijdstip en kanaal te zien.
        </p>
      </div>
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setDetail(null);
        }}
        placeholder="Zoek op naam, e-mailadres of onderwerp"
        aria-label="Zoek op naam, e-mailadres of onderwerp"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value);
            setDetail(null);
          }}
          aria-label="Periode"
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="all">Alle periodes</option>
          <option value="7">Laatste 7 dagen</option>
          <option value="30">Laatste 30 dagen</option>
          <option value="90">Laatste 90 dagen</option>
        </select>
        <select
          value={channel}
          onChange={(event) => {
            setChannel(event.target.value);
            setDetail(null);
          }}
          aria-label="Kanaal"
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="all">Alle kanalen</option>
          <option value="inApp">In-app</option>
          <option value="push">Push</option>
          <option value="email">E-mail</option>
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
            Terug naar overzicht
          </button>
          <h4 className="mt-2 font-medium text-gray-900">{detail.summary.subject}</h4>
          <p className="mt-1 text-sm text-gray-600">
            {when(detail.summary.at)} · {detail.summary.audience} · {detail.summary.channels.join(', ') || 'Kanaal niet geregistreerd'} · {recipientLabel(detail.summary.recipientCount, detail.summary.incomplete)}
          </p>
          {detail.summary.note ? <p className="mt-1 text-sm text-amber-900">{detail.summary.note}</p> : null}
          {detail.messageMissing ? (
            <p className="mt-3 text-sm text-amber-900">De oorspronkelijke berichttekst is niet opgeslagen.</p>
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{detail.message}</p>
          )}
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {detail.recipients.map((recipient) => (
              <li key={recipient.id} className="rounded border px-3 py-2 text-sm">
                <p className="truncate font-medium text-gray-900">{recipient.name}</p>
                <p className="truncate text-gray-600">{recipient.email || 'Geen e-mailadres'}</p>
                {recipient.channels.map((channel) => (
                  <p key={channel.channel} className={statusClass(channel)}>
                    {channel.channel}: {channel.status}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="space-y-2">
          {sends.length === 0 ? <li className="text-sm text-gray-600">Geen verzendingen in deze selectie.</li> : null}
          {sends.map((send) => (
            <li key={send.focus ? `${send.id}:${send.focus.userId}` : send.id}>
              <button
                type="button"
                onClick={() => openSend(send.id)}
                className="w-full rounded-lg border px-3 py-2 text-left hover:bg-gray-50"
              >
                <span className="block truncate text-sm font-medium text-gray-900">{send.subject}</span>
                <span className="mt-0.5 block text-xs text-gray-600 sm:text-sm">
                  {when(send.at)} · {send.audience} · {send.channels.join(', ') || 'Kanaal niet geregistreerd'} · {recipientLabel(send.recipientCount, send.incomplete)}
                </span>
                {send.focus ? (
                  <span className="mt-0.5 block text-xs text-gray-800 sm:text-sm">
                    {send.focus.name}
                    {send.focus.email ? ` · ${send.focus.email}` : ''}
                    {' · '}
                    {send.focus.channels.map((channel) => `${channel.channel}: ${channel.status}`).join(' · ')}
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
