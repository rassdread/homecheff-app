'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, Package, CreditCard, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";

type ViewState = 'loading' | 'missing' | 'error' | 'success';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const { clearCart } = useCart();
  const clearCartRef = useRef(clearCart);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [session, setSession] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isPollingOrder, setIsPollingOrder] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setViewState('missing');
      return;
    }

    let cancelled = false;

    const fetchSession = async () => {
      setViewState('loading');
      try {
        const response = await fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Kon betalingsgegevens niet ophalen.');
        }

        if (cancelled) return;

        setSession(payload);
        setViewState('success');
        clearCartRef.current?.();
        
        // Poll for order creation (webhook is async)
        if (payload.id) {
          pollForOrder(payload.id);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Kon betalingsgegevens niet ophalen.';
        setErrorMessage(message);
        setViewState('error');
      }
    };

    fetchSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Poll for order creation after payment
  const pollForOrder = async (stripeSessionId: string) => {
    setIsPollingOrder(true);
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts = ~20 seconds
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/orders?stripeSessionId=${encodeURIComponent(stripeSessionId)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.orders && data.orders.length > 0) {
            setOrderId(data.orders[0].id);
            setIsPollingOrder(false);
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          setIsPollingOrder(false);
        }
      } catch (error) {
        console.error('Error polling for order:', error);
        setIsPollingOrder(false);
      }
    };
    
    // Start polling after 2 seconds (give webhook time to process)
    setTimeout(poll, 2000);
  };

  const metadata = useMemo(() => {
    return (session?.metadata || {}) as Record<string, string>;
  }, [session]);

  const lineItems = useMemo(() => {
    if (!metadata) return [];
    const compactChunks = Object.keys(metadata)
      .filter((key) => key.startsWith('items_compact_'))
      .sort()
      .map((key) => metadata[key]);

    if (compactChunks.length === 0) {
      return [];
    }

    return compactChunks
      .join(';')
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [productId, quantity, priceCents, sellerId] = entry.split('|');
        return {
          productId,
          quantity: Number(quantity) || 0,
          priceCents: Number(priceCents) || 0,
          sellerId,
        };
      })
      .filter((item) => item.quantity > 0);
  }, [metadata]);

  if (viewState === 'loading') {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">We verwerken je betaling...</p>
        </div>
      </main>
    );
  }

  if (viewState === 'missing') {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Geen betalingssessie gevonden</h1>
          <p className="text-neutral-600 mb-6">
            Het lijkt erop dat we geen betaalinformatie konden vinden. Controleer of je via de juiste link bent teruggekeerd of neem contact op met onze support.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar home
          </Link>
        </div>
      </main>
    );
  }

  if (viewState === 'error') {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Betaling kon niet worden opgehaald</h1>
          <p className="text-neutral-600 mb-6">
            {errorMessage || 'Er ging iets mis bij het ophalen van de betaling. Probeer het later opnieuw of neem contact op met support.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar home
            </Link>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Naar afrekenen
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Betalingsgegevens niet beschikbaar</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar home
          </Link>
        </div>
      </main>
    );
  }

  const amountTotal =
    typeof session.amount_total === 'number' ? session.amount_total / 100 : null;
  const currency = (session.currency || 'eur').toUpperCase();
  const formattedAmount =
    amountTotal !== null
      ? new Intl.NumberFormat('nl-NL', {
          style: 'currency',
          currency,
        }).format(amountTotal)
      : '—';
  const paymentStatus = (session.payment_status || session.status || 'onbekend') as string;
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
  const deliveryMode = metadata?.deliveryMode ?? metadata?.delivery_mode ?? null;
  const orderNotes = metadata?.notes ?? null;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-4">
            Betaling succesvol!
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            Je betaling is verwerkt en de verkoper is op de hoogte gesteld.
          </p>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 mb-8 text-left">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Betalingsgegevens</h2>

            <dl className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-neutral-600">Totaalbedrag</dt>
                <dd className="font-semibold text-lg">{formattedAmount}</dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-neutral-600">Status</dt>
                <dd className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium capitalize">
                  <CheckCircle className="w-4 h-4" />
                  {paymentStatus.replace(/_/g, ' ')}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-neutral-600">Betalingsreferentie</dt>
                <dd className="font-medium text-neutral-900 break-all">
                  {session.id}
                </dd>
              </div>

              {customerEmail && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-neutral-600">Contact e-mail</dt>
                  <dd className="font-medium text-neutral-900">{customerEmail}</dd>
                </div>
              )}

              {deliveryMode && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-neutral-600">Bezorgmethode</dt>
                  <dd className="font-medium text-neutral-900">
                    {deliveryMode.replace(/_/g, ' ').toLowerCase()}
                  </dd>
                </div>
              )}

              {orderNotes && (
                <div>
                  <dt className="text-neutral-600 mb-1">Opmerkingen</dt>
                  <dd className="font-medium text-neutral-900 whitespace-pre-line">
                    {orderNotes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {lineItems.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-8 text-left">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Bestelling</h2>
              <ul className="space-y-3">
                {lineItems.map((item, index) => (
                  <li key={`${item.productId}-${index}`} className="flex justify-between items-center border border-neutral-100 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-semibold text-neutral-900">Product ID: {item.productId}</p>
                      <p className="text-sm text-neutral-600">
                        Aantal: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm text-neutral-500">
                      €{(item.priceCents * item.quantity / 100).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Wat gebeurt er nu?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <p className="text-blue-800">De verkoper ontvangt direct een melding van je bestelling.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <p className="text-blue-800">Je ontvangt een bevestigingsmail met alle details.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <p className="text-blue-800">De verkoper neemt contact op voor levering of afhalen.</p>
              </div>
            </div>
          </div>

          {isPollingOrder && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-blue-800 text-sm">Je bestelling wordt verwerkt...</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/orders"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
            >
              <CreditCard className="w-5 h-5" />
              Naar Mijn Aankopen
            </Link>
            <Link
              href="/dorpsplein"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-semibold"
            >
              <Package className="w-5 h-5" />
              Verder Winkelen
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Laden...</p>
        </div>
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}


