'use client';

/**
 * Mediaweergave voor inspiratiekaarten.
 *
 * Toegepaste regels:
 * 1. Desktop: video start automatisch bij hover op de kaart, direct unmute (geen play-knop nodig).
 * 2. Mobiel: video start automatisch wanneer 100% in beeld (eerst muted i.v.m. autoplay).
 * 3. Unmute-voorkeur geldt voor alle items: eenmaal unmute gekozen → volgende video’s ook geluid (ook op mobiel).
 * 4. Site start met alles muted; bij hover (desktop) of na voorkeur (mobiel) wordt unmute gedaan.
 * 5. Maximaal 1 video tegelijk: vorige wordt gemuted en gepauzeerd (videoManager).
 * 6. Soepele start: videoManager.playVideo() wacht op canplay indien nodig.
 * 7. Foto's: SafeImage. Video: proxy-URL, preload auto, poster, loop.
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import { getVideoUrlWithCors } from '@/lib/videoUtils';
import { videoManager } from '@/lib/videoManager';
import { PlayCircle, Volume2, VolumeX } from 'lucide-react';

export type InspirationItemMedia = {
  id: string;
  photos: Array<{ id: string; url: string; isMain?: boolean }>;
  videos?: Array<{ id: string; url: string; thumbnail?: string | null }>;
  category?: string;
};

type Props = {
  item: InspirationItemMedia;
  priority?: boolean;
  objectFit?: 'cover' | 'contain';
  alt?: string;
  /** Desktop: bij hover op de kaart wordt video afgespeeld + unmute */
  isCardHovered?: boolean;
};

const MUTE_DEBOUNCE_MS = 300;

const PLAY_THRESHOLD = 0.5;
const PAUSE_THRESHOLD = 0.2;

