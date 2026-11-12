'use client';

import { useEffect, useState } from 'react';

type Proposal = {
  id: string;
  role: 'CUSTOMER' | 'COURIER';
  version: number;
  action: string;
  authorRole: string;
  priceCents: number | null;
  agreedCents?: number;
  platformCommissionCents?: number;
  courierCents?: number;
  buyerTotalCents?: number;
  note: string | null;
  itemDescription: string;
  pickupArea: string;
  deliveryArea: string;
};

function eur(cents: number | null) {
  if (cents == null) return 'geen prijs';
  return (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
}

export function TransportProposalInbox() {
  const [rows, setRows] = useState<Proposal[]>([]);
  const [note, setNote] = useState('');
  const [price, setPrice] = useState('');
  const [loadMinutes, setLoadMinutes] = useState('10');
  const [unloadMinutes, setUnloadMinutes] = useState('10');
  const [acceptEstimate, setAcceptEstimate] = useState(false);
  const [ackUnknown, setAckUnknown] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/delivery/standalone/proposal');
    const data = await response.json().catch(() => null);
    if (response.ok) setRows(data.proposals || []);
  }

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      if (document.visibilityState === 'visible') void load();
    };
    tick();
    timer = window.setInterval(tick, 8000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  async function respond(row: Proposal, action: 'ACCEPT' | 'REJECT' | 'COUNTER' | 'QUESTION') {
    setMessage('');
    const response = await fetch('/api/delivery/standalone/proposal/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: row.id,
        expectedVersion: row.version,
        action,
        note,
        priceCents: action === 'COUNTER' ? Math.round(Number(price.replace(',', '.')) * 100) : null,
        confirmation: action === 'ACCEPT'
          ? {
              loadMinutes: Number(loadMinutes),
              unloadMinutes: Number(unloadMinutes),
              acceptEstimatedDrive: acceptEstimate,
              acknowledgeUnknownConnections: ackUnknown,
            }
          : null,
      }),
    });
    const data = await response.json().catch(() => null);
    setMessage(response.ok ? 'Verstuurd. Er is nog niets betaald.' : data?.error || 'Lukte niet');
    await load();
  }

  if (rows.length === 0) return null;
  return (
    <section className="mb-4 rounded-xl border bg-white p-4">
      <h2 className="font-semibold text-gray-900">Verhuisvoorstellen</h2>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-lg border p-3 text-sm">
            <p>{row.itemDescription}</p>
            <p className="text-gray-600">{row.pickupArea} → {row.deliveryArea}</p>
            <p>Afgesproken of voorgesteld bedrag {eur(row.agreedCents ?? row.priceCents)} · versie {row.version} · {row.action}</p>
            {row.platformCommissionCents != null ? <p>Platformkosten {eur(row.platformCommissionCents)}</p> : null}
            {row.buyerTotalCents != null ? <p>Totaal voor de klant {eur(row.buyerTotalCents)}</p> : null}
            {row.courierCents != null ? <p>Voor de bezorger {eur(row.courierCents)}</p> : null}
            {row.note && <p className="text-gray-600">{row.note}</p>}
            <div className="mt-2 grid gap-2">
              {row.authorRole !== row.role && row.action !== 'QUESTION' && (
                <>
                  <label className="text-xs text-gray-600">
                    Laden (minuten)
                    <input className="mt-1 min-h-11 w-full rounded-lg border px-3 py-2" inputMode="numeric" value={loadMinutes} onChange={(event) => setLoadMinutes(event.target.value)} />
                  </label>
                  <label className="text-xs text-gray-600">
                    Lossen (minuten)
                    <input className="mt-1 min-h-11 w-full rounded-lg border px-3 py-2" inputMode="numeric" value={unloadMinutes} onChange={(event) => setUnloadMinutes(event.target.value)} />
                  </label>
                  <label className="flex min-h-11 items-center gap-2">
                    <input type="checkbox" checked={acceptEstimate} onChange={(event) => setAcceptEstimate(event.target.checked)} />
                    Geschatte reistijd bevestigen
                  </label>
                  <label className="flex min-h-11 items-center gap-2">
                    <input type="checkbox" checked={ackUnknown} onChange={(event) => setAckUnknown(event.target.checked)} />
                    Onbekende aansluiting bevestigen
                  </label>
                  <button type="button" className="min-h-11 rounded-lg bg-emerald-700 px-3 py-2 text-white" onClick={() => respond(row, 'ACCEPT')}>Accepteren</button>
                </>
              )}
              <button type="button" className="min-h-11 rounded-lg border px-3 py-2" onClick={() => respond(row, 'REJECT')}>Weigeren</button>
              <input className="min-h-11 rounded-lg border px-3 py-2" placeholder="Tegenvoorstel in euro" value={price} onChange={(event) => setPrice(event.target.value)} />
              <button type="button" className="min-h-11 rounded-lg border px-3 py-2" onClick={() => respond(row, 'COUNTER')}>Tegenvoorstel</button>
              <textarea className="rounded-lg border px-3 py-2" rows={2} placeholder="Vraag of toelichting" value={note} onChange={(event) => setNote(event.target.value)} />
              <button type="button" className="min-h-11 rounded-lg border px-3 py-2" onClick={() => respond(row, 'QUESTION')}>Om informatie vragen</button>
            </div>
          </article>
        ))}
      </div>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </section>
  );
}
