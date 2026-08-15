'use client';

/**
 * LEGAL-3 — compact consumer information / withdrawal disclosure.
 */

import { useId, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import type { ConsumerCommerceContext } from '@/lib/legal/consumer-commerce-context';
import { cn } from '@/lib/utils';

type Props = {
  context: ConsumerCommerceContext;
  variant?: 'listing' | 'checkout' | 'proposal';
  className?: string;
  /** When service-start ack is needed */
  serviceStartAckChecked?: boolean;
  onServiceStartAckChange?: (next: boolean) => void;
};

export default function ConsumerCommerceDisclosure({
  context,
  variant = 'listing',
  className,
  serviceStartAckChecked,
  onServiceStartAckChange,
}: Props) {
  const { t } = useTranslation();
  const panelId = useId();
  const [open, setOpen] = useState(variant !== 'listing');

  if (!context.showConsumerDisclosure) return null;

  const sellerStatusKey =
    context.publicLabel === 'geverifieerd_bedrijf'
      ? 'legal3.seller.verifiedBusiness'
      : context.publicLabel === 'zakelijke_aanbieder'
        ? 'legal3.seller.professional'
        : context.publicLabel === 'particulier'
          ? 'legal3.seller.private'
          : 'legal3.seller.undeclared';

  const withdrawalKey = `legal3.withdrawal.${context.withdrawalRule}`;
  const summaryKey = `legal3.summary.${context.withdrawalRule}`;

  return (
    <section
      data-hc-legal3-disclosure={variant}
      data-hc-withdrawal-rule={context.withdrawalRule}
      className={cn(
        'rounded-xl border border-gray-200 bg-gray-50/90 px-3 py-3 sm:px-4 space-y-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('legal3.sectionTitle')}
        </h3>
        {context.publicLabel ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {t('legal3.sellerDeclared')}
          </span>
        ) : null}
      </div>

      <dl className="grid gap-1.5 text-sm text-gray-800">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-gray-500">{t('legal3.sellerLabel')}</dt>
          <dd className="font-medium">{t(sellerStatusKey)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-gray-500">{t('legal3.withdrawalLabel')}</dt>
          <dd className="font-medium">{t(withdrawalKey)}</dd>
        </div>
      </dl>

      <p className="text-xs text-gray-600 leading-relaxed">{t(summaryKey)}</p>

      <button
        type="button"
        className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline touch-manipulation"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t('legal3.lessInfo') : t('legal3.moreInfo')}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="space-y-2 text-xs text-gray-600 leading-relaxed border-t border-gray-200 pt-2"
      >
        <p>{t('legal3.platformRole')}</p>
        <p>{t(`legal3.detail.${context.withdrawalRule}`)}</p>
        {context.isProfessionalSellerPath ? (
          <p>{t('legal3.professionalNote')}</p>
        ) : null}
        {context.isPrivateSellerPath ? (
          <p>{t('legal3.privateNote')}</p>
        ) : null}
        {context.isUndeclaredPath ? (
          <p>{t('legal3.undeclaredNote')}</p>
        ) : null}
        <p>
          <Link href="/terms" className="text-emerald-800 underline">
            {t('legal3.termsLink')}
          </Link>
        </p>
      </div>

      {context.serviceStartAckRequired && onServiceStartAckChange ? (
        <label className="flex items-start gap-2 text-xs text-gray-800 pt-1">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={Boolean(serviceStartAckChecked)}
            onChange={(e) => onServiceStartAckChange(e.target.checked)}
            data-hc-legal3-service-start-ack=""
          />
          <span>{t('legal3.serviceStartAck')}</span>
        </label>
      ) : null}
    </section>
  );
}