export default function InspirationCardMedia({ item, priority = false, objectFit = 'cover', alt = 'Inspiration', isCardHovered }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMuteTapRef = useRef(0);
  const muteHandledByTouchRef = useRef(false);
  const mobileObserverRef = useRef<IntersectionObserver | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  };

  const primaryVideo = item.videos?.[0];
  const firstPhoto = item.photos?.[0];
  const posterUrl = primaryVideo?.thumbnail || firstPhoto?.url || undefined;
  const videoSrc = primaryVideo?.url ? getVideoUrlWithCors(primaryVideo.url) : '';

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      videoManager.stopAllExcept(video);
      const wantMuted = videoManager.shouldStartMuted();
      video.muted = wantMuted;
      setIsMuted(wantMuted);
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setVideoError(false);
          // Chrome iOS: voorkeur opnieuw toepassen ná start, zodat unmute blijft staan
          const m = videoManager.shouldStartMuted();
          video.muted = m;
          setIsMuted(m);
        }).catch((err) => {
          setVideoError(true);
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[InspirationCardMedia] video.play() failed:', err);
          }
        });
      }
    }
  }, []);

  const applyMuteToggle = useCallback((newMuted: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    setIsMuted(newMuted);
    video.muted = newMuted;
    videoManager.setUserPrefersMuted(newMuted);
  }, []);

  const handleMuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const now = Date.now();
    if (muteHandledByTouchRef.current && now - lastMuteTapRef.current < 500) {
      muteHandledByTouchRef.current = false;
      return;
    }
    muteHandledByTouchRef.current = false;
    if (now - lastMuteTapRef.current < MUTE_DEBOUNCE_MS) return;
    lastMuteTapRef.current = now;
    const video = videoRef.current;
    if (!video) return;
    applyMuteToggle(!video.muted);
  }, [applyMuteToggle]);

  const handleMuteTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const now = Date.now();
    if (now - lastMuteTapRef.current < MUTE_DEBOUNCE_MS) return;
    lastMuteTapRef.current = now;
    muteHandledByTouchRef.current = true;
    const video = videoRef.current;
    if (!video) return;
    applyMuteToggle(!video.muted);
  }, [applyMuteToggle]);

  // Desktop: bij hover direct starten (geen rAF als video al klaar), bij leave pauzeren
  useEffect(() => {
    if (isMobile() || !primaryVideo?.url) return;
    const video = videoRef.current;
    if (!video) return;
    if (isCardHovered) {
      videoManager.stopAllExcept(video);
      video.muted = false;
      setIsMuted(false);
      if (video.readyState >= 2) {
        videoManager.playVideo(video);
      } else {
        const playWhenReady = () => videoManager.playVideo(video);
        requestAnimationFrame ? requestAnimationFrame(playWhenReady) : playWhenReady();
      }
    } else {
      videoManager.stopAllExcept(null);
      video.pause();
      video.currentTime = 0;
      video.muted = true;
      setIsMuted(true);
    }
  }, [isCardHovered, primaryVideo?.url]);

  // Mobiel (o.a. Chrome op iPhone): afspelen bij 50%+ zichtbaar; pauzeren bij <20%.
  // Observer met korte delay zodat refs/layout klaar zijn; play() in setTimeout(0) zodat niet in scroll-stack (Chrome iOS).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (!isMobile() || !primaryVideo?.url) return;
    const video = videoRef.current;
    const container = containerRef.current ?? video?.parentElement;
    if (!container || !video) return;

    const startPlay = (v: HTMLVideoElement) => {
      videoManager.stopAllExcept(v);
      v.muted = true;
      if (videoManager.shouldStartMuted()) setIsMuted(true);
      videoManager.playVideo(v);
      if (!videoManager.shouldStartMuted()) {
        const applyUnmute = () => {
          v.muted = false;
          setIsMuted(false);
        };
        if (v.readyState >= 2) applyUnmute();
        else v.addEventListener('playing', applyUnmute, { once: true });
        const t0 = Date.now();
        const unmuteInterval = setInterval(() => {
          if (Date.now() - t0 > 2000) {
            clearInterval(unmuteInterval);
            return;
          }
          if (!v.paused && v.muted && !videoManager.shouldStartMuted()) {
            v.muted = false;
            setIsMuted(false);
            clearInterval(unmuteInterval);
          }
        }, 200);
        v.addEventListener('playing', () => clearInterval(unmuteInterval), { once: true });
      }
    };

    const onIntersect = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      const v = videoRef.current;
      if (!entry || !v) return;
      const ratio = entry.intersectionRatio;
      const intersecting = entry.isIntersecting;
      const inViewForPlay = intersecting && ratio >= PLAY_THRESHOLD;
      const outOfViewForPause = !intersecting || ratio < PAUSE_THRESHOLD;
      if (inViewForPlay) {
        // Chrome iOS: play() buiten de scroll/intersection-stack aanroepen
        setTimeout(() => {
          if (videoRef.current === v) startPlay(v);
        }, 0);
      } else if (outOfViewForPause) {
        v.pause();
        v.currentTime = 0;
      }
    };

    const observer = new IntersectionObserver(onIntersect, {
      threshold: [0, 0.2, 0.5, 0.75, 1],
      root: null,
      rootMargin: '0px',
    });
    mobileObserverRef.current = observer;
    observer.observe(container);

    const t = setTimeout(() => {
      const rect = container.getBoundingClientRect();
      const h = window.innerHeight;
      if (h > 0 && rect.height > 0) {
        const visible = rect.top < h * 0.85 && rect.bottom > h * 0.15;
        if (visible) {
          const ratio = Math.max(0, Math.min(1, (Math.min(rect.bottom, h) - Math.max(rect.top, 0)) / rect.height));
          if (ratio >= PLAY_THRESHOLD) setTimeout(() => startPlay(video), 0);
        }
      }
    }, 150);

    return () => {
      clearTimeout(t);
      mobileObserverRef.current = null;
      observer.disconnect();
    };
  }, [primaryVideo?.url]);

  // Registreer video zodra het element mount, unregister bij unmount (zodat stopAllExcept alle kaarten vindt)
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (videoRef.current && videoRef.current !== el) {
      videoManager.unregister(videoRef.current);
    }
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el && primaryVideo?.url) {
      videoManager.register(el);
    }
  }, [primaryVideo?.url]);
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v) videoManager.unregister(v);
    };
  }, []);

  // Alleen foto's, geen video
  if (!primaryVideo?.url && firstPhoto?.url) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <SafeImage
          src={firstPhoto.url}
          alt={alt}
          fill
          className={objectFit === 'contain' ? 'object-contain' : 'object-cover'}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          quality={priority ? 70 : 60}
          loading={priority ? undefined : 'lazy'}
        />
      </div>
    );
  }

  // Video (met of zonder extra foto's)
  if (!videoSrc) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-4xl">📷</span>
      </div>
    );
  }

  if (videoError && posterUrl) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gray-200" data-inspiration-card-media>
        <img
          src={posterUrl}
          alt={alt}
          className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 p-3">
          <span className="text-white text-sm font-medium rounded bg-black/60 px-3 py-2 text-center">
            Video kon niet laden
          </span>
          <span className="text-white/90 text-xs text-center max-w-[90%]">
            MP4 of MOV werkt op alle apparaten.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full bg-gray-200" data-inspiration-card-media>
      <video
        ref={setVideoRef}
        src={videoSrc}
        poster={posterUrl || undefined}
        className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} bg-black`}
        playsInline
        preload="auto"
        loop
        muted={isMuted}
        controls
        controlsList="nodownload"
        onPlay={() => {
          setIsPaused(false);
          setVideoError(false);
          if (videoRef.current) setIsMuted(videoRef.current.muted);
        }}
        onVolumeChange={() => {
          if (videoRef.current) setIsMuted(videoRef.current.muted);
        }}
        onPause={() => setIsPaused(true)}
        onEnded={() => setIsPaused(true)}
        onError={(e) => {
          setIsPaused(true);
          setVideoError(true);
          const el = e.currentTarget;
          const err = el.error;
          if (err && typeof console !== 'undefined' && console.warn) {
            const code = err.code; // 1=MEDIA_ERR_ABORTED, 2=MEDIA_ERR_NETWORK, 3=MEDIA_ERR_DECODE, 4=MEDIA_ERR_SRC_NOT_SUPPORTED
            const msg = err.message || '';
            console.warn('[InspirationCardMedia] Video error', { code, message: msg, src: videoSrc?.slice(0, 60) });
          }
        }}
        onLoadedData={() => setVideoError(false)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ display: 'block' }}
      />
      {/* Play-knop alleen zichtbaar als gepauzeerd én niet gehoverd (bij hover start video automatisch) */}
      {isPaused && !isCardHovered && (
        <button
          type="button"
          onClick={handlePlayClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded pointer-events-auto bg-black/20 hover:bg-black/30 transition-colors"
          aria-label="Afspelen"
        >
          <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={handleMuteClick}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={handleMuteTouchEnd}
        className="absolute bottom-3 right-3 z-10 bg-black/60 hover:bg-black/80 active:bg-black/70 text-white rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center pointer-events-auto transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation"
        aria-label={isMuted ? 'Geluid aan' : 'Geluid uit'}
      >
        <span className="inline-flex items-center justify-center transition-opacity duration-150">
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </span>
      </button>
    </div>
  );
}
