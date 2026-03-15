'use client';

/**
 * Video met Edge-ondersteuning. Na security/cookie-patches faalde video in Edge;
 * eerst proxy-URL direct (zelfde als andere browsers), bij fout blob-fallback.
 */
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { isEdgeBrowser } from '@/lib/videoUtils';

function isProxyUrl(s: string | undefined): boolean {
  return typeof s === 'string' && (s.startsWith('/api/video-proxy') || s.includes('video-proxy'));
}

function absoluteUrl(url: string): string {
  if (typeof window === 'undefined' || url.startsWith('http')) return url;
  return new URL(url, window.location.origin).href;
}

export interface EdgeAwareVideoProps extends React.ComponentPropsWithoutRef<'video'> {
  /** Same-origin proxy URL or direct URL (e.g. from getVideoUrlWithCors). */
  src?: string | undefined;
  /** Optional: direct Vercel Blob URL. On Edge tried first, then blob from proxy on error. */
  fallbackSrc?: string | undefined;
}

export const EdgeAwareVideo = forwardRef<HTMLVideoElement, EdgeAwareVideoProps>(
  function EdgeAwareVideo({ src, fallbackSrc, onError, ...props }, ref) {
    const [effectiveSrc, setEffectiveSrc] = useState<string | undefined>(undefined);
    const blobUrlRef = useRef<string | null>(null);
    const triedBlobRef = useRef(false);
    const triedFallbackRef = useRef(false);

    const doFetchBlob = useCallback((proxyUrl: string, cancelled: { v: boolean }) => {
      const url = absoluteUrl(proxyUrl);
      return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
        .then((r) => {
          if (!r.ok || cancelled.v) return null;
          const contentType = r.headers.get('content-type') || 'video/mp4';
          const type = contentType.split(';')[0].trim() || 'video/mp4';
          return r.arrayBuffer().then((buf) => ({ buf, type }));
        })
        .then((result) => {
          if (!result || cancelled.v) return null;
          const blob = new Blob([result.buf], { type: result.type });
          return URL.createObjectURL(blob);
        });
    }, []);

    useEffect(() => {
      if (!src) {
        setEffectiveSrc(undefined);
        triedBlobRef.current = false;
        triedFallbackRef.current = false;
        return;
      }
      setEffectiveSrc(src);
      triedBlobRef.current = false;
      triedFallbackRef.current = false;
      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }, [src]);

    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        if (!effectiveSrc || !isEdgeBrowser()) {
          onError?.(e);
          return;
        }
        // Edge Android: eerst directe URL, bij fout proxy proberen
        if (fallbackSrc && effectiveSrc !== fallbackSrc && !triedFallbackRef.current) {
          triedFallbackRef.current = true;
          setEffectiveSrc(fallbackSrc);
          return;
        }
        // Edge + proxy-URL: bij fout blob van proxy proberen
        if (isProxyUrl(src) && !triedBlobRef.current) {
          triedBlobRef.current = true;
          const cancelled = { v: false };
          doFetchBlob(src!, cancelled)
            .then((objectUrl) => {
              if (objectUrl && !cancelled.v) {
                if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = objectUrl;
                setEffectiveSrc(objectUrl);
              } else if (!cancelled.v && fallbackSrc) setEffectiveSrc(fallbackSrc);
            })
            .catch(() => {
              if (fallbackSrc) setEffectiveSrc(fallbackSrc);
            });
          return;
        }
        onError?.(e);
      },
      [effectiveSrc, fallbackSrc, src, onError, doFetchBlob]
    );

    return <video ref={ref} src={effectiveSrc} onError={handleError} {...props} />;
  }
);
