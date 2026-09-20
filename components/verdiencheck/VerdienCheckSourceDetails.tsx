import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
} from '@/lib/analytics/verdiencheck-funnel';

export default function VerdienCheckSourceDetails(props: {
  source: string | null;
  url: string | null;
}) {
  if (!props.source && !props.url) return null;
  return (
    <details
      className="mt-2 text-xs text-stone-500"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) {
          trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.detailsOpened);
        }
      }}
    >
      <summary className="cursor-pointer">{PERSONAL_ROUTE_COPY.sourceDetails}</summary>
      <p className="mt-1">
        {props.source}
        {props.url ? (
          <>
            {' '}
            <a
              href={props.url}
              target="_blank"
              rel="noreferrer"
              className="underline"
              onClick={() =>
                trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.officialLinkClicked, {
                  action: 'LEARN_MORE',
                })
              }
            >
              {PERSONAL_ROUTE_COPY.officialInfo}
            </a>
          </>
        ) : null}
      </p>
    </details>
  );
}
