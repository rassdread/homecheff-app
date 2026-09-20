import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';

export default function VerdienCheckSourceDetails(props: {
  source: string | null;
  url: string | null;
}) {
  if (!props.source && !props.url) return null;
  return (
    <details className="mt-2 text-xs text-stone-500">
      <summary className="cursor-pointer">{PERSONAL_ROUTE_COPY.sourceDetails}</summary>
      <p className="mt-1">
        {props.source}
        {props.url ? (
          <>
            {' '}
            <a href={props.url} target="_blank" rel="noreferrer" className="underline">
              {PERSONAL_ROUTE_COPY.officialInfo}
            </a>
          </>
        ) : null}
      </p>
    </details>
  );
}
