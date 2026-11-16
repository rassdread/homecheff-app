'use client';

type DeliveryRequestFeedTileProps = {
  title: string;
  body: string;
  actionLabel: string;
  onOpen: () => void;
};

/** Compact HomeCheff entry. It is not a listing and does not count as a search result. */
export default function DeliveryRequestFeedTile({
  title,
  body,
  actionLabel,
  onOpen,
}: DeliveryRequestFeedTileProps) {
  return (
    <article
      className="col-span-full rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm"
      data-marketplace-delivery="feed-tile"
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
            <circle cx="7" cy="18" r="1.5" />
            <circle cx="18" cy="18" r="1.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-gray-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{body}</p>
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            onClick={onOpen}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
