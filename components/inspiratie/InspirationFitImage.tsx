'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  getMediaFitMode,
  inspirationMediaClass,
  INSPIRATION_MEDIA_CLASS,
  loadImageAspectRatio,
  type InspirationMediaContext,
} from '@/lib/inspiratie/media-fit';

type Props = {
  src: string;
  alt?: string;
  context: InspirationMediaContext;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  priority?: boolean;
  onClick?: () => void;
};

export default function InspirationFitImage({
  src,
  alt = '',
  context,
  className,
  containerClassName,
  sizes = '100vw',
  priority = false,
  onClick,
}: Props) {
  const staticFit = getMediaFitMode(null, context);
  const [heroFit, setHeroFit] = useState<'cover' | 'contain'>(staticFit);

  useEffect(() => {
    if (context !== 'hero') return;
    let cancelled = false;
    void loadImageAspectRatio(src).then((ratio) => {
      if (cancelled) return;
      setHeroFit(getMediaFitMode(ratio, 'hero'));
    });
    return () => {
      cancelled = true;
    };
  }, [src, context]);

  const fit = context === 'hero' ? heroFit : staticFit;
  const fitClass = inspirationMediaClass(fit);

  if (context === 'lightbox') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(
          INSPIRATION_MEDIA_CLASS.contain,
          'max-h-[75vh] max-w-[85vw] h-auto w-auto rounded-2xl',
          className,
        )}
      />
    );
  }

  if (context === 'print-hero' || context === 'print-step') {
    const wrapClass =
      context === 'print-hero'
        ? INSPIRATION_MEDIA_CLASS.printHeroWrap
        : INSPIRATION_MEDIA_CLASS.printStepWrap;
    return (
      <div className={cn(wrapClass, containerClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={cn(INSPIRATION_MEDIA_CLASS.contain, className)} />
      </div>
    );
  }

  if (context === 'step') {
    const Wrapper = onClick ? 'button' : 'div';
    return (
      <Wrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={cn(
          INSPIRATION_MEDIA_CLASS.stepWrap,
          'touch-manipulation',
          onClick && 'cursor-pointer transition hover:opacity-95',
          containerClassName,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(INSPIRATION_MEDIA_CLASS.contain, className)}
        />
      </Wrapper>
    );
  }

  const Wrapper = onClick ? 'button' : 'div';

  if (context === 'extra') {
    return (
      <Wrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={cn(
          INSPIRATION_MEDIA_CLASS.extraWrap,
          'touch-manipulation',
          onClick && 'cursor-pointer',
          containerClassName,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(INSPIRATION_MEDIA_CLASS.contain, className)}
        />
      </Wrapper>
    );
  }

  if (context === 'thumbnail') {
    return (
      <Wrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={cn('relative h-full w-full overflow-hidden', containerClassName)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(inspirationMediaClass('cover'), className)}
          sizes={sizes}
        />
      </Wrapper>
    );
  }

  // hero
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden bg-gray-50',
        containerClassName,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={cn(fitClass, 'transition-transform duration-300', className)}
        sizes={sizes}
      />
    </Wrapper>
  );
}
