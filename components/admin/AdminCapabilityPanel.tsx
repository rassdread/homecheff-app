'use client';

import { useEffect, useState } from 'react';

type Administrator = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  suspended: boolean;
  explicit: boolean;
  capabilities: string[];
};

type Payload = {
  capabilities: string[];
  templates: Record<string, string[]>;
  administrators: Administrator[];
};

export default function AdminCapabilityPanel() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [template, setTemplate] = useState('READ_ONLY_ADMIN');
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function load(search = query) {
    const response = await fetch(`/api/admin/capabilities${search ? `?q=${encodeURIComponent(search)}` : ''}`);
    if (!response.ok) {
      setMessage('Alleen een superadmin kan rechten beheren.');
      return;
    }
    const body = (await response.json()) as Payload;
    setPayload(body);
    if (!targetUserId && body.administrators[0]) setTargetUserId(body.administrators[0].id);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(action: 'assign' | 'revoke' | 'suspend' | 'restore') {
    setMessage(null);
    const response = await fetch('/api/admin/capabilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, template, reason, action }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Opslaan mislukt');
      return;
    }
    setMessage('Opgeslagen');
    setReason('');
    await load();
  }

  if (!payload) return <p className="text-sm text-gray-500">Rechten laden…</p>;

  const selected = payload.administrators.find((admin) => admin.id === targetUserId);

  return (
    <section className="rounded-xl border bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Administrators en rechten</h2>
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void load(query); }}>
        <input className="flex-1 rounded border px-2 py-2 text-sm" placeholder="Zoek gebruiker" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="submit" className="rounded border px-3 py-2 text-sm">Zoek</button>
      </form>
      <p className="text-sm text-gray-600">
        Een subadmin krijgt alleen de gekozen rechten. Financieel uitvoeren zit niet in de algemene beheer-templates.
      </p>
      <label className="block text-sm">
        Administrator
        <select className="mt-1 w-full rounded border px-2 py-2" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)}>
          {payload.administrators.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.email} · {admin.role}{admin.suspended ? ' · geschorst' : ''}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <p className="text-xs text-gray-600">
          {selected.explicit ? selected.capabilities.join(', ') || 'Geen rechten' : 'Nog niet omgezet naar expliciete rechten'}
        </p>
      ) : null}
      <label className="block text-sm">
        Template
        <select className="mt-1 w-full rounded border px-2 py-2" value={template} onChange={(event) => setTemplate(event.target.value)}>
          {Object.keys(payload.templates).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Reden
        <input className="mt-1 w-full rounded border px-2 py-2" value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded bg-emerald-700 px-3 py-2 text-sm text-white" onClick={() => submit('assign')}>Opslaan</button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => submit('revoke')}>Intrekken</button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => submit('suspend')}>Schorsen</button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => submit('restore')}>Herstellen</button>
      </div>
      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
    </section>
  );
}
