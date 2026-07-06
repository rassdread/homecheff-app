'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { EconomyOpportunitySurfaceContract } from '@/lib/discovery/surfaces/map-economy-opportunity-surface';
import OpportunityEconomyCard from './OpportunityEconomyCard';

export type OpportunityProfileModuleProps = {
  opportunities: EconomyOpportunitySurfaceContract[];
  className?: string;
};

/**
 * Profile owner opportunity module — available opportunities, progress, requirements, benefits.
 */
export default function OpportunityProfileModule({
  opportunities,
  className = '',
}: OpportunityProfileModuleProps) {
  const { t } = useTranslation();

  const sorted = useMemo(
    () =>
      [...opportunities].sort(
        (a, b) => b.effectivePriority - a.effectivePriority,
      ),
    [opportunities],
  );

  if (sorted.length === 0) return null;

  return (
    <div className={`flex flex-col gap-4 ${className}`} data-surface-stack="opportunity-profile">
      <h3 className="text-sm font-semibold text-gray-900">
        {t('surfaces.profile.opportunities.title')}
      </h3>

      {sorted.map((contract) => (
        <section
          key={contract.instanceId}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          data-opportunity-profile={contract.opportunityType}
        >
          <OpportunityEconomyCard
            contract={contract}
            t={t}
            surface="profile_owner"
            compact
          />

          {contract.requirements.length > 0 ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('surfaces.profile.opportunities.requirements')}
              </p>
              <ul className="mt-1 space-y-1">
                {contract.requirements.map((req) => (
                  <li key={req.requirementKey} className="text-xs text-gray-600">
                    • {t(req.requirementKey)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {contract.benefits.length > 0 ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('surfaces.profile.opportunities.benefits')}
              </p>
              <ul className="mt-1 space-y-1">
                {contract.benefits.map((benefit) => (
                  <li key={benefit.benefitKey} className="text-xs text-gray-600">
                    • {t(benefit.benefitKey)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('surfaces.profile.opportunities.progress')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {contract.progress.milestones.map((milestone) => (
                <span
                  key={milestone.id}
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    milestone.completed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t(milestone.labelKey)}
                </span>
              ))}
            </div>
            {contract.progress.nextAction ? (
              <Link
                href={contract.progress.nextAction.href}
                className="mt-2 inline-flex text-xs font-semibold text-violet-700 hover:text-violet-800"
              >
                {t(contract.progress.nextAction.labelKey)} →
              </Link>
            ) : contract.progress.completed ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {t('surfaces.profile.opportunities.completed')}
              </p>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
