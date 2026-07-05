'use client';

import { useState } from 'react';
import { QrCode, Share2 } from 'lucide-react';
import AffiliateQuickShareModal from '@/components/affiliate/AffiliateQuickShareModal';
import {
  WidgetActionButton,
  WidgetCard,
  WidgetCta,
  WidgetLine,
  WidgetSkeleton,
} from '@/components/operations/widgets/widget-ui';
import type { OperationsWidgetProps } from '@/components/operations/widgets/types';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

export default function PartnersGrowthWidget({ compact }: OperationsWidgetProps) {
  const { t, language } = useTranslation();
  const { sectionExtras } = useOperationsSidepanel();
  const [qrOpen, setQrOpen] = useState(false);

  const partner = sectionExtras.partner;
  const loading = sectionExtras.loadingSection && !partner;

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  if (loading) return <WidgetSkeleton />;

  const signups = partner?.signupsViaLink ?? 0;
  const available = partner?.availableCents ?? 0;

  return (
    <>
      <WidgetCard title={t('partners.growth.title')} variant="growth">
        <p className="mb-2 text-xs leading-relaxed text-gray-600">
          {t('partners.growth.description')}
        </p>
        <div className="mb-2 space-y-1">
          <WidgetLine
            label={t('partners.growth.statsSignups')}
            value={signups > 0 ? signups : null}
          />
          {available > 0 ? (
            <WidgetLine
              label={t('partners.growth.statsEarnings')}
              value={formatCurrency(available)}
            />
          ) : null}
          {signups === 0 && available === 0 ? (
            <p className="text-xs text-gray-500">
              {t('partners.growth.emptyHint')}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <WidgetActionButton
            label={t('partners.actions.showQr')}
            onClick={() => setQrOpen(true)}
            primary
            icon={<QrCode className="h-3.5 w-3.5" aria-hidden />}
          />
          <WidgetActionButton
            label={t('partners.actions.shareLink')}
            onClick={() => setQrOpen(true)}
            icon={<Share2 className="h-3.5 w-3.5" aria-hidden />}
          />
          {!compact ? (
            <WidgetCta
              href={OPERATIONS_ROUTES.affiliate.promoCodes}
              label={t('partners.actions.promoCodes')}
            />
          ) : null}
        </div>
      </WidgetCard>
      <AffiliateQuickShareModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}
