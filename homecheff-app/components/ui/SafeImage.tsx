'use client';

import Image from 'next/image';
import { ImgHTMLAttributes } from 'react';

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
 * SafeImage - A wrapper component that handles:
 * 1. Base64 data URLs (fallback for development)
 * 2. Cross-origin blob URLs (Vercel Blob in development causes CORS issues)
 * 3. Regular URLs (production Vercel Blob URLs work fine)
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
  quality = 80,
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
  
  // Use regular <img> tag for problematic URLs
  const useFallback = isDataUrl || isBlobUrl;

  if (useFallback) {
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} absolute inset-0 w-full h-full object-cover`}
          loading={loading}
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
        loading={loading}
        {...props}
      />
    );
  }

  // Use Next.js Image component for regular URLs
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      loading={loading}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      className={className}
      {...props}
    />
  );
}

