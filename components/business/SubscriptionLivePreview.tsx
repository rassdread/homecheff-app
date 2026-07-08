'use client';

import {
  buildLivePreviewFields,
  computeVisibilityScore,
  type DnaPreviewField,
} from '@/lib/business/dna-preview';
import {
  getBusinessVisibilityProfile,
  listBusinessPlanIds,
  type BusinessPlanId,
} from '@/lib/business/visibility-profile';
import BusinessPlanBadge from '@/components/business/BusinessPlanBadge';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  plan: BusinessPlanId;
  onPlanChange: (plan: BusinessPlanId) => void;
  className?: string;
};

function Dots({ level, max }: { level: number; max: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < level ? 'bg-emerald-500' : 'bg-gray-200'}`}
        />
      ))}
    </span>
  );
}

function PreviewValue({ field, t, plan }: { field: DnaPreviewField; t: (k: string) => string; plan: BusinessPlanId }) {
  switch (field.kind) {
    case 'badge':
      return plan === 'individual' ? (
        <span className="text-sm text-gray-500">{t(field.textKey ?? '')}</span>
      ) : (
        <BusinessPlanBadge plan={plan} t={t} size="sm" />
      );
    case 'dots':
      return <Dots level={field.dots ?? 0} max={field.maxDots ?? 4} />;
    case 'label':
      return (
        <span className="text-sm font-medium text-gray-900">
          {field.textKey ? t(field.textKey) : '—'}
        </span>
      );
    case 'status':
      return (
        <span className="text-sm font-medium text-gray-800">
          {t(`business.dna.status.${field.status ?? 'none'}`)}
        </span>
      );
    case 'score':
      return (
        <span className="text-sm font-semibold text-emerald-700">
          {field.score}/100
        </span>
      );
    case 'locations':
      return (
        <span className="text-sm font-medium text-gray-900">
          {(field.locations ?? 1) >= 99
            ? t('business.dna.compare.locationsUnlimited')
            : String(field.locations ?? 1)}
        </span>
      );
    default:
      return null;
  }
}

export default function SubscriptionLivePreview({ plan, onPlanChange, className = '' }: Props) {
  const { t } = useTranslation();
  const dna = getBusinessVisibilityProfile(plan);
  const fields = buildLivePreviewFields(plan);
  const score = computeVisibilityScore(dna);
  const plans = listBusinessPlanIds();

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
      aria-live="polite"
      data-dna-preview-plan={plan}
    >
      <h2 className="text-lg font-bold text-gray-900">{t('business.dna.preview.liveTitle')}</h2>
      <p className="mt-1 text-sm text-gray-600">{t('business.dna.preview.liveSubtitle')}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {plans.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPlanChange(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              plan === id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(`business.dna.plan.${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700">
            {t('business.dna.preview.visibilityScore')}
          </span>
          <span className="text-lg font-bold text-emerald-700">{score}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <dl className="mt-4 space-y-2.5">
        {fields.map((field) => (
          <div key={field.labelKey} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-gray-600">{t(field.labelKey)}</dt>
            <dd className="text-right">
              <PreviewValue field={field} t={t} plan={plan} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
