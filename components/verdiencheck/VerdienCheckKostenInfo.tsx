import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

export default function VerdienCheckKostenInfo(props: {
  copy: VerdienCheckCopy;
  compact?: boolean;
}) {
  return (
    <details
      data-verdiencheck-kosten-info=""
      className={props.compact ? 'relative inline-block' : 'mt-1'}
    >
      <summary
        className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-full text-base text-emerald-900 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden"
        aria-label={props.copy.kostenInfoLabel}
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ⓘ
        </span>
      </summary>
      <p
        role="note"
        className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600"
      >
        {props.copy.kostenInfoBody}
      </p>
    </details>
  );
}
