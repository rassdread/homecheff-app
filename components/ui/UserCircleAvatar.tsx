'use client';

import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';

const SIZE_PX = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56 } as const;

export type UserCircleAvatarSize = keyof typeof SIZE_PX;

export type UserCircleAvatarProps = {
  src?: string | null;
  alt: string;
  size?: UserCircleAvatarSize;
  /** Applied to the outer circular frame (e.g. borders). */
  className?: string;
  /** Merged onto the image layer (e.g. hover rings). */
  imageClassName?: string;
  /** Used for the initial when `src` is empty. */
  nameForInitial?: string | null;
};

/**
 * Circular profile (or product-in-circle) avatar: fixed square, overflow clip,
 * centered cover — consistent across feed, messages, and lists.
 */
export default function UserCircleAvatar({
  src,
  alt,
  size = 'lg',
  className,
  imageClassName,
  nameForInitial,
}: UserCircleAvatarProps) {
  const px = SIZE_PX[size];
  const dim = `${px}px`;
  const trimmed = typeof src === 'string' ? src.trim() : '';
  const hasSrc = trimmed.length > 0;
  const initialSource = (nameForInitial ?? alt ?? '?').trim();
  const letter = (initialSource.charAt(0) || '?').toUpperCase();

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full ring-1 ring-black/[0.06]',
        hasSrc ? 'bg-slate-200' : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800',
        className
      )}
      style={{ width: dim, height: dim, minWidth: dim, minHeight: dim }}
    >
      {hasSrc ? (
        <SafeImage
          src={trimmed}
          alt={alt}
          fill
          sizes={`${px}px`}
          className={cn('object-cover object-center', imageClassName)}
        />
      ) : (
        <span
          className="flex h-full w-full select-none items-center justify-center font-semibold leading-none"
          style={{ fontSize: Math.max(10, Math.round(px * 0.36)) }}
          aria-hidden
        >
          {letter}
        </span>
      )}
    </div>
  );
}
