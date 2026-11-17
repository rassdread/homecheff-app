'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DelivererSelector, { type Deliverer } from '@/components/checkout/DelivererSelector';
import { TransportProposalInbox } from '@/components/delivery/TransportProposalInbox';
import StartChatButton from '@/components/chat/StartChatButton';
import GooglePlacesAutocomplete from '@/components/ui/GooglePlacesAutocomplete';
import { useTranslation } from '@/hooks/useTranslation';
import { shownCourierLeftPaidList } from '@/lib/delivery/paid-courier-selection';

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
  transport?: {
    weightKg: string;
    lengthCm: string;
    widthCm: string;
    heightCm: string;
    proposalEuro: string;
  };
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

const pickupLabel = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

function localPickupInput(iso: string) {
  const at = new Date(iso);
  return new Date(at.getTime() - at.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function eur(cents: number) {
  return (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
}

export function StandaloneDeliveryRequest({
  embedded = false,
  transportEnabled = false,
  initialRequestId = '',
  onClose,
}: {
  embedded?: boolean;
  transportEnabled?: boolean;
  initialRequestId?: string;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const search = useSearchParams();
  const [deliveryOpen, setDeliveryOpen] = useState<boolean | null>(null);
  const [serverTransport, setServerTransport] = useState<boolean | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [dropoffLat, setDropoffLat] = useState('');
  const [dropoffLng, setDropoffLng] = useState('');
  const [requestedPickupAt, setRequestedPickupAt] = useState('');
  const [selectedPickupIso, setSelectedPickupIso] = useState<string | null>(null);
  const quoteSequence = useRef(0);
  const [couriers, setCouriers] = useState<Deliverer[] | null>(null);
  const [unavailable, setUnavailable] = useState<Array<{ id: string; name: string; pickupTimes: string[]; matchedVehicleLabel?: string | null }>>([]);
  const [rejected, setRejected] = useState<Array<{ id: string; name: string; reason: string }>>([]);
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
  const [needsCooling, setNeedsCooling] = useState(false);
  const proposalCents = Math.round(Number(proposalEuro.replace(',', '.')) * 100);
  const validProposalPrice = Number.isSafeInteger(proposalCents) && proposalCents > 0;
  const transportOn = serverTransport == null ? transportEnabled : serverTransport;
  const transport = jobKind === 'TRANSPORT' && transportOn;
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ id: string; jobKind: string; status: string; paymentStatus: string; itemDescription: string }>>([]);

  useEffect(() => {
    let stop = false;
    fetch('/api/delivery/alignment-flags')
      .then((response) => response.json())
      .then((data) => {
        if (!stop) {
          setDeliveryOpen(Boolean(data?.deliveryAvailableToCaller));
          setServerTransport(Boolean(data?.transportProposalsEnabled));
        }
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
      if (transportEnabled && draft.transport) {
        setJobKind('TRANSPORT');
        setCargoWeightKg(draft.transport.weightKg);
        setCargoLength(draft.transport.lengthCm);
        setCargoWidth(draft.transport.widthCm);
        setCargoHeight(draft.transport.heightCm);
        setProposalEuro(draft.transport.proposalEuro);
      }
      if (draft.resumeQuote) setResumeTick((tick) => (tick === 0 ? 1 : tick));
    } catch {
      window.sessionStorage.removeItem(DELIVERY_DRAFT_KEY);
    }
  }, [transportEnabled]);

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
      } else if (data?.cargoFitRequired && !data?.paymentAvailable && (data?.booking?.status === 'ACCEPTED' || data?.booking?.status === 'AUTO_CONFIRMED' || data?.status === 'AWAITING_PAYMENT')) {
        setStatusText('De prijs is afgesproken. Betalen kan pas nadat de bezorger heeft bevestigd dat deze lading in dit voertuig past.');
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
      } else if (data?.status === 'PROPOSAL') {
        setStatusText('Je voorstel staat bij Verhuisvoorstellen.');
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

  function saveDraft(resume: boolean, moment = requestedPickupAt) {
    const draft: DeliveryDraft = {
      pickupAddress,
      deliveryAddress,
      itemDescription,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      requestedPickupAt: moment,
      transport: transport ? {
        weightKg: cargoWeightKg,
        lengthCm: cargoLength,
        widthCm: cargoWidth,
        heightCm: cargoHeight,
        proposalEuro,
      } : undefined,
      resumeQuote: resume,
    };
    window.sessionStorage.setItem(DELIVERY_DRAFT_KEY, JSON.stringify(draft));
    const back = embedded ? '/?bezorging=1' : '/bezorging/aanvragen';
    window.location.href = `/login?callbackUrl=${encodeURIComponent(back)}`;
  }

  function routeBody(pickupIso = selectedPickupIso) {
    return {
      pickupAddress,
      deliveryAddress,
      itemDescription,
      pickupLat: Number(pickupLat),
      pickupLng: Number(pickupLng),
      dropoffLat: Number(dropoffLat),
      dropoffLng: Number(dropoffLng),
      requestedPickupAt: pickupIso ?? (requestedPickupAt ? new Date(requestedPickupAt).toISOString() : null),
    };
  }

  function parcelCargo() {
    const weight = Number(cargoWeightKg.replace(',', '.'));
    const item = {
      lengthCm: Number(cargoLength) || 0,
      widthCm: Number(cargoWidth) || 0,
      heightCm: Number(cargoHeight) || 0,
      weightKg: Number.isFinite(weight) ? weight : 0,
    };
    const filled = item.lengthCm > 0 || item.widthCm > 0 || item.heightCm > 0 || item.weightKg > 0;
    if (!filled) return undefined;
    return {
      itemCount: 1,
      items: [item],
      totalWeightKg: item.weightKg,
      floors: 0,
      lift: false,
      helpNeeded: false,
      fragile: false,
      note: '',
      preferredVehicle: null,
      photoIds,
      ...(transport && needsCooling ? { requiredFeatures: ['ACTIVE_COOLING'] } : {}),
    };
  }

  function selectedPlace(lat: string, lng: string) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    return Number.isFinite(latitude) && Number.isFinite(longitude) && lat !== '' && lng !== '';
  }

  function clearQuote() {
    quoteSequence.current++;
    setCouriers(null);
    setUnavailable([]);
    setError('');
  }

  async function calculate(pickupIso = selectedPickupIso) {
    const sequence = ++quoteSequence.current;
    setBusy(true);
    setError('');
    setCouriers(null);
    setUnavailable([]);
    setRejected([]);
    setBooked(null);
    if (!selectedPlace(pickupLat, pickupLng) || !selectedPlace(dropoffLat, dropoffLng)) {
      setError('Kies een ophaal- en afleveradres uit de adreslijst.');
      setBusy(false);
      return;
    }
    try {
      const response = await fetch('/api/delivery/standalone/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...routeBody(pickupIso),
          cargo: parcelCargo(),
          requiredFeatures: transport && needsCooling ? ['ACTIVE_COOLING'] : [],
        }),
      });
      const data = await response.json();
      if (sequence !== quoteSequence.current) return;
      if (response.status === 401) {
        saveDraft(true, pickupIso ? localPickupInput(pickupIso) : requestedPickupAt);
        return;
      }
      if (!response.ok) {
        setError(data.error || 'Bezorgers konden niet worden geladen');
        return;
      }
      setCouriers(data.couriers || []);
      setUnavailable(data.unavailable || []);
      setRejected(Array.isArray(data.rejected) ? data.rejected : []);
      window.sessionStorage.removeItem(DELIVERY_DRAFT_KEY);
    } catch {
      if (sequence === quoteSequence.current) setError('Beschikbaarheid ophalen lukte niet. Probeer het opnieuw.');
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
        body: JSON.stringify({
          ...routeBody(),
          deliveryProfileId: deliverer.id,
          cargo: parcelCargo(),
          requiredFeatures: transport && needsCooling ? ['ACTIVE_COOLING'] : [],
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        saveDraft(false);
        return;
      }
      if (!response.ok) {
        if (shownCourierLeftPaidList(data.code)) {
          setCouriers((current) => (current ?? []).filter((item) => item.id !== deliverer.id));
          setBooked(null);
          setError('');
          return;
        }
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
    try {
      const response = await fetch('/api/delivery/standalone/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...routeBody(),
          deliveryProfileId: deliverer.id,
          priceCents: proposalCents,
          negotiable: true,
          cargo: parcelCargo(),
          requiredFeatures: needsCooling ? ['ACTIVE_COOLING'] : [],
        }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        saveDraft(false);
        return;
      }
      if (!response.ok) {
        if (shownCourierLeftPaidList(data?.code)) {
          setCouriers((current) => (current ?? []).filter((item) => item.id !== deliverer.id));
          setBooked(null);
          setError('');
          return;
        }
        setError(data?.error || 'Voorstel lukte niet');
        return;
      }
      setCouriers(null);
      setBooked(null);
      setActiveRequestId(data.request.id);
      setStatusText('Voorstel verstuurd. Je vindt het bij Verhuisvoorstellen.');
    } catch {
      setError('Verzenden kon niet worden bevestigd. Kijk bij Verhuisvoorstellen voordat je het opnieuw probeert.');
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
      {embedded && onClose ? (
        <button type="button" className="mb-3 min-h-11 text-sm font-semibold text-emerald-800 underline" onClick={onClose}>
          {t('deliveryFlow.backToFeed', { defaultValue: 'Terug naar de feed' })}
        </button>
      ) : null}
      <h1 className="text-2xl font-bold text-gray-900">{t('deliveryFlow.requestTitle', { defaultValue: 'Bezorging aanvragen' })}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {t('deliveryFlow.requestIntro', { defaultValue: 'Lokale bezorging zonder HomeCheff-product. Jij kiest de bezorger. Het ophaalmoment is een verzoek, geen gegarandeerde aankomst.' })}
      </p>
      <p className="mt-2 text-sm text-gray-600">
        {t('deliveryFlow.requestNotSignup', { defaultValue: 'Dit is een bezorgverzoek, geen aanmelding als bezorger.' })}{' '}
        <a className="font-medium text-emerald-800 underline" href="/bezorger-worden">{t('deliveryFlow.becomeCourier', { defaultValue: 'Word zelf bezorger' })}</a>
      </p>
      {paid && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t('deliveryFlow.paidNotice', { defaultValue: 'Betaling ontvangen.' })} {statusText}</p>}
      {cancelled && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('deliveryFlow.cancelledNotice', { defaultValue: 'Betaling geannuleerd. Er is geen actieve bezorgopdracht.' })}</p>}
      {statusText && !paid && !cancelled && <p className="mt-4 text-sm text-gray-700">{statusText}</p>}

      {deliveryOpen ? (
      <>
      <label className="mt-6 block text-sm font-medium text-gray-800">
        Ophaaladres
        <GooglePlacesAutocomplete
          value={pickupAddress}
          className="mt-1 w-full"
          placeholder="Kies een ophaaladres"
          onChange={(address, place) => {
            clearQuote();
            setPickupAddress(place?.formattedAddress || address);
            setPickupLat(place ? String(place.lat) : '');
            setPickupLng(place ? String(place.lng) : '');
          }}
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-gray-800">
        {t('deliveryFlow.dropoffAddress', { defaultValue: 'Afleveradres' })}
        <GooglePlacesAutocomplete
          value={deliveryAddress}
          className="mt-1 w-full"
          placeholder="Kies een afleveradres"
          onChange={(address, place) => {
            clearQuote();
            setDeliveryAddress(place?.formattedAddress || address);
            setDropoffLat(place ? String(place.lat) : '');
            setDropoffLng(place ? String(place.lng) : '');
          }}
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-gray-800">
        {t('deliveryFlow.pickupTime', { defaultValue: 'Gewenst ophaalmoment' })}
        <input className="mt-1 w-full rounded-lg border px-3 py-2" type="datetime-local" value={requestedPickupAt} onChange={(event) => {
          clearQuote();
          setSelectedPickupIso(null);
          setRequestedPickupAt(event.target.value);
        }} />
        <span className="mt-1 block text-xs text-gray-500">{t('deliveryFlow.pickupHint', { defaultValue: 'Laat leeg voor zo snel mogelijk. Een later moment gebruikt de beschikbaarheid van de bezorger, ook als die nu offline is.' })}</span>
      </label>
      {transportOn ? (
        <div className="mt-4 rounded-xl border p-3">
          <p className="text-sm font-medium text-gray-800">{t('deliveryFlow.jobKind', { defaultValue: 'Soort opdracht' })}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" className={`min-h-11 rounded-lg border px-3 py-2 ${jobKind === 'SIMPLE' ? 'bg-emerald-700 text-white' : ''}`} onClick={() => { if (jobKind !== 'SIMPLE') clearQuote(); setJobKind('SIMPLE'); }}>{t('deliveryFlow.parcel', { defaultValue: 'Pakket' })}</button>
            <button type="button" className={`min-h-11 rounded-lg border px-3 py-2 ${jobKind === 'TRANSPORT' ? 'bg-emerald-700 text-white' : ''}`} onClick={() => { if (jobKind !== 'TRANSPORT') clearQuote(); setJobKind('TRANSPORT'); }}>{t('deliveryFlow.transport', { defaultValue: 'Transport' })}</button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 grid gap-2">
        <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="decimal" aria-label="Gewicht in kilogram" placeholder="Gewicht (kg)" value={cargoWeightKg} onChange={(event) => { clearQuote(); setCargoWeightKg(event.target.value); }} />
        <div className="grid grid-cols-3 gap-2">
          <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="numeric" aria-label="Lengte in cm" placeholder="L cm" value={cargoLength} onChange={(event) => { clearQuote(); setCargoLength(event.target.value); }} />
          <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="numeric" aria-label="Breedte in cm" placeholder="B cm" value={cargoWidth} onChange={(event) => { clearQuote(); setCargoWidth(event.target.value); }} />
          <input className="min-h-11 rounded-lg border px-3 py-2" inputMode="numeric" aria-label="Hoogte in cm" placeholder="H cm" value={cargoHeight} onChange={(event) => { clearQuote(); setCargoHeight(event.target.value); }} />
        </div>
        {transport ? (
          <>
            <p className="text-xs text-gray-600">{t('deliveryFlow.askFirst', { defaultValue: 'Je kunt eerst een vraag stellen aan een bezorger. Vul een bedrag in zodra je een voorstel wilt sturen.' })}</p>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={needsCooling} onChange={(event) => { clearQuote(); setNeedsCooling(event.target.checked); }} />
              {t('deliveryFlow.needsCooling', { defaultValue: 'Actieve koeling nodig' })}
            </label>
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
          </>
        ) : null}
      </div>
      <label className="mt-4 block text-sm font-medium text-gray-800">
        Wat moet worden bezorgd?
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={itemDescription} onChange={(event) => setItemDescription(event.target.value)} />
      </label>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 space-y-3">
      <button type="button" className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={busy} onClick={() => void calculate()}>
        {t('deliveryFlow.showCouriers', { defaultValue: 'Toon beschikbare bezorgers' })}
      </button>
      {history.length > 0 && (
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="font-medium text-gray-900">Eerdere aanvragen</p>
          <ul className="mt-2 space-y-2">
            {history.map((row) => (
              <li key={row.id}>
                <a className="underline" href={`/bezorging/aanvragen?request=${row.id}`}>{row.itemDescription || 'Aanvraag'}</a>
                <span className="text-gray-600"> · {row.jobKind === 'TRANSPORT' ? 'transport' : 'pakket'} · {row.status === 'PAYMENT_REVIEW' ? 'betaling wordt beoordeeld' : row.status} · {row.paymentStatus === 'REVIEW_REQUIRED' ? 'betaling ontvangen, wacht op beoordeling' : row.paymentStatus}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {transportOn ? <TransportProposalInbox /> : null}
      {couriers && (
        <DelivererSelector
          externalDeliverers={couriers}
          showQuotePrice={!transport}
          renderActions={(deliverer) => (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StartChatButton
                sellerId={deliverer.userId}
                sellerName={deliverer.displayName || deliverer.name}
                label={t('deliveryFlow.askQuestion', { defaultValue: 'Stel een vraag' })}
                courierQuestion
                showSuccessMessage
              />
              <button
                type="button"
                className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                disabled={busy || (transport && !validProposalPrice)}
                onClick={() => transport ? sendProposal(deliverer) : chooseCourier(deliverer)}
              >
                {transport ? t('deliveryFlow.sendProposal', { defaultValue: 'Stuur voorstel' }) : t('deliveryFlow.requestParcel', { defaultValue: 'Vraag pakketbezorging aan' })}
                {transport && validProposalPrice ? ` · ${eur(proposalCents)}` : ''}
              </button>
              {transport && !validProposalPrice && <p className="w-full text-sm text-gray-600">{t('deliveryFlow.proposalRequired', { defaultValue: 'Vul bij ‘Jouw voorstel in euro’ een bedrag in om een voorstel te sturen.' })}</p>}
            </div>
          )}
        />
      )}
      {couriers && rejected.length > 0 && (
        <section className="space-y-2 rounded-xl border bg-white p-4" aria-label="Lading te zwaar">
          {rejected.map((courier) => (
            <p key={courier.id} className="text-sm text-gray-800">
              {courier.name}: {courier.reason === 'Lading te zwaar voor dit voertuig'
                ? t('deliveryFlow.fitTooHeavy', { defaultValue: courier.reason })
                : courier.reason === 'Even afstemmen'
                  ? t('deliveryFlow.fitConfirm', { defaultValue: courier.reason })
                  : courier.reason === 'Past naar verwachting'
                    ? t('deliveryFlow.fitExpected', { defaultValue: courier.reason })
                    : courier.reason === 'Past volgens de opgegeven maten'
                      ? t('deliveryFlow.fitMeasured', { defaultValue: courier.reason })
                      : courier.reason}
            </p>
          ))}
        </section>
      )}
      {couriers && unavailable.length > 0 && (
        <section className="space-y-3 rounded-xl border bg-white p-4" aria-label="Andere ophaalmomenten">
          <h2 className="font-semibold text-gray-900">{t('deliveryFlow.otherTimes', { defaultValue: 'Andere ophaalmomenten' })}</h2>
          <p className="text-sm text-gray-600">{t('deliveryFlow.otherTimesHint', { defaultValue: 'Deze bezorgers hebben op andere tijden ruimte volgens hun rooster. Kies een moment om de beschikbaarheid opnieuw te bekijken.' })}</p>
          {unavailable.map(courier => (
            <div key={courier.id}>
              <p className="text-sm font-medium">{courier.name}{courier.matchedVehicleLabel ? ` · ${courier.matchedVehicleLabel}` : ''}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {courier.pickupTimes.map(iso => (
                  <button key={iso} type="button" disabled={busy}
                    className="min-h-11 rounded-lg border border-emerald-700 px-3 text-sm text-emerald-800"
                    onClick={() => {
                      setRequestedPickupAt(localPickupInput(iso));
                      setSelectedPickupIso(iso);
                      void calculate(iso);
                    }}>
                    {pickupLabel.format(new Date(iso))}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {couriers?.length === 0 && !unavailable.length && (
        <p className="text-sm text-gray-600">{t('deliveryFlow.noOtherTime', { defaultValue: 'Ook in de komende week vanaf het gekozen moment is geen ander ophaalmoment gevonden. Je kunt zelf een andere datum of tijd proberen.' })}</p>
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
            {t('deliveryFlow.confirmPay', { defaultValue: 'Bevestig en betaal' })}
          </button>
        </div>
      )}
      </div>
      </>
      ) : null}
    </Shell>
  );
}
