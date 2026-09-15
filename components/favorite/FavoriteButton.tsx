'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { openSoftAuthGateWithScroll } from '@/lib/onboarding/open-soft-auth-gate';
import {
  fetchFavoriteStatusDeduped,
  getFavoriteSnapshot,
  seedFavoriteSnapshot,
  setFavoriteSnapshot,
  subscribeFavorite,
  type FavoriteItemKind,
} from '@/lib/favorite/favorite-state-store';

interface FavoriteButtonProps {
  productId?: string;
  dishId?: string;
  productTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
  initialFavorited?: boolean;
  showCount?: boolean;
  onCountChange?: (count: number) => void;
}

export default function FavoriteButton({
  productId,
  dishId,
  productTitle = 'dit item',
  className = '',
  size = 'md',
  variant = 'icon',
  initialFavorited,
  showCount = false,
  onCountChange,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [, bump] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind: FavoriteItemKind | null = productId ? 'product' : dishId ? 'dish' : null;
  const itemId = productId ?? dishId ?? '';

  useEffect(() => {
    if (!kind || !itemId) return;
    if (initialFavorited !== undefined) {
      seedFavoriteSnapshot(kind, itemId, { favorited: initialFavorited });
    }
    return subscribeFavorite(kind, itemId, () => bump((n) => n + 1));
  }, [kind, itemId, initialFavorited]);

  const snap = kind && itemId ? getFavoriteSnapshot(kind, itemId) : null;
  const favorited = snap?.favorited ?? Boolean(initialFavorited);

  useEffect(() => {
    if (!kind || !itemId || !session?.user) return;
    if (initialFavorited !== undefined) return;
    if (snap?.favorited) return;
    let cancelled = false;
    void fetchFavoriteStatusDeduped(kind, itemId).then((next) => {
      if (cancelled) return;
      seedFavoriteSnapshot(kind, itemId, { favorited: next });
    });
    return () => {
      cancelled = true;
    };
  }, [kind, itemId, session?.user, initialFavorited, snap?.favorited]);

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setError(null);

    if (!session?.user) {
      const returnPath = `${pathname || '/'}${typeof window !== 'undefined' ? window.location.search : ''}`;
      openSoftAuthGateWithScroll({
        copyKey: 'saveItem',
        intent: {
          type: 'save_item',
          targetId: productId || dishId,
          returnPath,
          autoResume: true,
          draftKey: dishId && !productId ? 'dish' : undefined,
        },
      });
      return;
    }

    if (!kind || !itemId) return;

    const prev = { favorited };
    const optimistic = !prev.favorited;
    setFavoriteSnapshot(kind, itemId, { favorited: optimistic }, { local: true });
    setLoading(true);
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(productId ? { productId } : { dishId }),
      });

      if (!response.ok) {
        setFavoriteSnapshot(kind, itemId, prev, { local: true });
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error || t('errors.favoriteError'));
        return;
      }
      const data = (await response.json()) as { favorited?: boolean };
      const next = Boolean(data.favorited);
      setFavoriteSnapshot(kind, itemId, { favorited: next }, { local: true });
      if (showCount) {
        setFavoriteCount((c) => Math.max(0, c + (next ? 1 : -1)));
        onCountChange?.(favoriteCount);
      }
    } catch {
      setFavoriteSnapshot(kind, itemId, prev, { local: true });
      setError(t('errors.favoriteError'));
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: variant === 'button' ? 'px-3 py-1.5 text-sm' : 'p-1.5',
    md: variant === 'button' ? 'px-4 py-2 text-base' : 'p-2',
    lg: variant === 'button' ? 'px-6 py-3 text-lg' : 'p-3',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const label = favorited ? t('favorites.saved') : t('favorites.save');

  const errorLine = error ? (
    <span className="sr-only" role="alert">
      {error}
    </span>
  ) : null;

  if (variant === 'button') {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={loading || !itemId}
          className={`
            ${sizeClasses[size]}
            flex items-center gap-2 rounded-lg font-medium transition-colors
            ${favorited
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          title={error || label}
          aria-pressed={favorited}
          aria-label={label}
        >
          <Heart className={`${iconSize[size]} ${favorited ? 'fill-current' : ''}`} />
          <span>{label}</span>
        </button>
        {error ? (
          <span className="text-[11px] font-medium text-red-700" role="alert">
            {error}
          </span>
        ) : null}
        {errorLine}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleToggleFavorite}
        disabled={loading || !itemId}
        className={`
          ${sizeClasses[size]}
          bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          inline-flex items-center gap-1
          ${className}
        `}
        title={error || label}
        aria-label={label}
        aria-pressed={favorited}
      >
        <Heart
          className={`
            ${iconSize[size]}
            transition-colors
            ${favorited ? 'text-red-500 fill-red-500' : 'text-neutral-600 hover:text-red-500'}
          `}
        />
        {showCount && favoriteCount > 0 ? (
          <span className="text-xs font-semibold text-gray-600">{favoriteCount}</span>
        ) : null}
      </button>
      {errorLine}
    </span>
  );
}
