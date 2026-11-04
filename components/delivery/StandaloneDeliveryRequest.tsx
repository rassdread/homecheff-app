'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DelivererSelector, { type Deliverer } from '@/components/checkout/DelivererSelector';
import { useTranslation } from '@/hooks/useTranslation';
import { parseDutchDeliveryAddress } from '@/lib/delivery/delivery-address';
import { validateShipment, type ShipmentKind, type ShipmentSize } from '@/lib/delivery/shipment-capacity';

const DELIVERY_DRAFT_KEY = 'hc-standalone-delivery-draft';

type DeliveryDraft = {
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
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

type AddressParts = {
  street: string;
  houseNumber: string;
  addition: string;
  postcode: string;
  city: string;
};

type AddressSuggestion = AddressParts & { label: string };

const emptyAddress: AddressParts = { street: '', houseNumber: '', addition: '', postcode: '', city: '' };

function composeAddress(parts: AddressParts) {
  const house = `${parts.houseNumber}${parts.addition ? ` ${parts.addition}` : ''}`.trim();
  const line = [parts.street, house].filter(Boolean).join(' ');
  const place = [parts.postcode, parts.city].filter(Boolean).join(' ');
  return place ? `${line}, ${place}` : line;
}

export function StandaloneDeliveryRequest({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const search = useSearchParams();
  const localPreview = process.env.NODE_ENV === 'development' && search?.get('preview') === '1';
  const [deliveryOpen, setDeliveryOpen] = useState<boolean | null>(localPreview ? true : null);
  const [pickup, setPickup] = useState<AddressParts>(emptyAddress);
  const [dropoff, setDropoff] = useState<AddressParts>(emptyAddress);
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<AddressSuggestion[]>([]);
  const [itemDescription, setItemDescription] = useState('');
  const [shipmentKind, setShipmentKind] = useState<ShipmentKind>('PARCEL');
  const [shipmentSize, setShipmentSize] = useState<ShipmentSize>('SMALL');
  const [weightKg, setWeightKg] = useState('');
  const [packageCount, setPackageCount] = useState('1');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [fragile, setFragile] = useState(false);
  const [temperatureSensitive, setTemperatureSensitive] = useState(false);
  const [liftHelp, setLiftHelp] = useState(false);
  const [requestedPickupAt, setRequestedPickupAt] = useState('');
  const [couriers, setCouriers] = useState<Deliverer[] | null>(null);
  const [unavailable, setUnavailable] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [booked, setBooked] = useState<Booked | null>(null);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resumeTick, setResumeTick] = useState(0);

  useEffect(() => {
    if (localPreview) {
      setDeliveryOpen(true);
      return;
    }
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
  }, [localPreview]);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(DELIVERY_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as DeliveryDraft;
      if (draft.pickupAddress) setPickup((current) => ({ ...current, street: draft.pickupAddress }));
      if (draft.deliveryAddress) setDropoff((current) => ({ ...current, street: draft.deliveryAddress }));
      if (draft.itemDescription) setItemDescription(draft.itemDescription);
      if (draft.requestedPickupAt) setRequestedPickupAt(draft.requestedPickupAt);
      if (draft.resumeQuote) setResumeTick((tick) => (tick === 0 ? 1 : tick));
    } catch {
      window.sessionStorage.removeItem(DELIVERY_DRAFT_KEY);
    }
  }, []);

  const requestId = search.get('request');
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
      pickupAddress: composeAddress(pickup),
      deliveryAddress: composeAddress(dropoff),
      itemDescription,
      requestedPickupAt,
      resumeQuote: resume,
    };
    window.sessionStorage.setItem(DELIVERY_DRAFT_KEY, JSON.stringify(draft));
    const back = embedded ? '/?bezorging=1' : '/bezorging/aanvragen';
    window.location.href = `/login?callbackUrl=${encodeURIComponent(back)}`;
  }

  function routeBody() {
    const grams = Math.round(Number(weightKg.replace(',', '.')) * 1000);
    return {
      pickupAddress: composeAddress(pickup),
      deliveryAddress: composeAddress(dropoff),
      itemDescription,
      shipmentKind,
      shipmentSize,
      weightGrams: Number.isFinite(grams) ? grams : 0,
      packageCount: Number(packageCount) || 0,
      lengthCm: lengthCm ? Number(lengthCm.replace(',', '.')) : null,
      widthCm: widthCm ? Number(widthCm.replace(',', '.')) : null,
      heightCm: heightCm ? Number(heightCm.replace(',', '.')) : null,
      fragile,
      temperatureSensitive,
      liftHelp,
      requestedPickupAt: requestedPickupAt ? new Date(requestedPickupAt).toISOString() : null,
    };
  }

  function invalidateQuote(message?: string) {
    if (couriers || booked) {
      setCouriers(null);
      setBooked(null);
      setError(message || 'Je adres is gewijzigd. We berekenen de beschikbare bezorgers opnieuw.');
    }
  }

  function updateAddress(which: 'pickup' | 'dropoff', patch: Partial<AddressParts>) {
    const setParts = which === 'pickup' ? setPickup : setDropoff;
    setParts((current) => ({ ...current, ...patch }));
    if (which === 'pickup') setPickupSuggestions([]);
    else setDropoffSuggestions([]);
    invalidateQuote();
  }

  async function suggestAddress(which: 'pickup' | 'dropoff', next: AddressParts) {
    const setParts = which === 'pickup' ? setPickup : setDropoff;
    setParts(next);
    invalidateQuote();
    const query = [next.street, next.houseNumber, next.city].filter(Boolean).join(' ').trim();
    if (query.length < 3) {
      if (which === 'pickup') setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }
    const response = await fetch(`/api/delivery/address-suggest?q=${encodeURIComponent(query)}`);
    const data = await response.json().catch(() => ({ suggestions: [] }));
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions as AddressSuggestion[] : [];
    if (which === 'pickup') setPickupSuggestions(suggestions);
    else setDropoffSuggestions(suggestions);
  }

  async function chooseSuggestion(which: 'pickup' | 'dropoff', suggestion: AddressSuggestion) {
    let postcode = suggestion.postcode;
    if (!postcode) {
      const query = [suggestion.street, suggestion.houseNumber, suggestion.city].filter(Boolean).join(' ');
      const response = await fetch(`/api/delivery/address-suggest?q=${encodeURIComponent(query)}`);
      const data = await response.json().catch(() => ({ suggestions: [] }));
      const rows = Array.isArray(data.suggestions) ? data.suggestions as AddressSuggestion[] : [];
      const match = rows.find((item) =>
        item.postcode &&
        item.street === suggestion.street &&
        item.houseNumber === suggestion.houseNumber &&
        item.city === suggestion.city,
      );
      postcode = match?.postcode || '';
    }
    const setParts = which === 'pickup' ? setPickup : setDropoff;
    setParts((current) => ({
      street: suggestion.street || current.street,
      houseNumber: suggestion.houseNumber || current.houseNumber,
      addition: suggestion.addition || current.addition,
      postcode: postcode || current.postcode,
      city: suggestion.city || current.city,
    }));
    if (which === 'pickup') setPickupSuggestions([]);
    else setDropoffSuggestions([]);
    invalidateQuote();
  }

  async function calculate() {
    const pickupLine = composeAddress(pickup);
    const dropoffLine = composeAddress(dropoff);
    const pickupParsed = parseDutchDeliveryAddress(pickupLine);
    const dropoffParsed = parseDutchDeliveryAddress(dropoffLine);
    if (!pickupParsed.ok) {
      setError(`Ophaaladres: ${pickupParsed.error}`);
      return;
    }
    if (!dropoffParsed.ok) {
      setError(`Controleer het afleveradres voordat je verdergaat. ${dropoffParsed.error}`);
      return;
    }
    const shipment = validateShipment({
      kind: shipmentKind,
      size: shipmentSize,
      weightGrams: Math.round(Number(weightKg.replace(',', '.')) * 1000),
      packageCount: Number(packageCount),
      lengthCm: lengthCm ? Number(lengthCm.replace(',', '.')) : null,
      widthCm: widthCm ? Number(widthCm.replace(',', '.')) : null,
      heightCm: heightCm ? Number(heightCm.replace(',', '.')) : null,
      description: itemDescription,
      fragile,
      temperatureSensitive,
      liftHelp,
    });
    if (!shipment.ok) {
      setError(shipment.error);
      return;
    }
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
      {localPreview ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Lokale voorbeeldweergave. De publieke Delivery-vlag staat uit, dus er wordt geen opdracht of betaling gemaakt.
        </p>
      ) : null}
      <AddressFields
        title="Ophaaladres"
        parts={pickup}
        suggestions={pickupSuggestions}
        onChange={(patch) => updateAddress('pickup', patch)}
        onStreet={(value) => void suggestAddress('pickup', { ...pickup, street: value })}
        onPick={(suggestion) => chooseSuggestion('pickup', suggestion)}
      />
      <AddressFields
        title="Afleveradres"
        parts={dropoff}
        suggestions={dropoffSuggestions}
        onChange={(patch) => updateAddress('dropoff', patch)}
        onStreet={(value) => void suggestAddress('dropoff', { ...dropoff, street: value })}
        onPick={(suggestion) => chooseSuggestion('dropoff', suggestion)}
      />
      <label className="mt-4 block text-sm font-medium text-gray-800">
        Gewenst ophaalmoment
        <input className="mt-1 w-full rounded-lg border px-3 py-2" type="datetime-local" value={requestedPickupAt} onChange={(event) => setRequestedPickupAt(event.target.value)} />
        <span className="mt-1 block text-xs text-gray-500">Laat leeg voor zo snel mogelijk. Een later moment gebruikt de beschikbaarheid van de bezorger, ook als die nu offline is.</span>
      </label>
      <fieldset className="mt-4 rounded-lg border border-gray-200 p-3">
        <legend className="px-1 text-sm font-medium text-gray-800">Wat moet er worden bezorgd?</legend>
        <label className="mt-2 block text-sm text-gray-700">
          Soort zending
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={shipmentKind} onChange={(event) => { setShipmentKind(event.target.value as ShipmentKind); invalidateQuote('De zending is gewijzigd. We berekenen de bezorgers opnieuw.'); }}>
            <option value="PARCEL">Pakket</option>
            <option value="DOCUMENT">Document</option>
            <option value="FOOD">Etenswaar</option>
            <option value="OTHER">Overig</option>
          </select>
        </label>
        <label className="mt-2 block text-sm text-gray-700">
          Grootte
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={shipmentSize} onChange={(event) => { setShipmentSize(event.target.value as ShipmentSize); invalidateQuote('De zending is gewijzigd. We berekenen de bezorgers opnieuw.'); }}>
            <option value="SMALL">Klein</option>
            <option value="MEDIUM">Middel</option>
            <option value="LARGE">Groot</option>
            <option value="CUSTOM">Eigen formaat</option>
          </select>
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-sm text-gray-700">
            Geschat gewicht (kg)
            <input className="mt-1 w-full rounded-lg border px-3 py-2" inputMode="decimal" value={weightKg} onChange={(event) => { setWeightKg(event.target.value); invalidateQuote('De zending is gewijzigd. We berekenen de bezorgers opnieuw.'); }} />
          </label>
          <label className="text-sm text-gray-700">
            Aantal pakketten
            <input className="mt-1 w-full rounded-lg border px-3 py-2" inputMode="numeric" value={packageCount} onChange={(event) => { setPackageCount(event.target.value); invalidateQuote('De zending is gewijzigd. We berekenen de bezorgers opnieuw.'); }} />
          </label>
        </div>
        {(shipmentSize === 'LARGE' || shipmentSize === 'CUSTOM') && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <label className="text-sm text-gray-700">Lengte (cm)<input className="mt-1 w-full rounded-lg border px-3 py-2" inputMode="decimal" value={lengthCm} onChange={(event) => { setLengthCm(event.target.value); invalidateQuote('De zending is gewijzigd. We berekenen de bezorgers opnieuw.'); }} /></label>
            <label className="text-sm text-gray-700">Breedte (cm)<input className="mt-1 w-full rounded-lg border px-3 py-2" inputMode="decimal" value={widthCm} onChange={(event) => { setWidthCm(event.target.value); invalidateQuote('De zending is gewijzigd. We berekenen de bezorgers opnieuw.'); }} /></label>
            <label className="text-sm text-gray-700">Hoogte (cm)<input className="mt-1 w-full rounded-lg border px-3 py-2" inputMode="decimal" value={heightCm} onChange={(event) => { setHeightCm(event.target.value); invalidateQuote('De zending is gewijzigd. We berekenen de bezorgers opnieuw.'); }} /></label>
          </div>
        )}
        <div className="mt-3 space-y-1 text-sm text-gray-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={fragile} onChange={(event) => setFragile(event.target.checked)} /> Breekbaar</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={temperatureSensitive} onChange={(event) => setTemperatureSensitive(event.target.checked)} /> Temperatuurgevoelig</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={liftHelp} onChange={(event) => setLiftHelp(event.target.checked)} /> Hulp bij tillen</label>
        </div>
        <label className="mt-2 block text-sm text-gray-700">
          Beschrijving
          <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={itemDescription} onChange={(event) => setItemDescription(event.target.value)} placeholder="Wat zit erin?" />
        </label>
      </fieldset>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-30 mt-4 space-y-3">
      <button type="button" className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={busy} onClick={calculate}>
        Toon beschikbare bezorgers
      </button>
      {couriers && (
        <DelivererSelector
          externalDeliverers={couriers}
          onSelectDeliverer={chooseCourier}
        />
      )}
      {unavailable.length > 0 && (
        <ul className="space-y-1 text-xs text-gray-600">
          {unavailable.map((item) => (
            <li key={`${item.id}-${item.code}`}>{item.name}{item.code === 'UNKNOWN' || item.code === 'INSUFFICIENT' ? `: ${'reason' in item ? String((item as { reason?: string }).reason || item.code) : item.code}` : ''}</li>
          ))}
        </ul>
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

function AddressFields({
  title,
  parts,
  suggestions,
  onChange,
  onStreet,
  onPick,
}: {
  title: string;
  parts: AddressParts;
  suggestions: AddressSuggestion[];
  onChange: (patch: Partial<AddressParts>) => void;
  onStreet: (value: string) => void;
  onPick: (suggestion: AddressSuggestion) => void;
}) {
  return (
    <fieldset className="mt-4 rounded-lg border border-gray-200 p-3">
      <legend className="px-1 text-sm font-medium text-gray-800">{title}</legend>
      <label className="mt-2 block text-sm text-gray-700">
        Straat
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={parts.street} onChange={(event) => onStreet(event.target.value)} />
      </label>
      {suggestions.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-lg border bg-white text-sm">
          {suggestions.map((suggestion) => (
            <li key={suggestion.label}>
              <button type="button" className="w-full px-3 py-2 text-left hover:bg-gray-50" onClick={() => onPick(suggestion)}>
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-sm text-gray-700">Huisnummer<input className="mt-1 w-full rounded-lg border px-3 py-2" value={parts.houseNumber} onChange={(event) => onChange({ houseNumber: event.target.value })} /></label>
        <label className="text-sm text-gray-700">Toevoeging<input className="mt-1 w-full rounded-lg border px-3 py-2" value={parts.addition} onChange={(event) => onChange({ addition: event.target.value })} /></label>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-sm text-gray-700">Postcode<input className="mt-1 w-full rounded-lg border px-3 py-2" value={parts.postcode} onChange={(event) => onChange({ postcode: event.target.value })} /></label>
        <label className="text-sm text-gray-700">Plaats<input className="mt-1 w-full rounded-lg border px-3 py-2" value={parts.city} onChange={(event) => onChange({ city: event.target.value })} /></label>
      </div>
    </fieldset>
  );
}
