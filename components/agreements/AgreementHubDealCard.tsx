'use client';

import type { AgreementHubDealItem } from '@/lib/agreements/agreements-hub-types';
import { agreementKindLabelKey } from '@/lib/agreements/agreement-display-kind';
import { useTranslation } from '@/hooks/useTranslation';
import ProfileDealCard from '@/components/profile/ProfileDealCard';
import AgreementTimeline from './AgreementTimeline';
import AgreementAgendaMeta from './AgreementAgendaMeta';

export default function AgreementHubDealCard({
  item,
  onUpdated,
}: {
  item: AgreementHubDealItem;
  onUpdated: (deal: AgreementHubDealItem['deal']) => void;
}) {
  const { t } = useTranslation();

  return (
    <li className="divide-y divide-gray-100">
      <div className="space-y-3 px-4 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            {t(agreementKindLabelKey(item.displayKind))}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
            {t(`communityOrder.status.${item.deal.status.toLowerCase()}`)}
          </span>
        </div>
        <AgreementAgendaMeta agenda={item.agenda} />
        <AgreementTimeline steps={item.timeline} />
      </div>
      <ProfileDealCard deal={item.deal} onUpdated={onUpdated} as="div" />
    </li>
  );
}
