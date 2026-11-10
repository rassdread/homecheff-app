'use client';

import { useEffect, useState } from 'react';

type HistorySummary = {
  id: string;
  subject: string;
  at: string;
  audience: string;
  channels: string[];
  incomplete: boolean;
  note: string | null;
};

type HistoryDetail = {
  summary: HistorySummary;
  message: string;
  recipients: Array<{
    id: string;
    name: string;
    email: string | null;
    message: string;
    channels: Array<{ channel: string; status: string }>;
  }>;
};

function when(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function NotificationHistory() {
  const [query, setQuery] = useState('');
  const [sends, setSends] = useState<HistorySummary[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<HistoryDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const handle = setTimeout(() => {
      fetch(`/api/admin/notifications/history?q=${encodeURIComponent(query)}`, { signal: controller.signal })
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
  }, [query]);

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
    <div className="space-y-4 rounded-xl border bg-white p-6">
      <div>
        <h3 className="text-base font-medium text-gray-900">Verzendgeschiedenis</h3>
        <p className="mt-1 text-sm text-gray-600">
          Onderwerp, tijdstip, doelgroep en kanalen van geregistreerde verzendingen uit Groei en Community.
        </p>
      </div>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Zoek op naam, e-mailadres of onderwerp"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
      {note ? <p className="text-sm text-gray-600">{note}</p> : null}
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <ul className="space-y-2">
        {sends.map((send) => (
          <li key={send.id}>
            <button
              type="button"
              onClick={() => openSend(send.id)}
              className="w-full rounded-lg border px-3 py-2 text-left hover:bg-gray-50"
            >
              <span className="block font-medium text-gray-900">{send.subject}</span>
              <span className="block text-sm text-gray-600">
                {when(send.at)} · {send.audience} · {send.channels.join(', ') || 'Kanaal niet geregistreerd'}
              </span>
              {send.note ? <span className="block text-sm text-amber-900">{send.note}</span> : null}
            </button>
          </li>
        ))}
      </ul>
      {detail ? (
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900">{detail.summary.subject}</h4>
          <p className="mt-1 text-sm text-gray-600">
            {when(detail.summary.at)} · {detail.summary.audience} · {detail.summary.channels.join(', ')}
          </p>
          {detail.summary.note ? <p className="mt-1 text-sm text-amber-900">{detail.summary.note}</p> : null}
          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{detail.message}</p>
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {detail.recipients.map((recipient) => (
              <li key={recipient.id} className="rounded border px-3 py-2 text-sm">
                <p className="font-medium text-gray-900">{recipient.name}</p>
                <p className="text-gray-600">{recipient.email || 'Geen e-mailadres'}</p>
                {recipient.channels.map((channel) => (
                  <p key={channel.channel} className="text-gray-800">
                    {channel.channel}: {channel.status}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
