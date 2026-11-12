'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DelivererSelector, { type Deliverer } from '@/components/checkout/DelivererSelector';
import { TransportProposalInbox } from '@/components/delivery/TransportProposalInbox';
import { useTranslation } from '@/hooks/useTranslation';

const DELIVERY_DRAFT_KEY = 'hc-standalone-delivery-draft';

type DeliveryDraft = {
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
  pickupLat: string;
  pickupLng: string;
  dropoffLat: string;
  dropoffLng: string;
  requestedPickupAt: string;
  resumeQuote?: boolean;
};

type Booked = {
  id: string;
  status: string;
  bookingStatus: string;
  paymentAvailable: boolean;
  quotedFeeCents: number;
  stripeFeeCents: number;
  buyerTotalCents: number;
  providerDisplayName: string;
  routeDistanceKm: number;
};

function eur(cents: number) {
  return (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
}

export function StandaloneDeliveryRequest({
  embedded = false,
  transportEnabled = false,
  initialRequestId = '',
}: {
  embedded?: boolean;
  transportEnabled?: boolean;
  initialRequestId?: string;
}) {
  const { t } = useTranslation();
  const search = useSearchParams();
  const [deliveryOpen, setDeliveryOpen] = useState<boolean | null>(null);
  const [pickupAddress, setPickupAddress] = useState('Koerierstraat 4, 3511 CD Utrecht');
  const [deliveryAddress, setDeliveryAddress] = useState('Teststraat 12, 3511 AB Utrecht');
  const [itemDescription, setItemDescription] = useState('');
  const [pickupLat, setPickupLat] = useState('52.0907');
  const [pickupLng, setPickupLng] = useState('5.1216');
  const [dropoffLat, setDropoffLat] = useState('52.073');
  const [dropoffLng, setDropoffLng] = useState('5.1216');
  const [requestedPickupAt, setRequestedPickupAt] = useState('');
  const [couriers, setCouriers] = useState<Deliverer[] | null>(null);
  const [unavailable, setUnavailable] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [booked, setBooked] = useState<Booked | null>(null);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resumeTick, setResumeTick] = useState(0);
  const [jobKind, setJobKind] = useState<'SIMPLE' | 'TRANSPORT'>('SIMPLE');
  const [cargoWeightKg, setCargoWeightKg] = useState('');
  const [cargoLength, setCargoLength] = useState('');
  const [cargoWidth, setCargoWidth] = useState('');
  const [cargoHeight, setCargoHeight] = useState('');
  const [proposalEuro, setProposalEuro] = useState('');
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ id: string; jobKind: string; status: string; paymentStatus: string; itemDescription: string }>>([]);

  useEffect(() => {
    let stop = false;
    fetch('/api/delivery/alignment-flags')
      .then((response) => response.json())
      .then((data) => {
        if (!stop) setDeliveryOpen(Boolean(data?.deliveryAvailableToCaller));
      })
      .catch(() => {
        if (!stop) setDeliveryOpen(false);
      });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(DELIVERY_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as DeliveryDraft;
      if (draft.pickupAddress) setPickupAddress(draft.pickupAddress);
      if (draft.deliveryAddress) setDeliveryAddress(draft.deliveryAddress);
      if (draft.itemDescription) setItemDescription(draft.itemDescription);
      if (draft.pickupLat) setPickupLat(draft.pickupLat);
      if (draft.pickupLng) setPickupLng(draft.pickupLng);
      if (draft.dropoffLat) setDropoffLat(draft.dropoffLat);
      if (draft.dropoffLng) setDropoffLng(draft.dropoffLng);
      if (draft.requestedPickupAt) setRequestedPickupAt(draft.requestedPickupAt);
      if (draft.resumeQuote) setResumeTick((tick) => (tick === 0 ? 1 : tick));
    } catch {
      window.sessionStorage.removeItem(DELIVERY_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    let stop = false;
    fetch('/api/delivery/standalone')
      .then((response) => response.json())
      .then((data) => {
        if (!stop && Array.isArray(data?.requests)) setHistory(data.requests);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [booked?.id, statusText]);

  const requestId = search.get('request') || initialRequestId || null;
  const cancelled = search.get('geannuleerd') === '1';
  const paid = search.get('betaald') === '1';
  const [activeRequestId, setActiveRequestId] = useState<string | null>(requestId);

  useEffect(() => {
    if (requestId) setActiveRequestId(requestId);
  }, [requestId]);

  useEffect(() => {
    if (!activeRequestId) return;
    let stop = false;
    const load = async () => {
      const response = await fetch(`/api/delivery/standalone/${activeRequestId}`);
      const data = await response.json().catch(() => null);
      if (stop || !response.ok) return;
      const deliveryStatus = data?.delivery?.status;
      if (deliveryStatus) {
        setStatusText(
          deliveryStatus === 'DELIVERED'
            ? 'Bezorgd'
            : deliveryStatus === 'PICKED_UP'
              ? 'Opgehaald'
              : deliveryStatus === 'ACCEPTED'
                ? 'Bezorger geaccepteerd'
                : 'Betaald, wacht op bezorger',
        );
      } else if (data?.status === 'REJECTED') {
        setStatusText('De bezorger heeft geweigerd. Er is niet betaald. Kies een andere bezorger.');
      } else if (data?.status === 'EXPIRED') {
        setStatusText('De bezorger heeft niet gereageerd. Er is niet betaald. Kies een andere bezorger.');
      } else if (data?.status === 'CANCELLED_AFTER_PAYMENT') {
        const review = data?.refund?.status === 'REVIEW_REQUIRED';
        setStatusText(review
          ? 'De betaalde bezorging is geannuleerd. Terugbetaling staat op REVIEW_REQUIRED. Er is nog geen Stripe-terugbetaling uitgevoerd.'
          : 'De betaalde bezorging is geannuleerd. Er is niet automatisch terugbetaald.');
      } else if (data?.paymentAvailable && data.paymentStatus !== 'PAID') {
        setStatusText('De bezorger heeft bevestigd. Je kunt nu betalen.');
        setBooked({
          id: data.id,
          status: data.status,
          bookingStatus: data.booking?.status || '',
          paymentAvailable: true,
          quotedFeeCents: data.quotedFeeCents,
          stripeFeeCents: data.stripeFeeCents,
          buyerTotalCents: data.buyerTotalCents,
          providerDisplayName: data.providerDisplayName,
          routeDistanceKm: data.routeDistanceKm,
        });
      } else if (data?.paymentStatus === 'UNPAID') {
        setStatusText(cancelled ? 'Betaling geannuleerd. Er is geen bezorgopdracht.' : data?.status === 'BOOKING_REQUESTED' ? 'Wacht op de gekozen bezorger.' : 'Nog niet betaald');
      }
    };
    load();
    const timer = window.setInterval(load, 8000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [activeRequestId, cancelled]);

  function saveDraft(resume: boolean) {
    const draft: DeliveryDraft = {
      pickupAddress,
      deliveryAddress,
      itemDescription,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      requestedPickupAt,
      resumeQuote: resume,
    };
    window.sessionStorage.setItem(DELIVERY_DRAFT_KEY, JSON.stringify(draft));
    const back = embedded ? '/?bezorging=1' : '/bezorging/aanvragen';
    window.location.href = `/login?callbackUrl=${encodeURIComponent(back)}`;
  }

  function routeBody() {
    return {
      pickupAddress,
      deliveryAddress,
      itemDescription,
      pickupLat: Number(pickupLat),
      pickupLng: Number(pickupLng),
      dropoffLat: Number(dropoffLat),
      dropoffLng: Number(dropoffLng),
      requestedPickupAt: requestedPickupAt ? new Date(requestedPickupAt).toISOString() : null,
    };
  }

  async function calculate() {
    setBusy(true);
    setError('');
    setCouriers(null);
    setBooked(null);
    try {
      const response = await fetch('/api/delivery/standalone/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeBody()),
      });
      const data = await response.json();
      if (response.status === 401) {
        saveDraft(true);
        return;
      }
      if (!response.ok) {
        setError(data.error || 'Bezorgers konden niet worden geladen');
        return;
      }
      setCouriers(data.couriers || []);
      setUnavailable(data.unavailable || []);
      window.sessionStorage.removeItem(DELIVERY_DRAFT_KEY);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (resumeTick === 0) return;
    void calculate();
  }, [resumeTick]);

  async function chooseCourier(deliverer: Deliverer) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/delivery/standalone/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...routeBody(), deliveryProfileId: deliverer.id }),
      });
      const data = await response.json();
      if (response.status === 401) {
        saveDraft(false);
        return;
      }
      if (!response.ok) {
        setError(data.error || 'Boeken lukte niet');
        return;
      }
      setBooked(data.request);
      setActiveRequestId(data.request.id);
      const nextUrl = embedded
        ? `/?bezorging=1&request=${data.request.id}#homecheff-feed`
        : `/bezorging/aanvragen?request=${data.request.id}`;
      window.history.replaceState(null, '', nextUrl);
    } finally {
      setBusy(false);
    }
  }

  async function sendProposal(deliverer: Deliverer) {
    setBusy(true);
    setError('');
    const weight = Number(cargoWeightKg.replace(',', '.'));
    const priceCents = Math.round(Number(proposalEuro.replace(',', '.')) * 100);
    try {
      const response = await fetch('/api/delivery/standalone/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...routeBody(),
          deliveryProfileId: deliverer.id,
          priceCents: Number.isFinite(priceCents) ? priceCents : null,
          negotiable: true,
          cargo: {
            itemCount: 1,
            items: [{
              lengthCm: Number(cargoLength) || 0,
              widthCm: Number(cargoWidth) || 0,
              heightCm: Number(cargoHeight) || 0,
              weightKg: Number.isFinite(weight) ? weight : 0,
            }],
            totalWeightKg: Number.isFinite(weight) ? weight : 0,
            floors: 0,
            lift: false,
            helpNeeded: false,
            fragile: false,
            note: '',
            preferredVehicle: null,
            photoIds,
          },
        }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        saveDraft(false);
        return;
      }
      if (!response.ok) {
        setError(data?.error || 'Voorstel lukte niet');
        return;
      }
      setActiveRequestId(data.request.id);
      setStatusText('Voorstel verstuurd. Er is nog niets betaald.');
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!booked?.paymentAvailable) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/delivery/standalone/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: booked.id, clientQuotedFeeCents: booked.quotedFeeCents }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setError(data.error || 'Betalen lukte niet');
        return;
      }
      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  }

  const Shell = embedded ? 'section' : 'main';
  const viewingExisting = Boolean(search?.get('request') || paid || cancelled);
  if (deliveryOpen === null) return null;
  if (!deliveryOpen && embedded) return null;
  if (!deliveryOpen && !viewingExisting) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8" data-delivery-gate="closed">
        <h1 className="text-2xl font-bold text-gray-900">{t('deliveryStart.requestLink')}</h1>
        <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {t('deliveryGate.unavailable')}
        </p>
      </main>
    );
  }

  return (
    <Shell className={embedded ? 'mx-auto max-w-xl px-1 py-2 pb-28' : 'mx-auto max-w-xl px-4 py-8 pb-40'} data-delivery-request="standalone">
      <h1 className="text-2xl font-bold text-gray-900">Bezorging aanvragen</h1>
      <p className="mt-2 text-sm text-gray-600">
        Lokale bezorging zonder HomeCheff-product. Jij kiest de bezorger. De prijs wordt op de server berekend. Het ophaalmoment is een verzoek, geen gegarandeerde aankomst.
      </p>
      <p className="mt-2 text-sm text-gray-600">
        Dit is een bezorgverzoek, geen aanmelding als bezorger.{' '}
        <a className="font-medium text-emerald-800 underline" href="/delivery/signup">Word zelf bezorger</a>
      </p>
      {paid && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Betaling ontvangen. {statusText}</p>}
      {cancelled && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Betaling geannuleerd. Er is geen actieve bezorgopdracht.</p>}
      {statusText && !paid && !cancelled && <p className="mt-4 text-sm text-gray-700">{statusText}</p>}

      {deliveryOpen ? (
      <>
      <label className="mt-6 block text-sm font-medium text-gray-800">
        Ophaaladres
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input className="rounded-lg border px-3 py-2 text-sm" aria-label="Ophaal latitude" value={pickupLat} onChange={(event) => setPickupLat(event.target.value)} />
        <input className="rounded-lg border px-3 py-2 text-sm" aria-label="Ophaal longitude" value={pickupLng} onChange={(event) => setPickupLng(event.target.value)} />
      </div>
      <label className="mt-4 block text-sm font-medium text-gray-800">
        Afleveradres
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input className="rounded-lg border px-3 py-2 text-sm" aria-label="Aflever latitude" value={dropoffLat} onChange={(event) => setDropoffLat(event.target.value)} />
        <input className="rounded-lg border px-3 py-2 text-sm" aria-label="Aflever longitude" value={dropoffLng} onChange={(event) => setDropoffLng(event.target.value)} />
      </div>
      <label className="mt-4 block text-sm font-medium text-gray-800">
        Gewenst ophaalmoment
        <input className="mt-1 w-full rounded-lg border px-3 py-2" type="datetime-local" value={requestedPickupAt} onChange={(event) => setRequestedPickupAt(event.target.value)} />
        <span className="mt-1 block text-xs text-gray-500">Laat leeg voor zo snel mogelijk. Een later moment gebruikt de beschikbaarheid van de bezorger, ook als die nu offline is.</span>
      </label>
      {transportEnabled ? (
        <div className="mt-4 rounded-xl border p-3">
          <p className="text-sm font-medium text-gray-800">Soort opdracht</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" className={`min-h-11 rounded-lg border px-3 py-2 ${jobKind === 'SIMPLE' ? 'bg-emerald-700 text-white' : ''}`} onClick={() => setJobKind('SIMPLE')}>Pakket</button>
            <button type="button" className={`min-h-11 rounded-lg border px-3 py-2 ${jobKind === 'TRANSPORT' ? 'bg-emerald-700 text-white' : ''}`} onClick={() => setJobKind('TRANSPORT')}>Transport</button>
          </div>
          {jobKind === 'TRANSPORT' ? (
            <div className="mt-3 grid gap-2">
              <p className="text-xs text-gray-600">Een transport begint met een voorstel. Er wordt pas betaald nadat beide partijen dezelfde versie accepteren.</p>
              <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="decimal" aria-label="Gewicht in kilogram" placeholder="Gewicht (kg)" value={cargoWeightKg} onChange={(event) => setCargoWeightKg(event.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="numeric" aria-label="Lengte in cm" placeholder="L cm" value={cargoLength} onChange={(event) => setCargoLength(event.target.value)} />
                <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="numeric" aria-label="Breedte in cm" placeholder="B cm" value={cargoWidth} onChange={(event) => setCargoWidth(event.target.value)} />
                <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="numeric" aria-label="Hoogte in cm" placeholder="H cm" value={cargoHeight} onChange={(event) => setCargoHeight(event.target.value)} />
              </div>
              <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="decimal" aria-label="Voorstel in euro" placeholder="Jouw voorstel in euro" value={proposalEuro} onChange={(event) => setProposalEuro(event.target.value)} />
              <label className="text-sm text-gray-700">
                Privéfoto van de lading
                <input className="mt-1 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  form.set('file', file);
                  const response = await fetch('/api/delivery/standalone/cargo-photo', { method: 'POST', body: form });
                  const data = await response.json().catch(() => null);
                  if (!response.ok || !data?.photoId) {
                    setError(data?.error || 'Foto uploaden lukte niet');
                    return;
                  }
                  setPhotoIds((current) => [...current, data.photoId]);
                }} />
              </label>
              {photoIds.length > 0 ? <p className="text-xs text-gray-600">{photoIds.length} privéfoto gekoppeld. Er is geen openbare link.</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <label className="mt-4 block text-sm font-medium text-gray-800">
        Wat moet worden bezorgd?
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={itemDescription} onChange={(event) => setItemDescription(event.target.value)} />
      </label>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-30 mt-4 space-y-3">
      <button type="button" className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={busy} onClick={calculate}>
        Toon beschikbare bezorgers
      </button>
      {history.length > 0 && (
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="font-medium text-gray-900">Eerdere aanvragen</p>
          <ul className="mt-2 space-y-2">
            {history.map((row) => (
              <li key={row.id}>
                <a className="underline" href={`/bezorging/aanvragen?request=${row.id}`}>{row.itemDescription || 'Aanvraag'}</a>
                <span className="text-gray-600"> · {row.jobKind === 'TRANSPORT' ? 'transport' : 'pakket'} · {row.status} · {row.paymentStatus}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {transportEnabled ? <TransportProposalInbox /> : null}
      {couriers && (
        <DelivererSelector
          externalDeliverers={couriers}
          onSelectDeliverer={jobKind === 'TRANSPORT' && transportEnabled ? sendProposal : chooseCourier}
        />
      )}
      {unavailable.length > 0 && (
        <p className="text-xs text-gray-600">Niet beschikbaar voor dit moment: {unavailable.map((item) => item.name).join(', ')}</p>
      )}
      {booked && (
        <div className="rounded-xl border bg-white p-4 text-sm shadow-sm">
          <p>{booked.providerDisplayName}</p>
          <p>Route {booked.routeDistanceKm.toFixed(1)} km</p>
          <p>Bezorgkosten {eur(booked.quotedFeeCents)}</p>
          <p>Transactiekosten {eur(booked.stripeFeeCents)}</p>
          <p className="font-semibold">Totaal {eur(booked.buyerTotalCents)}</p>
          <p className="mt-2 text-gray-600">{booked.paymentAvailable ? 'Bevestigd. Je kunt betalen.' : 'Wacht op bevestiging van deze bezorger. Er wordt nog niets afgeschreven.'}</p>
          <button type="button" className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={busy || !booked.paymentAvailable} onClick={pay}>
            Bevestig en betaal
          </button>
        </div>
      )}
      </div>
      </>
      ) : null}
    </Shell>
  );
}
