'use client';

import { ShieldCheck, Banknote, Handshake, ArrowLeftRight, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import { cn } from '@/lib/utils';

type Props = {
  orderMethod?: string | null;
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  barterOpenness?: string | null;
  acceptedSpecializations?: string[];
  priceCents?: number | null;
  priceModel?: string | null;
  listingIntent?: string | null;
  /** Server-computed: HomeCheff Checkout truly available (Connect ready + price). */
  checkoutAvailable?: boolean;
  className?: string;
};

/**
 * Phase 7C.8 — full settlement explanation on the detail page.
 *
 * Explains which settlement options exist, which are actually available, and
 * why HomeCheff Checkout may not be available yet (seller Connect not finished).
 * The CTA routing (checkout vs proposal) lives in the commerce actions; this
 * section is explanatory only, so it never introduces a conflicting CTA.
 */
export default function ProductDetailSettlementSection({
  orderMethod,
  acceptHomeCheffPayment,
  acceptDirectContact,
  barterOpenness,
  acceptedSpecializations = [],
  priceCents,
  priceModel,
  listingIntent,
  checkoutAvailable,
  className,
}: Props) {
  const { t } = useTranslation();

  const options = resolveSettlementOptions({
    acceptHomeCheffPayment,
    acceptDirectContact,
    orderMethod,
    barterOpenness,
    acceptedSpecializations,
    priceCents,
    priceModel,
    listingIntent,
    stripeConnectReady: checkoutAvailable === true ? true : undefined,
  });

  const rows: { key: string; icon: React.ReactNode; label: string; desc: string }[] = [];

  if (options.acceptsHomeCheffCheckout && checkoutAvailable) {
    rows.push({
      key: 'homecheff',
      icon: <ShieldCheck className="h-4 w-4 shrink-0 text-primary-brand" aria-hidden />,
      label: t('marketplace.detail.settlement.homeCheffCheckout'),
      desc: t('marketplace.detail.settlement.homeCheffCheckoutDesc'),
    });
  }
  if (options.acceptsDirectContact) {
    rows.push({
      key: 'direct',
      icon: <Banknote className="h-4 w-4 shrink-0 text-gray-600" aria-hidden />,
      label: t('marketplace.detail.settlement.directContact'),
      desc: t('marketplace.detail.settlement.directContactDesc'),
    });
  }
  if (options.allowsBarter) {
    rows.push({
      key: 'barter',
      icon: <Handshake className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />,
      label: t('marketplace.detail.settlement.barter'),
      desc: t('marketplace.detail.settlement.barterDesc'),
    });
  }
  if (options.hasAcceptedValues) {
    rows.push({
      key: 'value',
      icon: <ArrowLeftRight className="h-4 w-4 shrink-0 text-secondary-brand" aria-hidden />,
      label: t('marketplace.detail.settlement.acceptedValues'),
      desc: t('marketplace.detail.settlement.acceptedValuesDesc'),
    });
  }

  // HomeCheff Checkout selected but not available yet → friendly explanation.
  const showNeedsConnect =
    options.acceptsHomeCheffCheckout &&
    !checkoutAvailable &&
    (priceCents ?? 0) > 0;

  if (rows.length === 0 && !showNeedsConnect) return null;

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm',
        className,
      )}
      data-detail-section="settlement"
    >
      <h2 className="mb-1 text-sm font-semibold text-gray-900">
        {t('marketplace.detail.settlement.title')}
      </h2>
      <p className="mb-3 text-xs text-gray-500">
        {t('marketplace.detail.settlement.intro')}
      </p>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-2.5">
            {row.icon}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{row.label}</p>
              <p className="text-xs leading-relaxed text-gray-600">{row.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      {showNeedsConnect ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
          <p className="text-xs leading-relaxed text-amber-900">
            {t('marketplace.detail.settlement.needsConnect')}
          </p>
        </div>
      ) : null}
    </section>
  );
}
