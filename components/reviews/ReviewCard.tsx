'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import StarRating from '@/components/reviews/StarRating';
import UserCircleAvatar from '@/components/ui/UserCircleAvatar';
import { getDisplayName } from '@/lib/displayName';

export type ReviewCardImage = {
  id?: string;
  url: string;
  sortOrder?: number;
};

export type ReviewCardData = {
  id: string;
  rating: number;
  title?: string | null;
  text?: string | null;
  comment?: string | null;
  createdAt: string;
  isVerified?: boolean;
  listingTitle?: string | null;
  channel?: 'product' | 'deal' | 'courier';
  reviewer: {
    id?: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    profileImage?: string | null;
  };
  images?: ReviewCardImage[];
};

type Props = {
  review: ReviewCardData;
  variant?: 'compact' | 'full';
  className?: string;
};

function bodyText(review: ReviewCardData): string | null {
  const raw = (review.text ?? review.comment ?? '').trim();
  return raw.length > 0 ? raw : null;
}

export default function ReviewCard({
  review,
  variant = 'full',
  className,
}: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const images = [...(review.images ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const text = bodyText(review);
  const compact = variant === 'compact';
  const avatar =
    review.reviewer.image || review.reviewer.profileImage || null;
  const name = getDisplayName(review.reviewer);

  const dateLabel = new Date(review.createdAt).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article
      className={`rounded-xl border border-emerald-100/80 bg-white p-4 ${className ?? ''}`}
    >
      <header className="mb-2 flex items-start gap-3">
        <UserCircleAvatar
          src={avatar}
          alt={name}
          size={compact ? 'sm' : 'md'}
          nameForInitial={name}
          className="border border-gray-200 bg-gray-50"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-gray-900">{name}</h4>
            {review.isVerified ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                Via HomeCheff
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <StarRating rating={review.rating} size="sm" />
            <span aria-hidden>•</span>
            <time dateTime={review.createdAt}>{dateLabel}</time>
          </div>
          {review.listingTitle && !compact ? (
            <p className="mt-1 truncate text-xs text-gray-500">
              Over: {review.listingTitle}
            </p>
          ) : null}
        </div>
      </header>

      {review.title ? (
        <h5 className="mb-1 text-sm font-medium text-gray-900">{review.title}</h5>
      ) : null}

      {text ? (
        <p
          className={`text-sm leading-relaxed text-gray-700 ${
            compact ? 'line-clamp-3' : ''
          }`}
        >
          {text}
        </p>
      ) : null}

      {images.length > 0 ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Camera className="h-3.5 w-3.5" aria-hidden />
            <span>
              {images.length} foto{images.length === 1 ? '' : "'s"}
            </span>
          </div>
          <ul
            className={`grid gap-2 ${
              images.length === 1
                ? 'grid-cols-1 max-w-[200px]'
                : 'grid-cols-3 sm:grid-cols-4'
            }`}
          >
            {images.map((img, idx) => (
              <li key={img.id || img.url}>
                <button
                  type="button"
                  onClick={() => setLightbox(idx)}
                  className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  aria-label={`Reviewfoto ${idx + 1} vergroten`}
                >
                  <Image
                    src={img.url}
                    alt={`Reviewfoto ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lightbox != null && images[lightbox] ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reviewfoto"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-900"
            aria-label="Sluiten"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative h-[70vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightbox]!.url}
              alt={`Reviewfoto ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
