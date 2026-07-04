'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import SafeImage from './SafeImage';
import { HomeCheffVideoPlayer } from '@/components/media/HomeCheffVideoPlayer';
import { checkVideoHasAudio, getVideoUrlWithCors, isEdgeBrowser } from '@/lib/videoUtils';
import { videoManager } from '@/lib/videoManager';

interface Photo {
  id: string;
  fileUrl: string;
  sortOrder?: number;
}

interface Video {
  id: string;
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  fileUrl?: string; // For images
  url?: string; // For videos
  thumbnail?: string | null;
  duration?: number | null;
  sortOrder?: number;
}

interface PhotoCarouselProps {
  photos?: Photo[];
  videos?: Video[];
  media?: MediaItem[]; // Combined media (images + videos)
  className?: string;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  /** feed = cover + aspect-video; detail = contain + height cap (product detail) */
  variant?: 'feed' | 'detail';
}

export default function PhotoCarousel({ 
  photos = [],
  videos = [],
  media = [],
  className = '', 
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 4000,
  variant = 'feed',
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [videoHasAudio, setVideoHasAudio] = useState<Map<number, boolean>>(new Map());
  const audioCheckedRef = useRef<Set<number>>(new Set());
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  
  // Combine photos, videos, and media into a single array
  // IMPORTANT: Videos should always be first
  const mediaItems: MediaItem[] = (() => {
    if (media.length > 0) {
      // Sort: videos first, then images
      const sorted = [...media].sort((a, b) => {
        if (a.type === 'video' && b.type !== 'video') return -1;
        if (a.type !== 'video' && b.type === 'video') return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
      return sorted;
    }
    const items: MediaItem[] = [];
    // Add videos FIRST
    videos.forEach(video => {
      items.push({
        id: video.id,
        type: 'video',
        url: video.url,
        thumbnail: video.thumbnail,
        duration: video.duration
      });
    });
    // Add photos AFTER videos
    photos.forEach(photo => {
      items.push({
        id: photo.id,
        type: 'image',
        fileUrl: photo.fileUrl,
        sortOrder: photo.sortOrder
      });
    });
    // Sort by sortOrder if available (but videos stay first)
    return items.sort((a, b) => {
      if (a.type === 'video' && b.type !== 'video') return -1;
      if (a.type !== 'video' && b.type === 'video') return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  })();

  // Setup intersection observer for video autoplay with sound
  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          if (!entry.isIntersecting || entry.intersectionRatio < 1.0) {
            if (isMobile) {
              try {
                videoElement.muted = true;
                videoElement.pause();
                videoElement.currentTime = 0;
              } catch {}
            }
            return;
          }
        });
        if (!isMobile) return; // Desktop: alleen bij hover/keuze spelen, niet pauzeren vanuit observer
        const toPlay = entries.find((e) => e.isIntersecting && e.intersectionRatio >= 1.0);
        if (!toPlay) return;
        const videoElement = toPlay.target as HTMLVideoElement;
        const videoIndex = Array.from(videoRefs.current.entries()).find(
          ([_, v]) => v === videoElement
        )?.[0];
        if (videoElement && videoElement.paused) {
          videoManager.stopAllExcept(videoElement);
                  videoElement.muted = true;
                  const playPromise = videoElement.play();
                  if (playPromise !== undefined) {
                    playPromise
                      .then(() => {
                        if (videoElement && !videoElement.paused && videoIndex !== undefined) {
                          videoElement.muted = videoManager.shouldStartMuted();
                        }
                      })
                      .catch(() => {});
                  }
        }
      },
      { threshold: 1.0 }
    );

    // Observe all videos
    videoRefs.current.forEach((video) => {
      if (video && intersectionObserverRef.current) {
        intersectionObserverRef.current.observe(video);
      }
    });

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [mediaItems, currentIndex]);

  useEffect(() => {
    const m = mediaItems[currentIndex];
    if (!m || m.type !== 'video' || !m.url) return;
    if (audioCheckedRef.current.has(currentIndex)) return;
    audioCheckedRef.current.add(currentIndex);
    checkVideoHasAudio(m.url).then((has) => {
      setVideoHasAudio((prev) => {
        const next = new Map(prev);
        next.set(currentIndex, has);
        return next;
      });
    });
  }, [currentIndex, mediaItems]);

  useEffect(() => {
    const v = videoRefs.current.get(currentIndex);
    const m = mediaItems[currentIndex];
    if (!v || m?.type !== 'video') return;
    const onVol = () => {
      try {
        videoManager.setUserPrefersMuted(v.muted);
      } catch {
        /* noop */
      }
    };
    v.addEventListener('volumechange', onVol);
    return () => v.removeEventListener('volumechange', onVol);
  }, [currentIndex, mediaItems]);

  // Cleanup: unregister all videos when component unmounts
  useEffect(() => {
    return () => {
      videoRefs.current.forEach((video) => {
        if (video) {
          videoManager.unregister(video);
        }
      });
    };
  }, []);

  // Auto-play functionality (only for images, not videos)
  useEffect(() => {
    // Don't auto-advance if current item is a video (let it play to completion)
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.type === 'video') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    if (autoPlay && isPlaying && mediaItems.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isPlaying, mediaItems.length, autoPlayInterval, currentIndex, mediaItems]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (mediaItems.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-xl ${className}`}>
        <div className="text-center text-gray-500">
          <ZoomIn className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Geen media beschikbaar</p>
        </div>
      </div>
    );
  }

  const currentMedia = mediaItems[currentIndex];
  const isDetail = variant === 'detail';
  const mainMediaClass = isDetail
    ? 'relative h-[280px] max-h-[320px] sm:h-[300px] lg:h-[380px] lg:max-h-[420px] bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center'
    : 'relative aspect-video bg-gray-100 rounded-xl overflow-hidden';
  const imageFitClass = isDetail ? 'object-contain' : 'object-cover';
  const videoFitClass = isDetail ? 'object-contain' : 'object-cover';

  return (
    <>
      {/* Main Carousel */}
      <div className={`relative group ${className}`}>
        {/* Main Media Container */}
        <div className={mainMediaClass}>
          {currentMedia.type === 'video' ? (
            <div className="video-smooth relative z-0 w-full h-full">
              <HomeCheffVideoPlayer
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(currentIndex, el);
                    videoManager.register(el);
                    videoManager.stopAllExcept(el);
                    el.muted = true;
                    el.playsInline = true;
                    el.setAttribute('playsinline', 'true');
                    el.setAttribute('webkit-playsinline', 'true');
                    el.preload = 'auto';
                    el.loop = false;
                    if (intersectionObserverRef.current) {
                      intersectionObserverRef.current.observe(el);
                    }
                  }
                }}
                variant="detail"
                fallbackUI="inline"
                src={getVideoUrlWithCors(currentMedia.url ?? '')}
                fallbackSrc={currentMedia.url ?? undefined}
                muted
                preload="auto"
                className="relative h-full w-full"
                videoClassName={`h-full w-full ${videoFitClass}`}
                poster={currentMedia.thumbnail || undefined}
                playsInline
                autoPlay
                nativeControls
                onPlaying={() => {
                  const v = videoRefs.current.get(currentIndex);
                  if (v) {
                    const wantMuted = isEdgeBrowser()
                      ? true
                      : videoManager.shouldStartMuted();
                    v.muted = wantMuted;
                  }
                }}
                onEnded={() => {
                  if (currentIndex < mediaItems.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    const firstImageIndex = mediaItems.findIndex(
                      (m) => m.type === 'image'
                    );
                    if (firstImageIndex >= 0) {
                      setCurrentIndex(firstImageIndex);
                    } else {
                      setCurrentIndex(0);
                    }
                  }
                }}
              />
              {videoHasAudio.get(currentIndex) === false && (
                <div className="pointer-events-none absolute bottom-3 right-3 z-[5] rounded bg-yellow-500/80 px-2 py-1 text-xs text-white">
                  Geen audio
                </div>
              )}
            </div>
          ) : (
            <SafeImage
              src={currentMedia.fileUrl || ''}
              alt={`Foto ${currentIndex + 1}`}
              fill
              className={`${imageFitClass} transition-all duration-500 ease-in-out`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
            />
          )}
          
          {/* Overlay: pointer-events-none zodat native video-controls (seek/mute) klikbaar blijven */}
          <div className="pointer-events-none absolute inset-0 z-[2] bg-black/0 transition-all duration-300 group-hover:bg-black/20">
            {mediaItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="pointer-events-auto absolute right-4 top-4 z-30 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100"
            >
              <ZoomIn className="h-5 w-5 text-gray-700" />
            </button>

            {autoPlay && (
              <button
                type="button"
                onClick={togglePlay}
                className="pointer-events-auto absolute left-4 top-4 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100"
              >
                {isPlaying ? (
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-4 w-2 rounded-sm bg-gray-700"></div>
                    <div className="ml-1 h-4 w-2 rounded-sm bg-gray-700"></div>
                  </div>
                ) : (
                  <div className="ml-1 h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-gray-700"></div>
                )}
              </button>
            )}

            <div className="pointer-events-auto absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-700 opacity-0 transition-all duration-300 group-hover:opacity-100">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        {showThumbnails && mediaItems.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {mediaItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 relative ${
                  index === currentIndex
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                }`}
              >
                {item.type === 'video' ? (
                  <>
                    {item.thumbnail ? (
                      <SafeImage
                        src={item.thumbnail}
                        alt={`Video thumbnail ${index + 1}`}
                        width={64}
                        height={64}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                      ▶
                    </div>
                  </>
                ) : (
                  <SafeImage
                    src={item.fileUrl || ''}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Dots Indicator */}
        {mediaItems.length > 1 && !showThumbnails && (
          <div className="flex justify-center mt-4 gap-2">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-blue-500 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="pointer-events-auto absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition-all duration-200 hover:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="pointer-events-none relative flex h-full max-h-full w-full max-w-7xl items-center justify-center">
            {currentMedia.type === 'video' ? (
              <div className="video-smooth pointer-events-auto relative flex h-full max-h-full w-full items-center justify-center">
                <HomeCheffVideoPlayer
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(currentIndex, el);
                      videoManager.register(el);
                      videoManager.stopAllExcept(el);
                      el.muted = true;
                      el.playsInline = true;
                      el.setAttribute('playsinline', 'true');
                      el.setAttribute('webkit-playsinline', 'true');
                      el.preload = 'auto';
                      el.loop = false;
                    }
                  }}
                  variant="lightbox"
                  fallbackUI="inline"
                  src={getVideoUrlWithCors(currentMedia.url ?? '')}
                  fallbackSrc={currentMedia.url ?? undefined}
                  autoPlay
                  muted
                  preload="auto"
                  className="relative max-h-full max-w-full"
                  videoClassName="max-h-full max-w-full rounded-lg object-contain"
                  poster={currentMedia.thumbnail || undefined}
                  playsInline
                  nativeControls
                  onPlaying={() => {
                    const v = videoRefs.current.get(currentIndex);
                    if (v) {
                      const wantMuted = isEdgeBrowser()
                        ? true
                        : videoManager.shouldStartMuted();
                      v.muted = wantMuted;
                    }
                  }}
                  onEnded={() => {
                    if (currentIndex < mediaItems.length - 1) {
                      setCurrentIndex(currentIndex + 1);
                    } else {
                      const firstImageIndex = mediaItems.findIndex(
                        (m) => m.type === 'image'
                      );
                      if (firstImageIndex >= 0) {
                        setCurrentIndex(firstImageIndex);
                      } else {
                        setCurrentIndex(0);
                      }
                    }
                  }}
                />
                {videoHasAudio.get(currentIndex) === false && (
                  <div className="pointer-events-none absolute bottom-3 right-3 z-[5] rounded bg-yellow-500/80 px-2 py-1 text-xs text-white">
                    Geen audio
                  </div>
                )}
              </div>
            ) : (
              <div className="pointer-events-auto">
                <SafeImage
                  src={currentMedia.fileUrl || ''}
                  alt={`Foto ${currentIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              </div>
            )}

            {mediaItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-all duration-200 hover:bg-white/30"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-all duration-200 hover:bg-white/30"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-4 py-2 font-medium text-white">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
