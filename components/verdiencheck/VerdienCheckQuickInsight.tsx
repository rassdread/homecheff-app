import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import VerdienCheckOmzetKostenResult from './VerdienCheckOmzetKostenResult';

export default function VerdienCheckQuickInsight(props: {
  copy: VerdienCheckCopy;
  onStart?: () => void;
  startHref?: string;
}) {
  return (
    <section
      data-verdiencheck-quick-insight=""
      className="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4"
    >
      <h2 className="text-lg font-semibold text-emerald-950">{props.copy.quickInsightTitle}</h2>
      <p className="text-sm leading-relaxed text-stone-700">{props.copy.notWholeTurnover}</p>
      <VerdienCheckOmzetKostenResult copy={props.copy} variant="example" />
      <p className="text-sm leading-relaxed text-stone-700">{props.copy.quickInsightAfterResult}</p>
      <p className="text-sm leading-relaxed text-stone-700">{props.copy.quickInsightThenNet}</p>
      {props.onStart ? (
        <button
          type="button"
          data-verdiencheck-quick-insight-cta=""
          onClick={props.onStart}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {props.copy.startForMySituation}
        </button>
      ) : null}
      {props.startHref ? (
        <a
          href={props.startHref}
          data-verdiencheck-quick-insight-cta=""
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-base font-semibold text-white"
        >
          {props.copy.startForMySituation}
        </a>
      ) : null}
    </section>
  );
}
