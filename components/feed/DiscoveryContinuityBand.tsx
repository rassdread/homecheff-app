'use client';

type Props = {
  title: string;
  body: string;
  actionLabel: string;
  actionKind: 'offer' | 'request' | 'inspiration';
  onAction: () => void;
  /** Shown when a labelled suggestion section follows this band. */
  suggestionLabel: string | null;
};

/**
 * Calm transition after exact discovery is exhausted.
 * One primary action. Suggestions, when present, stay outside this band.
 */
export default function DiscoveryContinuityBand({
  title,
  body,
  actionLabel,
  actionKind,
  onAction,
  suggestionLabel,
}: Props) {
  return (
    <div
      className="rounded-xl border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-4 py-3 text-sm text-[var(--hc-text)]"
      data-testid="feed-discovery-continuity-band"
      data-wx-empty-guidance=""
      data-wx-discovery-continuity="1"
      role="status"
    >
      <p className="text-base font-semibold text-[var(--hc-blue-deep)]">{title}</p>
      <p className="mt-1 text-[var(--hc-text-secondary)]">{body}</p>
      <div className="mt-3">
        <button
          type="button"
          onClick={onAction}
          className="hc-btn-primary min-h-[44px] px-3 py-2 text-sm"
          data-wx-empty-create={
            actionKind === 'offer' || actionKind === 'inspiration' ? '' : undefined
          }
          data-wx-empty-request={actionKind === 'request' ? '' : undefined}
        >
          {actionLabel}
        </button>
      </div>
      {suggestionLabel ? (
        <p
          className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--hc-text-secondary)]"
          data-wx-discovery-suggestion-label=""
        >
          {suggestionLabel}
        </p>
      ) : null}
    </div>
  );
}
