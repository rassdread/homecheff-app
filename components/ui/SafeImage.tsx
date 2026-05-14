'use client';

import Image from 'next/image';
import { ImgHTMLAttributes, useCallback, useEffect, useState } from 'react';
import { isSafari, isIOS } from '@/lib/browser-utils';
import {
  isLikelyRenderableImageSrc,
  logImageLoadDiag,
  safeImageHostHint,
} from '@/lib/image-load-diagnostics';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

function shouldUseFallbackImage(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const userAgent = navigator.userAgent;
    const isOldIOS = isIOS() && /OS (1[0-2])_/.test(userAgent);
    const isOldSafari = isSafari() && !isIOS() && /Version\/[1-9]\./.test(userAgent);
    return isOldIOS || isOldSafari;
  } catch {
    return false;
  }
}

function Placeholder({
  alt,
  className,
  fill,
  width,
  height,
}: Pick<SafeImageProps, 'alt' | 'className' | 'fill' | 'width' | 'height'>) {
  return (
    <div
      className={`bg-neutral-200 text-neutral-500 flex items-center justify-center text-xs ${className || ''} ${fill ? 'absolute inset-0 h-full w-full' : ''}`}
      style={fill ? { objectFit: 'cover' } : { width, height }}
      role="img"
      aria-label={alt}
    />
  );
}

/**
 * SafeImage — data/blob URLs, old Safari, invalid src, and Next optimizer failures
 * without repeated 422 / console spam.
 */
export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  quality = 70,
  loading = 'lazy',
  placeholder,
  blurDataURL,
  className,
  ...props
}: SafeImageProps) {
  const isDataUrl = src?.startsWith('data:');
  const isBlobUrl = src?.startsWith('blob:');
  const srcOk = isLikelyRenderableImageSrc(src);

  const [useFallback, setUseFallback] = useState(false);
  const [optimizerFailed, setOptimizerFailed] = useState(false);
  const [brokenNative, setBrokenNative] = useState(false);

  useEffect(() => {
    setOptimizerFailed(false);
    setBrokenNative(false);
  }, [src]);

  useEffect(() => {
    const shouldFallback = shouldUseFallbackImage();
    if (shouldFallback !== useFallback) {
      setUseFallback(shouldFallback);
    }
  }, [useFallback]);

  useEffect(() => {
    if (!srcOk && src?.trim()) {
      logImageLoadDiag('image_invalid_source', {
        kind: fill ? 'fill' : 'fixed',
        host: safeImageHostHint(src),
      });
    }
  }, [src, srcOk, fill]);

  const handleNextImageError = useCallback(() => {
    logImageLoadDiag('image_optimizer_rejected', {
      kind: fill ? 'fill' : 'fixed',
      host: safeImageHostHint(src),
    });
    setOptimizerFailed(true);
  }, [src, fill]);

  const handleNativeError = useCallback(() => {
    logImageLoadDiag('image_missing_blob', {
      kind: fill ? 'fill' : 'fixed',
      host: safeImageHostHint(src),
    });
    setBrokenNative(true);
  }, [src, fill]);

  if (!src?.trim() || !srcOk) {
    return <Placeholder alt={alt} className={className} fill={fill} width={width} height={height} />;
  }

  if (brokenNative) {
    return <Placeholder alt={alt} className={className} fill={fill} width={width} height={height} />;
  }

  const shouldUseNativeImg = useFallback || isDataUrl || isBlobUrl || optimizerFailed;

  if (shouldUseNativeImg) {
    const imgLoading = useFallback ? undefined : loading;

    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} absolute inset-0 h-full w-full object-cover object-center`}
          loading={imgLoading}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          onError={handleNativeError}
          {...props}
        />
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={imgLoading}
        onError={handleNativeError}
        {...props}
      />
    );
  }

  const imageProps: Record<string, unknown> = {
    src,
    alt,
    fill,
    width,
    height,
    sizes,
    priority,
    quality,
    placeholder,
    blurDataURL,
    className,
    onError: handleNextImageError,
    ...props,
  };

  if (!priority) {
    imageProps.loading = loading;
  }

  return <Image {...(imageProps as Parameters<typeof Image>[0])} />;
}
