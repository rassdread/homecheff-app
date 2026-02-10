'use client';

import Image from 'next/image';
import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { isSafari, isIOS } from '@/lib/browser-utils';

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

/**
 * Detect if we're on an old Safari version that doesn't support Next.js Image well
 * iPhone 7 runs iOS 10-15, which has Safari versions that may have issues with Next.js Image
 * 
 * IMPORTANT: This only targets very old Safari versions to ensure modern browsers
 * always use Next.js Image for optimal performance
 */
function shouldUseFallbackImage(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const userAgent = navigator.userAgent;
    
    // Only target very old iOS versions (iOS 10-12, which iPhone 7 can run)
    // iOS 13+ (Safari 13+) should work fine with Next.js Image
    const isOldIOS = isIOS() && /OS (1[0-2])_/.test(userAgent);
    
    // Only target very old Safari desktop versions (Safari 9 and below)
    // Safari 10+ should work fine with Next.js Image
    const isOldSafari = isSafari() && !isIOS() && /Version\/[1-9]\./.test(userAgent);
    
    // Use fallback ONLY for very old Safari/iOS
    // Modern browsers (Chrome, Firefox, Edge, Safari 13+, iOS 13+) will use Next.js Image
    return isOldIOS || isOldSafari;
  } catch (e) {
    // If detection fails, default to Next.js Image (safer for modern browsers)
    return false;
  }
}

/**
 * SafeImage - A wrapper component that handles:
 * 1. Base64 data URLs (fallback for development)
 * 2. Cross-origin blob URLs (Vercel Blob in development causes CORS issues)
 * 3. Regular URLs (production Vercel Blob URLs work fine)
 * 4. Old Safari/iOS versions (iPhone 7 Safari) - use native <img> for better compatibility
 * 
 * Next.js Image component doesn't support data URLs or cross-origin blob URLs,
 * so we fall back to <img> for these cases
 */
export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  quality = 70, // Lower quality for faster loading (optimized for performance)
  loading = 'lazy', // Default to lazy for mobile performance
  placeholder,
  blurDataURL,
  className,
  ...props
}: SafeImageProps) {
  // Check if the src is a base64 data URL or a cross-origin blob URL
  const isDataUrl = src?.startsWith('data:');
  
  // Check for blob URLs - always use fallback since they cause CORS issues in dev
  const isBlobUrl = src?.startsWith('blob:');
  
  // For SSR, default to Next.js Image (will be corrected on client if needed)
  // This prevents hydration mismatches
  const [useFallback, setUseFallback] = useState(false);
  
  useEffect(() => {
    // Only check on client side after hydration
    // This ensures modern browsers always get Next.js Image initially
    const shouldFallback = shouldUseFallbackImage();
    if (shouldFallback !== useFallback) {
      setUseFallback(shouldFallback);
    }
  }, [useFallback]);
  
  // Use regular <img> tag for problematic URLs or old Safari
  // Modern browsers will use Next.js Image (better performance, optimization)
  const shouldUseNativeImg = useFallback || isDataUrl || isBlobUrl;

  if (shouldUseNativeImg) {
    // For old Safari/iOS, use native <img> tag with proper attributes
    // Don't use loading="lazy" on old Safari as it may not be supported
    const imgLoading = useFallback ? undefined : loading;
    
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} absolute inset-0 w-full h-full object-cover`}
          loading={imgLoading}
          style={{ objectFit: 'cover' }}
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
        {...props}
      />
    );
  }

  // Use Next.js Image component for regular URLs on modern browsers
  // Don't pass both priority and loading - if priority is true, loading should not be set
  const imageProps: any = {
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
    ...props
  };

  // Only add loading prop if priority is not true
  if (!priority) {
    imageProps.loading = loading;
  }

  return <Image {...imageProps} />;
}

