'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import type { PartnerTodaySnapshot } from '@/hooks/useOperationsTodayRoleData';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

type Props = {
  data: PartnerTodaySnapshot | null;
  expanded: boolean;
  onToggle: () => void;
  loading?: boolean;
};

export default function PartnerTodayCard({
  data,
  expanded,
  onToggle,
  loading = false,
}: Props) {
  const { t, language } = useTranslation();

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const title = t('operations.tabs.partners');
  const cta = t('operations.today.partner.cta');
  const linkLabel = t('operations.today.partner.link');
  const availableLabel = t('operations.today.partner.available');
  const signupsLabel = t('operations.today.partner.signups');

  if (loading) {
    return (
      <article className="hc-dorpsplein-card animate-pulse p-4">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="mt-3 h-16 rounded-lg bg-gray-100" />
      </article>
    );
  }

  if (!data) return null;

  return (
    <article className="hc-dorpsplein-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-violet-700" aria-hidden />
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded ? (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <p className="mb-3 text-xs text-gray-600">
            {t('partners.growth.description')}
          </p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500">{availableLabel}</dt>
              <dd className="font-semibold text-emerald-800">
                {formatCurrency(data.availableCents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{signupsLabel}</dt>
              <dd className="font-semibold text-gray-900">
                {data.totalReferrals}
              </dd>
            </div>
            {data.referralLink ? (
              <div>
                <dt className="text-xs text-gray-500">{linkLabel}</dt>
                <dd className="mt-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-700">
                  {data.referralLink}
                </dd>
              </div>
            ) : null}
          </dl>

          <Link
            href={OPERATIONS_ROUTES.affiliate.home}
            prefetch
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            {cta}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
