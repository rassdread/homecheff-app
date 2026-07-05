'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  inspirationMediaClass,
  INSPIRATION_MEDIA_CLASS,
} from '@/lib/inspiratie/media-fit';
import {
  useSmartMediaFit,
  type SmartMediaFitMode,
} from '@/hooks/useSmartMediaFit';

type Props = {
  src: string;
  alt?: string;
  /** card/preview = smart fit; always-contain = full frame (steps, owner previews) */
  mode?: SmartMediaFitMode | 'product-story-step';
  forceFit?: 'cover' | 'contain';
  className?: string;
  wrapperClassName?: string;
  /** Absolute inset-0 fill pattern for card containers */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  /** Use next/image instead of native img (for SafeImage-like optimization) */
  useNextImage?: boolean;
};

export default function SmartFitMediaImage({
  src,
  alt = '',
  mode = 'card',
  forceFit,
  className,
  wrapperClassName,
  fill = false,
  sizes = '100vw',
  priority = false,
  loading = 'lazy',
  onClick,
  useNextImage = false,
}: Props) {
  const hookMode: SmartMediaFitMode =
    mode === 'product-story-step' ? 'always-contain' : mode;
  const fit = useSmartMediaFit(src, {
    mode: hookMode,
    forceFit: mode === 'product-story-step' ? 'contain' : forceFit,
  });
  const fitClass = inspirationMediaClass(fit);

  if (mode === 'product-story-step') {
    return (
      <div className={cn(INSPIRATION_MEDIA_CLASS.productStoryStepWrap, wrapperClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={cn(INSPIRATION_MEDIA_CLASS.contain, className)}
        />
      </div>
    );
  }

  if (mode === 'always-contain' && !fill) {
    return (
      <div
        className={cn(
          INSPIRATION_MEDIA_CLASS.profilePreviewWrap,
          wrapperClassName,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading={loading}
          onClick={onClick}
          className={cn(INSPIRATION_MEDIA_CLASS.contain, className)}
        />
      </div>
    );
  }

  const imgClass = cn(
    fill ? `absolute inset-0 h-full w-full ${fitClass}` : `h-full w-full ${fitClass}`,
    'bg-neutral-50',
    className,
  );

  if (useNextImage && fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={cn(fitClass, 'bg-neutral-50', className)}
        sizes={sizes}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : loading}
      onClick={onClick}
      className={imgClass}
    />
  );
}
