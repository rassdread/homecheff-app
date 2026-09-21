import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

const STEPS: Array<keyof Pick<
  VerdienCheckCopy,
  | 'growthStepOffer'
  | 'growthStepCustomer'
  | 'growthStepReviews'
  | 'growthStepRepeat'
  | 'growthStepName'
  | 'growthStepProfessional'
>> = [
  'growthStepOffer',
  'growthStepCustomer',
  'growthStepReviews',
  'growthStepRepeat',
  'growthStepName',
  'growthStepProfessional',
];

export default function VerdienCheckGrowthPath(props: { copy: VerdienCheckCopy }) {
  return (
    <section
      data-verdiencheck-growth-path=""
      className="space-y-2 rounded-2xl border border-stone-200 bg-white px-4 py-3"
    >
      <p className="text-base font-medium text-stone-900">{props.copy.growthBeginSmall}</p>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-stone-700">
        {STEPS.map((key, index) => (
          <li key={key} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span aria-hidden="true" className="text-stone-400">
                →
              </span>
            ) : null}
            <span>{props.copy[key]}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm leading-relaxed text-stone-600">{props.copy.growthWhenSalesGrow}</p>
      <p className="sr-only">{props.copy.introGrowth}</p>
    </section>
  );
}
