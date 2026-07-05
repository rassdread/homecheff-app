'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import {
  WidgetCard,
  WidgetCta,
  WidgetLine,
  WidgetSkeleton,
} from '@/components/operations/widgets/widget-ui';
import type { OperationsWidgetProps } from '@/components/operations/widgets/types';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

export default function PartnersNetworkWidget({ compact }: OperationsWidgetProps) {
  const { t, language } = useTranslation();
  const { sectionExtras } = useOperationsSidepanel();
  const partner = sectionExtras.partner;

  if (sectionExtras.loadingSection && !partner) {
    return <WidgetSkeleton />;
  }

  if (!partner || partner.isSubAffiliate) return null;

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  return (
    <WidgetCard title={t('partners.network.title')} variant="network">
      <p className="mb-2 text-xs leading-relaxed text-gray-600">
        {t('partners.network.description')}
      </p>
      <div className="mb-2 space-y-1">
        <WidgetLine
          label={t('partners.network.statsDirect')}
          value={
            partner.directPartnersCount > 0 ? partner.directPartnersCount : null
          }
        />
        {!compact ? (
          <WidgetLine
            label={t('partners.network.statsActive')}
            value={
              partner.activeDirectPartners > 0
                ? partner.activeDirectPartners
                : null
            }
          />
        ) : null}
        {partner.networkEarningsCents > 0 ? (
          <WidgetLine
            label={t('partners.network.statsEarnings')}
            value={formatCurrency(partner.networkEarningsCents)}
          />
        ) : null}
      </div>
      <div className="grid gap-2">
        <Link
          href={OPERATIONS_ROUTES.affiliate.invitePartner}
          prefetch
          className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-violet-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-800"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          {t('partners.actions.invitePartner')}
        </Link>
        {!compact ? (
          <>
            <WidgetCta
              href={OPERATIONS_ROUTES.affiliate.network}
              label={t('partners.actions.viewDirectPartners')}
              primary
            />
            <WidgetCta
              href={OPERATIONS_ROUTES.affiliate.earnings}
              label={t('partners.actions.networkEarnings')}
            />
          </>
        ) : (
          <WidgetCta
            href={OPERATIONS_ROUTES.affiliate.network}
            label={t('partners.actions.viewDirectPartners')}
          />
        )}
      </div>
    </WidgetCard>
  );
}
