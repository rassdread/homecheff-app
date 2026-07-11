/** Shared route loading skeletons — used by route loading.tsx files and Suspense fallbacks. */

export function FeedTileGridLoadingSkeleton({
  tiles = 4,
  compact = false,
}: {
  tiles?: number;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-2'
          : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
      }
      aria-busy
      aria-label="Feed laden"
    >
      {Array.from({ length: tiles }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className={compact ? 'aspect-[4/3] bg-gray-200' : 'aspect-[16/10] bg-gray-200'} />
          <div className="space-y-2 p-3">
            <div className="h-3 w-16 rounded-full bg-orange-100" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-6 rounded-md bg-gray-100" />
              <div className="h-6 w-6 rounded-md bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeFeedViewportShell() {
  return (
    <div className="min-w-0 space-y-4" aria-busy aria-label="Marketplace laden">
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-gray-200" />
        ))}
      </div>
      <FeedTileGridLoadingSkeleton tiles={4} />
    </div>
  );
}

export function ProfileShellLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-24 rounded-full bg-gray-200" />
            ))}
          </div>
          <CardListLoadingSkeleton rows={4} />
        </div>
      </div>
    </main>
  );
}

export function NotificationsLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-gray-200" />
        <CardListLoadingSkeleton rows={6} />
      </div>
    </main>
  );
}

export function GlobalRouteLoadingSkeleton() {
  return (
    <div
      className="min-h-[50vh] bg-gradient-to-b from-neutral-50 to-white"
      aria-busy
      aria-label="Pagina laden"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-neutral-200" />
          <div className="h-4 w-full max-w-xl rounded bg-neutral-100" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="h-40 rounded-2xl bg-neutral-200/80" />
            <div className="h-40 rounded-2xl bg-neutral-200/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-32 rounded bg-gray-200" />
          <div className="h-96 rounded-3xl bg-gray-200" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-5/6 rounded bg-gray-200" />
            </div>
            <div className="h-64 rounded-3xl bg-gray-200" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function MessagesLoadingSkeleton() {
  return (
    <div className="hc-messages-root flex min-h-0 flex-col overflow-hidden bg-[#e8eaed]">
      <div className="h-16 flex-shrink-0 animate-pulse border-b bg-white" />
      <div className="flex min-h-0 flex-1">
        <div className="w-full max-w-sm space-y-3 border-r bg-white p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden flex-1 items-center justify-center bg-white/60 lg:flex">
          <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function SellerDashboardLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 h-10 w-40 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 animate-pulse">
          <div className="mb-4 h-8 w-56 rounded bg-gray-200" />
          <div className="h-4 w-72 max-w-full rounded bg-gray-100" />
          <div className="mt-4 h-24 rounded-2xl bg-gray-200/70" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
              <div className="mb-2 h-8 w-32 rounded bg-gray-200" />
              <div className="h-3 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-6 w-40 rounded bg-gray-200" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * Generic card-list skeleton (UX-FIN-3B.2). Reused for inline loading states
 * that previously showed a bare spinner (profile deals, delivery dashboard).
 */
export function CardListLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy aria-label="Laden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4"
        >
          <div className="flex gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
              <div className="h-3 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SellerOrdersLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 h-10 w-44 animate-pulse rounded-lg bg-neutral-200" />
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6 animate-pulse">
          <div className="mb-2 h-8 w-48 rounded bg-neutral-200" />
          <div className="h-4 w-64 max-w-full rounded bg-neutral-100" />
        </div>
        <div className="mb-6 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-neutral-200" />
          ))}
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5"
            >
              <div className="flex gap-4">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 rounded bg-neutral-100" />
                  <div className="h-3 w-1/3 rounded bg-neutral-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
