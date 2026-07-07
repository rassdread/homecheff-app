'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, Package, CreditCard, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/hooks/useTranslation";
import {
  EXCHANGE_FUNNEL_EVENTS,
  trackExchangeFunnelEvent,
} from '@/lib/marketplace/exchange/exchange-funnel-analytics';

type ViewState = 'loading' | 'missing' | 'error' | 'success';

type PolledOrderItem = {
  product?: { id?: string; title?: string | null } | null;
};

function firstListingIdFromStripeMetadata(
  metadata: Record<string, string> | null | undefined,
): string | null {
  if (!metadata) return null;
  const compactKeys = Object.keys(metadata)
    .filter((key) => key.startsWith('items_compact_'))
    .sort();
  for (const key of compactKeys) {
    const chunk = metadata[key];
    const firstEntry = chunk.split(';')[0];
    const productId = firstEntry?.split('|')[0]?.trim();
    if (productId) return productId;
  }
  const direct = metadata.productId?.trim();
  return direct || null;
}

function PaymentSuccessContent() {
  const { t, language } = useTranslation();
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
  const [orderItems, setOrderItems] = useState<PolledOrderItem[]>([]);
  const [isPollingOrder, setIsPollingOrder] = useState(false);
  const checkoutCompletedTracked = useRef(false);

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
          throw new Error(payload?.error || t('paymentSuccess.couldNotLoad'));
        }

        if (cancelled) return;

        setSession(payload);
        setViewState('success');
        clearCartRef.current?.();

        if (!checkoutCompletedTracked.current) {
          const listingId = firstListingIdFromStripeMetadata(payload?.metadata);
          if (listingId) {
            checkoutCompletedTracked.current = true;
            trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.checkoutCompleted, {
              listingId,
              surface: payload?.metadata?.communityOrderId ? 'chat' : 'commerce_zone',
              entrypoint: 'stripe_payment_success',
              communityOrderId: payload?.metadata?.communityOrderId,
            });
          }
        }
        
        // Poll for order creation (webhook is async)
        if (payload.id) {
          pollForOrder(payload.id);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : t('paymentSuccess.couldNotLoad');
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
            setOrderItems(data.orders[0].items || []);
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

  // Map productId → title from the polled order (Stripe metadata has no titles).
  const productTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of orderItems) {
      const id = item.product?.id;
      const title = item.product?.title;
      if (id && title) map[id] = title;
    }
    return map;
  }, [orderItems]);

  if (viewState === 'loading') {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">{t('paymentSuccess.processing')}</p>
        </div>
      </main>
    );
  }

  if (viewState === 'missing') {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">{t('paymentSuccess.missingTitle')}</h1>
          <p className="text-neutral-600 mb-6">
            {t('paymentSuccess.missingBody')}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('paymentSuccess.backToHome')}
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
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">{t('paymentSuccess.errorTitle')}</h1>
          <p className="text-neutral-600 mb-6">
            {errorMessage || t('paymentSuccess.errorBody')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('paymentSuccess.backToHome')}
            </Link>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {t('paymentSuccess.toCheckout')}
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
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">{t('paymentSuccess.unavailableTitle')}</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('paymentSuccess.backToHome')}
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
      ? new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
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
            {t('paymentSuccess.successTitle')}
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            {t('paymentSuccess.successSubtitle')}
          </p>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 mb-8 text-left">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">{t('paymentSuccess.detailsTitle')}</h2>

            <dl className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-neutral-600">{t('paymentSuccess.totalAmount')}</dt>
                <dd className="font-semibold text-lg">{formattedAmount}</dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-neutral-600">{t('paymentSuccess.status')}</dt>
                <dd className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium capitalize">
                  <CheckCircle className="w-4 h-4" />
                  {paymentStatus.replace(/_/g, ' ')}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-neutral-600">{t('paymentSuccess.reference')}</dt>
                <dd className="font-medium text-neutral-900 break-all">
                  {session.id}
                </dd>
              </div>

              {customerEmail && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-neutral-600">{t('paymentSuccess.contactEmail')}</dt>
                  <dd className="font-medium text-neutral-900">{customerEmail}</dd>
                </div>
              )}

              {deliveryMode && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-neutral-600">{t('paymentSuccess.deliveryMethod')}</dt>
                  <dd className="font-medium text-neutral-900">
                    {deliveryMode.replace(/_/g, ' ').toLowerCase()}
                  </dd>
                </div>
              )}

              {orderNotes && (
                <div>
                  <dt className="text-neutral-600 mb-1">{t('paymentSuccess.notes')}</dt>
                  <dd className="font-medium text-neutral-900 whitespace-pre-line">
                    {orderNotes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {lineItems.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-8 text-left">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('paymentSuccess.orderTitle')}</h2>
              <ul className="space-y-3">
                {lineItems.map((item, index) => (
                  <li key={`${item.productId}-${index}`} className="flex justify-between items-center border border-neutral-100 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {productTitleById[item.productId] || t('paymentSuccess.productFallback')}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {t('paymentSuccess.quantity', { count: item.quantity })}
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
            <h3 className="text-lg font-semibold text-blue-900 mb-4">{t('paymentSuccess.whatNextTitle')}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <p className="text-blue-800">{t('paymentSuccess.step1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <p className="text-blue-800">{t('paymentSuccess.step2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <p className="text-blue-800">{t('paymentSuccess.step3')}</p>
              </div>
            </div>
          </div>

          {isPollingOrder && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-blue-800 text-sm">{t('paymentSuccess.orderProcessing')}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/orders"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
            >
              <CreditCard className="w-5 h-5" />
              {t('paymentSuccess.toMyPurchases')}
            </Link>
            <Link
              href="/?chip=sale#homecheff-feed"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-semibold"
            >
              <Package className="w-5 h-5" />
              {t('paymentSuccess.continueShopping')}
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


