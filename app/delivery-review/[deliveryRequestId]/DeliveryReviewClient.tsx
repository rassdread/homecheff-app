'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function DeliveryReviewClient({
  deliveryRequestId,
}: {
  deliveryRequestId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/delivery-requests/${deliveryRequestId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.errorKey === 'string' ? data.errorKey : null;
        setError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      router.push('/profile/deals');
    } catch {
      setError(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">
        {t('trust.review.deliveryHeading')}
      </h1>
      <p className="text-sm text-gray-600">{t('trust.review.deliveryIntro')}</p>

      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('trust.review.ratingLabel')}
          </label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} ({n})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('trust.review.messageLabel')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('trust.review.submit')}
        </button>
      </form>
    </div>
  );
}
