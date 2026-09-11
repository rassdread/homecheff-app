'use client';

import { useCallback, useEffect, useState } from 'react';
import ReviewCard from '@/components/reviews/ReviewCard';
import type { TrustReviewItem } from '@/lib/trust/profile-trust-reviews';

type Props = {
  userId: string;
  /** compact for dense profile layouts */
  variant?: 'compact' | 'full';
};

export default function ProfileTrustReviewsList({
  userId,
  variant = 'full',
}: Props) {
  const [reviews, setReviews] = useState<TrustReviewItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (next?: string | null, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        const qs = new URLSearchParams({ take: '12' });
        if (next) qs.set('cursor', next);
        const res = await fetch(`/api/user/${userId}/trust-reviews?${qs}`);
        if (!res.ok) throw new Error('load_failed');
        const data = await res.json();
        const list: TrustReviewItem[] = Array.isArray(data.reviews)
          ? data.reviews
          : [];
        setReviews((prev) => (append ? [...prev, ...list] : list));
        setCursor(data.nextCursor ?? null);
      } catch {
        setError('Beoordelingen konden niet worden geladen.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void load(null, false);
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-emerald-50/80"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nog geen geschreven beoordelingen om te tonen.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-emerald-950">Beoordelingen</h3>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={`${r.channel}-${r.id}`}>
            <ReviewCard
              variant={variant}
              review={{
                id: r.id,
                rating: r.rating,
                title: r.title,
                text: r.text,
                createdAt: r.createdAt,
                isVerified: r.isVerified,
                listingTitle: r.listingTitle,
                channel: r.channel,
                reviewer: r.reviewer,
                images: r.images,
              }}
            />
          </li>
        ))}
      </ul>
      {cursor ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void load(cursor, true)}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
        >
          {loadingMore ? 'Laden…' : 'Meer beoordelingen'}
        </button>
      ) : null}
    </div>
  );
}
