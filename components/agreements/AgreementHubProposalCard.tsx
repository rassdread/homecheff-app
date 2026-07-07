'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { agreementKindLabelKey } from '@/lib/agreements/agreement-display-kind';
import type { AgreementHubProposalItem } from '@/lib/agreements/agreements-hub-types';
import { PROPOSAL_I18N } from '@/lib/proposals/proposal-i18n-keys';
import AgreementTimeline from './AgreementTimeline';
import AgreementAgendaMeta from './AgreementAgendaMeta';

export default function AgreementHubProposalCard({
  item,
}: {
  item: AgreementHubProposalItem;
}) {
  const { t } = useTranslation();
  const { proposal } = item;

  return (
    <li className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
              {t(agreementKindLabelKey(item.displayKind))}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900">
              {t(PROPOSAL_I18N.status.PENDING)}
            </span>
          </div>
          <p className="font-semibold text-gray-900">{proposal.title}</p>
          {item.counterpartName ? (
            <p className="text-xs text-gray-600">
              {t('community.agreements.withCounterpart', {
                name: item.counterpartName,
              })}
            </p>
          ) : null}
        </div>
      </div>

      <AgreementAgendaMeta agenda={item.agenda} />

      <AgreementTimeline steps={item.timeline} compact />

      <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 space-y-2">
        <p className="text-xs font-medium text-amber-950">
          {t('marketplace.agreements.nextStepHeading')}
        </p>
        <p className="text-[11px] text-amber-900">{t(item.nextStepHintKey)}</p>
        <Link
          href={`/messages/${item.conversationId}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-3 py-2.5 text-xs font-semibold text-white hover:bg-indigo-800"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          {t(item.primaryCtaLabelKey)}
        </Link>
      </div>

      <Link
        href={`/messages/${item.conversationId}`}
        className="text-xs font-semibold text-indigo-700 underline"
      >
        {t('marketplace.agreements.actions.openChat')}
      </Link>
    </li>
  );
}
