'use client';

/**
 * Video that works on Edge: we avoid giving Edge the proxy URL.
 * On Edge we fetch the proxy response, build a Blob with explicit video/mp4 type,
 * and set a blob: URL. If that still fails, we try the direct URL (fallbackSrc) if provided.
 */
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { isEdgeBrowser } from '@/lib/videoUtils';

function isProxyUrl(s: string | undefined): boolean {
  return typeof s === 'string' && (s.startsWith('/api/video-proxy') || s.includes('video-proxy'));
}

export interface EdgeAwareVideoProps extends React.ComponentPropsWithoutRef<'video'> {
  /** Same-origin proxy URL (e.g. from getVideoUrlWithCors). */
  src?: string | undefined;
  /** Optional: direct Vercel Blob URL. On Edge, used as fallback if blob-URL fails. */
  fallbackSrc?: string | undefined;
}

export const EdgeAwareVideo = forwardRef<HTMLVideoElement, EdgeAwareVideoProps>(
  function EdgeAwareVideo({ src, fallbackSrc, onError, ...props }, ref) {
    const [effectiveSrc, setEffectiveSrc] = useState<string | undefined>(undefined);
    const blobUrlRef = useRef<string | null>(null);
    const usedFallbackRef = useRef(false);

    useEffect(() => {
      if (!src) {
        setEffectiveSrc(undefined);
        return;
      }
      usedFallbackRef.current = false;
      if (!isEdgeBrowser() || !isProxyUrl(src)) {
        setEffectiveSrc(src);
        return;
      }
      let cancelled = false;
      fetch(src, { credentials: 'same-origin', cache: 'no-store' })
        .then((r) => {
          if (!r.ok || cancelled) return null;
          const contentType = r.headers.get('content-type') || 'video/mp4';
          const type = contentType.split(';')[0].trim() || 'video/mp4';
          return r.arrayBuffer().then((buf) => ({ buf, type }));
        })
        .then((result) => {
          if (!result || cancelled) return;
          const blob = new Blob([result.buf], { type: result.type });
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setEffectiveSrc(url);
        })
        .catch(() => {
          if (fallbackSrc && !cancelled) setEffectiveSrc(fallbackSrc);
          else setEffectiveSrc(src);
        });

      return () => {
        cancelled = true;
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }, [src, fallbackSrc]);

    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        if (isEdgeBrowser() && effectiveSrc && fallbackSrc && !usedFallbackRef.current) {
          usedFallbackRef.current = true;
          setEffectiveSrc(fallbackSrc);
          return;
        }
        onError?.(e);
      },
      [effectiveSrc, fallbackSrc, onError]
    );

    return <video ref={ref} src={effectiveSrc} onError={handleError} {...props} />;
  }
);
