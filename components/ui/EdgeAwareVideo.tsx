'use client';

/**
 * Edge: video alleen via blob-URL (fetch proxy → blob) zodat het inline op de pagina afspeelt.
 * Geen directe URL; blob van proxy werkt wel in Edge.
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
        return;
      }
      if (!isEdgeBrowser() || !isProxyUrl(src)) {
        setEffectiveSrc(src);
        return;
      }
      const cancelled = { v: false };
      // Edge: altijd proxy fetchen en blob-URL gebruiken (geen directe URL) zodat video inline speelt
      const run = (retry = false) => {
        doFetchBlob(src, cancelled)
          .then((objectUrl) => {
            if (!objectUrl || cancelled.v) return;
            blobUrlRef.current = objectUrl;
            setEffectiveSrc(objectUrl);
          })
          .catch(() => {
            if (cancelled.v) return;
            if (retry) {
              if (fallbackSrc) setEffectiveSrc(fallbackSrc);
              else setEffectiveSrc(src);
            } else {
              setTimeout(() => run(true), 500);
            }
          });
      };
      run();

      return () => {
        cancelled.v = true;
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }, [src, fallbackSrc, doFetchBlob]);

    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        onError?.(e);
      },
      [onError]
    );

    return <video ref={ref} src={effectiveSrc} onError={handleError} {...props} />;
  }
);
