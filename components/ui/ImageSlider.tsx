'use client';

/**
 * ImageSlider: media carousel met video eerst.
 * Regels: video's starten altijd muted. Desktop: alleen afspelen bij hover op item. Mobiel: alleen wanneer in beeld.
 * Geen session-check; CORS/video-proxy zorgt dat video’s ook uitgelogd laden.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle, Volume2, VolumeX } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import { EdgeAwareVideo } from '@/components/ui/EdgeAwareVideo';
import { isIntersectionObserverSupported, createSafeIntersectionObserver } from '@/lib/browser-utils';
import { getVideoUrlWithCors, isEdgeBrowser } from '@/lib/videoUtils';
import { videoManager } from '@/lib/videoManager';

type MediaItem = {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string | null;
};

interface ImageSliderProps {
  images?: string[];
  media?: MediaItem[]; // New: support for mixed media (images + videos)
  alt?: string;
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  autoSlideOnScroll?: boolean; // Auto-slide when visible during scroll
  scrollSlideInterval?: number; // Interval for scroll-based auto-slide
  preventClick?: boolean; // Prevent click from propagating to parent
  priority?: boolean; // Priority loading for above-the-fold items
  objectFit?: 'cover' | 'contain'; // Control how images fit: cover (crop) or contain (fit)
  /** Bij Dorpsplein e.d.: parent zet dit bij hover op hele kaart, dan speelt alleen deze video (desktop). */
  isCardHovered?: boolean;
}

export default function ImageSlider({
  images,
  media,
  alt = 'Product image',
  className = '',
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  autoSlideOnScroll = true, // Default enabled
  scrollSlideInterval = 2500, // 2.5 seconds per image during scroll
  preventClick = false,
  priority = false,
  objectFit = 'cover', // Default to cover for grid items, can be set to 'contain' for detail pages
  isCardHovered
}: ImageSliderProps) {
  // Convert images array to media format if media is not provided (backward compatibility)
  const mediaItems = useMemo(() => {
    if (media && media.length > 0) {
      return media.filter((item) => item && item.url && item.url.trim().length > 0);
    }
    if (images && images.length > 0) {
      return images
        .filter((img: string) => img && typeof img === 'string' && img.trim().length > 0)
        .map((url: string) => ({ type: 'image' as const, url }));
    }
    return [];
  }, [images, media]);

  /** Eerste item is video → geen auto-rotatie; video blijft hoofd, gebruiker kiest zelf om naar foto's te gaan */
  const firstItemIsVideo = mediaItems.length > 0 && mediaItems[0]?.type === 'video';

  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const currentlyPlayingVideoRef = useRef<HTMLVideoElement | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const isMobileRef = useRef(false);
  
  // Initialize currentIndex to 0, but if first item is video, it will autoplay
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwipe = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(false);
  const lastUserInteractionRef = useRef<number>(Date.now());
  
  // Track muted state per video index
  const [videoMutedStates, setVideoMutedStates] = useState<Map<number, boolean>>(new Map());
  // Track whether videos have audio
  const [videoHasAudio, setVideoHasAudio] = useState<Map<number, boolean>>(new Map());
  // Track if current video is paused (for click-to-play overlay; hover is not a user gesture in Safari)
  const [currentVideoPaused, setCurrentVideoPaused] = useState(true);
  
  // Detect mobile vs desktop
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768 || 'ontouchstart' in window;
  }, []);

  // Sync currentVideoPaused when slide or play state changes
  useEffect(() => {
    const video = mediaItems[currentIndex]?.type === 'video' ? videoRefs.current.get(currentIndex) : null;
    setCurrentVideoPaused(video ? video.paused : true);
  }, [currentIndex, mediaItems]);
  
  // Stop all videos except the one specified (using global video manager)
  const stopAllVideosExcept = (exceptVideo: HTMLVideoElement | null) => {
    // Use global video manager to stop all videos across all components
    videoManager.stopAllExcept(exceptVideo);
    currentlyPlayingVideoRef.current = exceptVideo;
  };

  /** Play video; retry on canplay only if not NotSupportedError/AbortError (browser autoplay policy or aborted). */
  const playWithRetry = useCallback((video: HTMLVideoElement): Promise<void> => {
    const p = video.play();
    if (p === undefined) return Promise.resolve();
    return p.catch((err: unknown) => {
      const name = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
      const isBlocked = name === 'NotSupportedError' || name === 'AbortError' || msg.includes('not supported') || msg.includes('aborted');
      if (isBlocked) return Promise.resolve();
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('[ImageSlider] video.play() failed, will retry on canplay:', err);
      }
      return new Promise<void>((resolve) => {
        let done = false;
        const retry = () => {
          if (done) return;
          done = true;
          video.removeEventListener('canplay', retry);
          video.removeEventListener('loadeddata', retry);
          clearTimeout(tid);
          video.play().then(resolve).catch(() => resolve());
        };
        video.addEventListener('canplay', retry, { once: true });
        video.addEventListener('loadeddata', retry, { once: true });
        const tid = window.setTimeout(retry, 8000);
      });
    });
  }, []);

  /** Start video; wacht op canplay/loadeddata als nog niet klaar. Geen video.load() – dat reset de video en geeft een zwart scherm. */
  const ensureReadyThenPlay = useCallback((video: HTMLVideoElement, onPlaying?: () => void) => {
    const doPlay = () => {
      playWithRetry(video).then(() => onPlaying?.());
    };
    if (video.readyState >= 2) {
      doPlay();
      return;
    }
    doPlay();
    const onReady = () => {
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadeddata', onReady);
      clearTimeout(tid);
      doPlay();
    };
    video.addEventListener('canplay', onReady, { once: true });
    video.addEventListener('loadeddata', onReady, { once: true });
    const tid = window.setTimeout(() => {
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadeddata', onReady);
      doPlay();
    }, 6000);
  }, [playWithRetry]);

  // Preload next image for smoother transitions
  useEffect(() => {
    if (mediaItems.length > 1 && currentIndex < mediaItems.length - 1) {
      const nextItem = mediaItems[currentIndex + 1];
      if (nextItem && nextItem.type === 'image') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = nextItem.url;
        link.setAttribute('fetchpriority', 'low');
        document.head.appendChild(link);
        
        return () => {
          document.head.removeChild(link);
        };
      }
    }
  }, [currentIndex, mediaItems]);

  // Video in beeld:zelfde regels als inspiratie (InspirationCardMedia) – 50% in beeld = afspelen, <20% = pauzeren.
  const PLAY_THRESHOLD = 0.5;
  const PAUSE_THRESHOLD = 0.2;
  useEffect(() => {
    const observer = createSafeIntersectionObserver(
      (entries) => {
        const isMobile = isMobileRef.current;
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const ratio = entry.intersectionRatio;
          const outOfViewForPause = !entry.isIntersecting || ratio < PAUSE_THRESHOLD;
          if (outOfViewForPause && isMobile) {
            try {
              video.muted = true;
              video.pause();
              video.currentTime = 0;
            } catch {}
          }
        });
        // Alleen mobiel: speel bij 50%+ in beeld (zoals inspiratie); desktop alleen bij hover
        if (!isMobile) return;
        const inViewForPlay = entries.find((e) => e.isIntersecting && e.intersectionRatio >= PLAY_THRESHOLD);
        if (!inViewForPlay) return;
        const video = inViewForPlay.target as HTMLVideoElement;
        // Chrome iOS: play() buiten scroll/intersection-stack aanroepen (zoals InspirationCardMedia)
        const startPlay = () => {
          stopAllVideosExcept(video);
          let videoIndex = -1;
          videoRefs.current.forEach((v, idx) => { if (v === video) videoIndex = idx; });
          const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
          if (videoIndex >= 0) {
            video.muted = true;
            setVideoMutedStates((prev) => {
              const newMap = new Map(prev);
              newMap.set(videoIndex, wantMuted);
              return newMap;
            });
          } else {
            video.muted = true;
          }
          video.loop = false;
          video.playsInline = true;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          ensureReadyThenPlay(video, () => {
            if (video && !video.paused) {
              video.muted = wantMuted;
              setVideoMutedStates((prev) => {
                const newMap = new Map(prev);
                newMap.set(videoIndex, wantMuted);
                return newMap;
              });
            }
          });
        };
        setTimeout(() => startPlay(), 0);
      },
      { threshold: [0, 0.2, 0.5, 0.75, 1], rootMargin: '0px' }
    );
    
    intersectionObserverRef.current = observer;

    // Initiële check na 150ms (zoals InspirationCardMedia): als kaart al in beeld bij load, start video op mobiel
    const initialCheckId = setTimeout(() => {
      if (!isMobileRef.current) return;
      const container = sliderRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const h = window.innerHeight;
      if (h <= 0 || rect.height <= 0) return;
      const visible = rect.top < h * 0.85 && rect.bottom > h * 0.15;
      if (!visible) return;
      const ratio = Math.max(0, Math.min(1, (Math.min(rect.bottom, h) - Math.max(rect.top, 0)) / rect.height));
      if (ratio >= PLAY_THRESHOLD) {
        const video = videoRefs.current.get(0);
        if (video && mediaItems[0]?.type === 'video') {
          setTimeout(() => {
            stopAllVideosExcept(video);
            video.muted = true;
            const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
            setVideoMutedStates((prev) => {
              const newMap = new Map(prev);
              newMap.set(0, wantMuted);
              return newMap;
            });
            video.loop = false;
            video.playsInline = true;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            ensureReadyThenPlay(video, () => {
              if (video && !video.paused) {
                video.muted = wantMuted;
                setVideoMutedStates((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(0, wantMuted);
                  return newMap;
                });
              }
            });
          }, 0);
        }
      }
    }, 150);

    // Fallback for browsers without IntersectionObserver (very old browsers only)
    // Modern browsers (Chrome 51+, Firefox 55+, Edge 15+, Safari 12.1+) all support it
    if (!observer) {
      // Use scroll-based fallback for very old browsers
      const handleScroll = () => {
        const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
        if (!isMobile) return;
        videoRefs.current.forEach((video) => {
          if (!video) return;
          const rect = video.getBoundingClientRect();
          const wh = window.innerHeight || document.documentElement.clientHeight;
          const ww = window.innerWidth || document.documentElement.clientWidth;
          const isFullyVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= wh && rect.right <= ww;
          if (!isFullyVisible) {
            try {
              video.muted = true;
              video.pause();
              video.currentTime = 0;
            } catch {}
          }
        });
        let onlyOne: HTMLVideoElement | null = null;
        videoRefs.current.forEach((video: HTMLVideoElement | undefined) => {
          if (!video) return;
          const rect = video.getBoundingClientRect();
          const wh = window.innerHeight || document.documentElement.clientHeight;
          const ww = window.innerWidth || document.documentElement.clientWidth;
          const isFullyVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= wh && rect.right <= ww;
          if (isFullyVisible && !onlyOne) onlyOne = video;
        });
        const videoToPlay = onlyOne as HTMLVideoElement | null;
        if (videoToPlay && videoToPlay.paused) {
          stopAllVideosExcept(videoToPlay);
          videoToPlay.muted = true;
          videoToPlay.playsInline = true;
          videoToPlay.setAttribute('playsinline', 'true');
          videoToPlay.setAttribute('webkit-playsinline', 'true');
          ensureReadyThenPlay(videoToPlay);
        }
      };
      
      // Throttle scroll events for performance
      let scrollTimeout: NodeJS.Timeout;
      window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 100);
      }, { passive: true });
      
      // Check on mount
      handleScroll();
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }

    return () => {
      clearTimeout(initialCheckId);
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [videoMutedStates, stopAllVideosExcept, ensureReadyThenPlay, mediaItems]);

  // Sync video muted state with state when video element changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        const stateMuted = videoMutedStates.get(index);
        if (stateMuted !== undefined && video.muted !== stateMuted) {
          video.muted = stateMuted;
        }
      }
    });
  }, [videoMutedStates]);

  // Force re-render when video muted state changes (for button icon update)
  const [forceUpdate, setForceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if any video muted state has changed by comparing with actual video.muted
      let hasChanged = false;
      videoRefs.current.forEach((video, index) => {
        if (video) {
          const stateMuted = videoMutedStates.get(index);
          const actualMuted = video.muted;
          // If state exists and doesn't match actual, or if state doesn't exist but video is not in default muted state
          if ((stateMuted !== undefined && stateMuted !== actualMuted) || 
              (stateMuted === undefined && !actualMuted)) {
            hasChanged = true;
            // Sync state with actual video state
            setVideoMutedStates((prev) => {
              const newMap = new Map(prev);
              newMap.set(index, actualMuted);
              return newMap;
            });
          }
        }
      });
      if (hasChanged) {
        setForceUpdate(prev => prev + 1);
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, [videoMutedStates]);

  // Geen checkVideoHasAudio meer: voorkomt console-spam en extra requests; badge "Geen audio" niet meer getoond.
  // Video's starten altijd muted; gebruiker kan unmute proberen.

  // Observe videos when they're added (for all users - autoplay on homepage)
  useEffect(() => {
    if (intersectionObserverRef.current) {
      // Observe all current videos
      videoRefs.current.forEach((video) => {
        if (video && intersectionObserverRef.current) {
          intersectionObserverRef.current.observe(video);
        }
      });
    }
    
    // Alleen mobiel: als huidige slide een video is, na korte delay(s) checken of in beeld en dan starten. Desktop start alleen bij hover.
    if (!isMobileRef.current) {
      return;
    }
    const currentMedia = mediaItems[currentIndex];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    if (currentMedia?.type === 'video') {
      const checkAndPlay = () => {
        const video = videoRefs.current.get(currentIndex);
        if (!video) return;
        const rect = video.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const vw = window.innerWidth || document.documentElement.clientWidth;
        const isVisible = rect.top < vh && rect.left < vw && rect.bottom > 0 && rect.right > 0;
        if (isVisible && video.paused) {
          stopAllVideosExcept(video);
          const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
          video.muted = true;
          ensureReadyThenPlay(video, () => {
            if (video && !video.paused) {
              video.muted = wantMuted;
              setVideoMutedStates((prev) => {
                const newMap = new Map(prev);
                newMap.set(currentIndex, wantMuted);
                return newMap;
              });
            }
          });
        }
      };
      [100, 250, 500].forEach((ms) => timeouts.push(setTimeout(checkAndPlay, ms)));
    }
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [mediaItems, currentIndex, videoMutedStates, stopAllVideosExcept, ensureReadyThenPlay]);

  // Handle video playback when slide changes (desktop behavior)
  useEffect(() => {
    if (isMobileRef.current) {
      return;
    }
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.type === 'video') {
      stopAllVideosExcept(null);
    } else {
      stopAllVideosExcept(null);
    }
  }, [currentIndex, mediaItems]);

  // Dorpsplein e.d.:zelfde als inspiratie – bij hover op kaart (desktop) video afspelen + direct unmute
  useEffect(() => {
    if (isMobileRef.current || isCardHovered === undefined) return;
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.type !== 'video') return;

    const tryPlay = () => {
      const video = videoRefs.current.get(currentIndex);
      if (!isCardHovered || !video) return;
      stopAllVideosExcept(video);
      // Edge: geen unmute op hover (autoplay policy); alleen via mute-knop
      const wantMuted = isCardHovered && !isEdgeBrowser() ? false : videoManager.shouldStartMuted();
      video.muted = true;
      ensureReadyThenPlay(video, () => {
        if (video && !video.paused) {
          video.muted = wantMuted;
          setVideoMutedStates((prev) => {
            const m = new Map(prev);
            m.set(currentIndex, wantMuted);
            return m;
          });
        }
      });
    };

    if (!isCardHovered) {
      const video = videoRefs.current.get(currentIndex);
      if (video) {
        video.muted = true;
        video.pause();
        video.currentTime = 0;
      }
      stopAllVideosExcept(null);
      return;
    }

    tryPlay();
    const t1 = setTimeout(tryPlay, 100);
    const t2 = setTimeout(tryPlay, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isCardHovered, currentIndex, mediaItems, stopAllVideosExcept, ensureReadyThenPlay]);

  // Handle video ended event - automatically go to next slide after video finishes
  useEffect(() => {
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.type === 'video') {
      const video = videoRefs.current.get(currentIndex);
      if (video) {
        const handleVideoEnded = () => {
          // Video ended - automatically go to next slide (or first image if at end)
          if (currentIndex < mediaItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            // If video is last item, loop back to first image (skip video if it's not first)
            const firstImageIndex = mediaItems.findIndex(m => m.type === 'image');
            if (firstImageIndex >= 0) {
              setCurrentIndex(firstImageIndex);
            } else {
              setCurrentIndex(0); // Fallback to first item
            }
          }
        };
        
        video.addEventListener('ended', handleVideoEnded);
        
        return () => {
          video.removeEventListener('ended', handleVideoEnded);
        };
      }
    }
  }, [currentIndex, mediaItems]);

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoSlide = useCallback(() => {
    if (mediaItems.length <= 1 || firstItemIsVideo) {
      return;
    }
    stopAutoSlide();

    // Only auto-slide if user hasn't interacted recently (within last 5 seconds)
    const timeSinceInteraction = Date.now() - lastUserInteractionRef.current;
    if (timeSinceInteraction < 5000) {
      return;
    }

    intervalRef.current = setInterval(() => {
      // Check if still visible and no recent interaction
      const timeSinceInteraction = Date.now() - lastUserInteractionRef.current;
      if (isVisibleRef.current && timeSinceInteraction >= 5000) {
        setCurrentIndex((prevIndex) => 
          prevIndex === mediaItems.length - 1 ? 0 : prevIndex + 1
        );
      }
    }, scrollSlideInterval);
  }, [mediaItems, firstItemIsVideo, scrollSlideInterval, stopAutoSlide]);

  // Scroll-based auto-slide: niet als firstItemIsVideo (video blijft hoofd)
  useEffect(() => {
    if (!autoSlideOnScroll || mediaItems.length <= 1) {
      return;
    }
    if (firstItemIsVideo) {
      stopAutoSlide();
    }
    const currentRef = sliderRef.current;
    if (!currentRef) {
      return;
    }

    const observer = createSafeIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.3;
          isVisibleRef.current = isVisible;
          if (isVisible && !firstItemIsVideo) {
            startAutoSlide();
          } else {
            stopAutoSlide();
          }
        });
      },
      {
        threshold: [0.3, 0.5, 0.7], // Multiple thresholds for better detection
        rootMargin: '50px' // Start sliding slightly before fully in view
      }
    );
    
    // If IntersectionObserver is not supported (very old browsers only),
    // start auto-slide immediately - this is acceptable fallback behavior
    // Modern browsers (Chrome, Firefox, Edge, Safari 12.1+) will use IntersectionObserver
    if (!observer) {
      if (!firstItemIsVideo) startAutoSlide();
      return () => stopAutoSlide();
    }

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
      stopAutoSlide();
    };
  }, [autoSlideOnScroll, mediaItems, firstItemIsVideo, startAutoSlide, stopAutoSlide]);

  // Time-based autoPlay: niet als firstItemIsVideo (video blijft hoofd)
  useEffect(() => {
    if (autoPlay && mediaItems.length > 1 && !firstItemIsVideo) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const currentMedia = mediaItems[currentIndex];
      const isVideo = currentMedia?.type === 'video';

      if (isVideo) {
        // Video will trigger next slide via onEnded handler
        return;
      }

      // For images, use normal interval
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === mediaItems.length - 1 ? 0 : prevIndex + 1
        );
      }, autoPlayInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [autoPlay, mediaItems, firstItemIsVideo, autoPlayInterval, currentIndex]);

  // Reset to first media item when media array changes
  useEffect(() => {
    if (mediaItems.length > 0 && currentIndex >= mediaItems.length) {
      setCurrentIndex(0);
    }
  }, [mediaItems.length, currentIndex]);

  // Resume time-based interval op image (niet als firstItemIsVideo)
  useEffect(() => {
    if (autoPlay && mediaItems.length > 1 && !firstItemIsVideo) {
      const currentMedia = mediaItems[currentIndex];
      const isVideo = currentMedia?.type === 'video';

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (!isVideo) {
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prevIndex) => 
            prevIndex === mediaItems.length - 1 ? 0 : prevIndex + 1
          );
        }, autoPlayInterval);
      }
      // If it's a video, interval will be started when video ends (via onEnded handler)
    }
  }, [currentIndex, autoPlay, mediaItems, firstItemIsVideo, autoPlayInterval]);

  // Zodra firstItemIsVideo: geen auto-slide (video blijft hoofd)
  useEffect(() => {
    if (firstItemIsVideo) {
      stopAutoSlide();
    }
  }, [firstItemIsVideo, stopAutoSlide]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoSlide();
    };
  }, [stopAutoSlide]);

  const handleUserInteraction = () => {
    lastUserInteractionRef.current = Date.now();
    // Pause auto-slide for 5 seconds after user interaction
    stopAutoSlide();
    setTimeout(() => {
      if (isVisibleRef.current) {
        startAutoSlide();
      }
    }, 5000);
  };

  const goToPrevious = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleUserInteraction();
    setCurrentIndex(currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1);
  };

  const goToNext = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleUserInteraction();
    setCurrentIndex(currentIndex === mediaItems.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleUserInteraction();
    setCurrentIndex(index);
  };

  // Improved touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const diffX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // Determine if this is a horizontal swipe
    if (diffX > diffY && diffX > 10) {
      isSwipe.current = true;
      e.preventDefault(); // Prevent scrolling during swipe
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const minSwipeDistance = 50;

    if (isSwipe.current && Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goToNext(); // Swipe left - next image
      } else {
        goToPrevious(); // Swipe right - previous image
      }
      e.stopPropagation(); // Prevent card click
    } else if (!isSwipe.current) {
      // If it wasn't a swipe, register touch as user interaction
      handleUserInteraction();
      // If preventClick is true, stop propagation to prevent card navigation
      if (preventClick) {
        e.stopPropagation();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwipe.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-video-mute-button]') || target.hasAttribute('data-video-mute-button') ||
        target.closest('[data-play-overlay]') || target.hasAttribute('data-play-overlay')) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const isVideoClick = target.closest('video') || 
                         target.tagName === 'VIDEO' || 
                         target.closest('.video-controls') ||
                         target.closest('[data-video-controls]') ||
                         (target.parentElement && target.parentElement.closest('video')) ||
                         // Check for native video control elements (browser-specific)
                         target.getAttribute('controls') !== null ||
                         target.classList.contains('vjs-control') ||
                         target.closest('.vjs-control-bar');
    
    if (isVideoClick) {
      e.stopPropagation(); // Prevent parent handlers
      return; // Allow video controls to work
    }
    
    if (preventClick) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't block clicks on mute button, video controls, or any element inside a video
    const target = e.target as HTMLElement;
    if (target.closest('[data-video-mute-button]') || target.hasAttribute('data-video-mute-button') ||
        target.closest('[data-play-overlay]') || target.hasAttribute('data-play-overlay')) {
      e.stopPropagation();
      return;
    }
    // Check if click is on video element, video controls, or any child of video
    const isVideoClick = target.closest('video') || 
                         target.tagName === 'VIDEO' || 
                         target.closest('.video-controls') ||
                         target.closest('[data-video-controls]') ||
                         (target.parentElement && target.parentElement.closest('video')) ||
                         // Check for native video control elements (browser-specific)
                         target.getAttribute('controls') !== null ||
                         target.classList.contains('vjs-control') ||
                         target.closest('.vjs-control-bar');
    
    if (isVideoClick) {
      e.stopPropagation(); // Prevent parent handlers
      return; // Allow video controls to work
    }
    
    if (preventClick) {
      e.stopPropagation();
    }
  };

  // Geen audio-check voor single video (zelfde reden als carousel).

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center ${className}`} style={{ position: 'relative', minHeight: '100%' }}>
        <div className="text-neutral-400 text-4xl">
          <span>📷</span>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 1) {
    const singleMedia = mediaItems[0];
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ position: 'relative', minHeight: '100%' }}>
        {singleMedia.type === 'video' ? (
          <div className="video-smooth absolute inset-0 w-full h-full bg-gray-200" style={{ zIndex: 10 }}>
            <EdgeAwareVideo
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(0, el);
                  videoManager.register(el);
                  // Start muted voor autoplay (browser policy); unmute na play in observer
                  el.muted = true;
                  el.loop = false;
                  
                  // iOS Safari compatibility
                  el.playsInline = true;
                  el.setAttribute('playsinline', 'true'); // Standard attribute
                  el.setAttribute('webkit-playsinline', 'true'); // WebKit prefix for older iOS
                  
                  // preload=auto: betere buffering voor Safari mobile (volledig afspelen, soepeler geluid)
                  el.preload = 'auto';
                  
                  // Observe with intersection observer (for autoplay on all browsers)
                  if (intersectionObserverRef.current) {
                    intersectionObserverRef.current.observe(el);
                  }
                }
              }}
              src={getVideoUrlWithCors(singleMedia.url)}
              fallbackSrc={singleMedia.url}
              poster={singleMedia.thumbnail || undefined}
              className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
              controls
              playsInline
              muted
              preload="auto"
              style={{ zIndex: 10, position: 'relative' }}
              onPlay={() => setCurrentVideoPaused(false)}
              onPause={() => setCurrentVideoPaused(true)}
              onError={() => setCurrentVideoPaused(true)}
              onEnded={() => {
                setCurrentVideoPaused(true);
                if (mediaItems.length > 1) {
                  const nextIndex = currentIndex < mediaItems.length - 1 ? currentIndex + 1 : 0;
                  setCurrentIndex(nextIndex);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                const video = videoRefs.current.get(0);
                if (video?.paused) {
                  stopAllVideosExcept(video);
                  const wantMuted = videoManager.shouldStartMuted();
                  video.muted = true;
                  ensureReadyThenPlay(video, () => {
                    if (video && !video.paused) {
                      video.muted = wantMuted;
                      setVideoMutedStates((prev) => {
                        const m = new Map(prev);
                        m.set(0, wantMuted);
                        return m;
                      });
                    }
                  });
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseEnter={() => {
                if (!isMobileRef.current && videoRefs.current.get(0)) {
                  const video = videoRefs.current.get(0);
                  if (video?.paused) {
                    stopAllVideosExcept(video);
                    const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
                    video.muted = true;
                    ensureReadyThenPlay(video, () => {
                      if (video && !video.paused) {
                        video.muted = wantMuted;
                        setVideoMutedStates((prev) => {
                          const m = new Map(prev);
                          m.set(0, wantMuted);
                          return m;
                        });
                      }
                    });
                  }
                }
              }}
              onMouseLeave={() => {
                if (!isMobileRef.current && videoRefs.current.get(0)) {
                  const video = videoRefs.current.get(0);
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                    stopAllVideosExcept(null);
                  }
                }
              }}
            />
            {currentVideoPaused && (
              <button
                type="button"
                data-play-overlay
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const video = videoRefs.current.get(0);
                  if (video?.paused) {
                    stopAllVideosExcept(video);
                    const wantMuted = videoManager.shouldStartMuted();
                    video.muted = true;
                    ensureReadyThenPlay(video, () => {
                      if (video && !video.paused) {
                        video.muted = wantMuted;
                        setVideoMutedStates((prev) => {
                          const m = new Map(prev);
                          m.set(0, wantMuted);
                          return m;
                        });
                      }
                    });
                  }
                }}
                onMouseEnter={() => {
                  if (isMobileRef.current) return;
                  const video = videoRefs.current.get(0);
                  if (video?.paused) {
                    stopAllVideosExcept(video);
                    const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
                    video.muted = true;
                    ensureReadyThenPlay(video, () => {
                      if (video && !video.paused) {
                        video.muted = wantMuted;
                        setVideoMutedStates((prev) => {
                          const m = new Map(prev);
                          m.set(0, wantMuted);
                          return m;
                        });
                      }
                    });
                  }
                }}
                className="absolute inset-0 flex items-center justify-center z-[35] cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded pointer-events-auto"
                aria-label="Afspelen"
              >
                <PlayCircle className="w-16 h-16 text-white/90 drop-shadow-lg" aria-hidden />
              </button>
            )}
            {/* Mute/Unmute – direct; voorkeur geldt voor alle volgende video's */}
            <button
              type="button"
              data-video-mute-button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const video = videoRefs.current.get(0);
                if (video) {
                  const newMutedState = !video.muted;
                  video.muted = newMutedState;
                  videoManager.setUserPrefersMuted(newMutedState);
                  setVideoMutedStates((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(0, newMutedState);
                    return newMap;
                  });
                }
              }}
              className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-[40] transition-all duration-200 pointer-events-auto"
              aria-label={videoMutedStates.get(0) !== false ? "Unmute video" : "Mute video"}
            >
              {videoMutedStates.get(0) !== false ? (
                <VolumeX className="w-5 h-5" aria-hidden />
              ) : (
                <Volume2 className="w-5 h-5" aria-hidden />
              )}
            </button>
            {/* Warning if video has no audio */}
            {videoHasAudio.get(0) === false && (
              <div className="absolute bottom-3 right-3 bg-yellow-500/80 text-white text-xs px-2 py-1 rounded z-30">
                Geen audio
              </div>
            )}
          </div>
        ) : (
          <SafeImage
            src={singleMedia.url}
            alt={alt}
            fill
            className={objectFit === 'contain' ? 'object-contain' : 'object-cover'}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading={priority ? undefined : "lazy"}
            priority={priority}
            quality={priority ? 75 : 65} // Lower quality for faster loading
          />
        )}
      </div>
    );
  }

  return (
    <div 
      ref={sliderRef}
      className={`relative w-full h-full overflow-hidden group ${className}`}
      style={{ position: 'relative', minHeight: '100%' }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => {
        lastUserInteractionRef.current = Date.now();
        stopAutoSlide();
        if (!isMobileRef.current) {
          const currentMedia = mediaItems[currentIndex];
          if (currentMedia?.type === 'video') {
            const video = videoRefs.current.get(currentIndex);
            if (video) {
              stopAllVideosExcept(video);
              const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
              video.muted = true;
              ensureReadyThenPlay(video, () => {
                if (video && !video.paused) {
                  video.muted = wantMuted;
                  setVideoMutedStates((prev) => {
                    const m = new Map(prev);
                    m.set(currentIndex, wantMuted);
                    return m;
                  });
                }
              });
            }
          }
        }
      }}
      onMouseLeave={() => {
        if (isVisibleRef.current) {
          setTimeout(() => startAutoSlide(), 1000);
        }
        // Desktop: stop video als muis van kaart afgaat
        if (!isMobileRef.current) {
          const video = videoRefs.current.get(currentIndex);
          if (video && mediaItems[currentIndex]?.type === 'video') {
            video.pause();
            video.currentTime = 0;
            stopAllVideosExcept(null);
          }
        }
      }}
      data-image-slider
    >
      {/* Main Media */}
      <div className="absolute inset-0">
        {mediaItems[currentIndex] ? (
          mediaItems[currentIndex].type === 'video' ? (
            <div className="video-smooth absolute inset-0 w-full h-full bg-gray-200" style={{ zIndex: 10 }}>
              <EdgeAwareVideo
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(currentIndex, el);
                    // Register with global video manager
                    videoManager.register(el);
                    // Cross-browser compatibility: ensure all attributes are set
                    // Start muted voor autoplay; unmute na play in observer
                    el.muted = true;
                    el.loop = false;
                    
                    // iOS Safari compatibility
                    el.playsInline = true;
                    el.setAttribute('playsinline', 'true'); // Standard attribute
                    el.setAttribute('webkit-playsinline', 'true'); // WebKit prefix for older iOS
                    
                    el.preload = 'auto';
                    
                    // Observe with intersection observer (for autoplay on all browsers)
                    if (intersectionObserverRef.current) {
                      intersectionObserverRef.current.observe(el);
                    }
                    
                    // On desktop: also allow hover to play (for logged in users)
                    // Video will play on hover via onMouseEnter handler
                  }
                }}
                src={getVideoUrlWithCors(mediaItems[currentIndex].url)}
                fallbackSrc={mediaItems[currentIndex].url}
                poster={mediaItems[currentIndex].thumbnail || undefined}
                className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                controls
                playsInline
                muted
                preload="auto"
                style={{ zIndex: 10, position: 'relative' }}
                onPlay={() => setCurrentVideoPaused(false)}
                onPause={() => setCurrentVideoPaused(true)}
                onError={() => setCurrentVideoPaused(true)}
                onEnded={() => {
                  setCurrentVideoPaused(true);
                  if (currentIndex < mediaItems.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    const firstImageIndex = mediaItems.findIndex(m => m.type === 'image');
                    if (firstImageIndex >= 0) {
                      setCurrentIndex(firstImageIndex);
                    } else {
                      setCurrentIndex(0);
                    }
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const video = videoRefs.current.get(currentIndex);
                  if (video?.paused) {
                    stopAllVideosExcept(video);
                    const wantMuted = videoManager.shouldStartMuted();
                    video.muted = true;
                    ensureReadyThenPlay(video, () => {
                      if (video && !video.paused) {
                        video.muted = wantMuted;
                        setVideoMutedStates((prev) => {
                          const m = new Map(prev);
                          m.set(currentIndex, wantMuted);
                          return m;
                        });
                      }
                    });
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  if (!isMobileRef.current) {
                    const v = videoRefs.current.get(currentIndex);
                    if (v?.paused) {
                      stopAllVideosExcept(v);
                      v.muted = true;
                      ensureReadyThenPlay(v, () => {
                        if (v && !v.paused) {
                          const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
                          v.muted = wantMuted;
                          setVideoMutedStates((prev) => {
                            const m = new Map(prev);
                            m.set(currentIndex, wantMuted);
                            return m;
                          });
                        }
                      });
                    }
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobileRef.current) {
                    const v = videoRefs.current.get(currentIndex);
                    if (v) {
                      v.pause();
                      v.currentTime = 0;
                      stopAllVideosExcept(null);
                    }
                  }
                }}
              />
              {currentVideoPaused && (
                <button
                  type="button"
                  data-play-overlay
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const video = videoRefs.current.get(currentIndex);
                    if (video?.paused) {
                      stopAllVideosExcept(video);
                      const wantMuted = videoManager.shouldStartMuted();
                      video.muted = true;
                      ensureReadyThenPlay(video, () => {
                        if (video && !video.paused) {
                          video.muted = wantMuted;
                          setVideoMutedStates((prev) => {
                            const m = new Map(prev);
                            m.set(currentIndex, wantMuted);
                            return m;
                          });
                        }
                      });
                    }
                  }}
                  onMouseEnter={() => {
                    if (isMobileRef.current) return;
                    const video = videoRefs.current.get(currentIndex);
                    if (video?.paused) {
                      stopAllVideosExcept(video);
                      const wantMuted = isEdgeBrowser() ? true : videoManager.shouldStartMuted();
                      video.muted = true;
                      ensureReadyThenPlay(video, () => {
                        if (video && !video.paused) {
                          video.muted = wantMuted;
                          setVideoMutedStates((prev) => {
                            const m = new Map(prev);
                            m.set(currentIndex, wantMuted);
                            return m;
                          });
                        }
                      });
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center z-[35] cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded pointer-events-auto"
                  aria-label="Afspelen"
                >
                  <PlayCircle className="w-16 h-16 text-white/90 drop-shadow-lg" aria-hidden />
                </button>
              )}
              {/* Mute/Unmute – direct; voorkeur geldt voor alle volgende video's */}
              <button
                type="button"
                data-video-mute-button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const video = videoRefs.current.get(currentIndex);
                  if (video) {
                    const newMutedState = !video.muted;
                    video.muted = newMutedState;
                    videoManager.setUserPrefersMuted(newMutedState);
                    setVideoMutedStates((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(currentIndex, newMutedState);
                      return newMap;
                    });
                  }
                }}
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-[40] transition-all duration-200 pointer-events-auto"
                aria-label={videoMutedStates.get(currentIndex) !== false ? "Unmute video" : "Mute video"}
              >
                {videoMutedStates.get(currentIndex) !== false ? (
                  <VolumeX className="w-5 h-5" aria-hidden />
                ) : (
                  <Volume2 className="w-5 h-5" aria-hidden />
                )}
              </button>
              {/* Warning if video has no audio */}
              {videoHasAudio.get(currentIndex) === false && (
                <div className="absolute bottom-3 right-3 bg-yellow-500/80 text-white text-xs px-2 py-1 rounded z-30">
                  Geen audio
                </div>
              )}
            </div>
          ) : (
            <SafeImage
              src={mediaItems[currentIndex].url}
              alt={`${alt} ${currentIndex + 1}`}
              fill
              className={`${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-transform duration-300 group-hover:scale-105`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading={priority && currentIndex === 0 ? undefined : "lazy"}
              priority={priority && currentIndex === 0}
              quality={priority && currentIndex === 0 ? 80 : 70} // Lower quality for faster loading
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <div className="text-neutral-400 text-4xl">
              <span>📷</span>
            </div>
          </div>
        )}

        {/* Navigation Arrows - Visible on desktop, hover on mobile */}
        {showArrows && mediaItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                goToPrevious(e);
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-30 transition-all duration-200 opacity-0 group-hover:opacity-100 md:opacity-100 touch-none"
              aria-label="Previous"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                goToNext(e);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-30 transition-all duration-200 opacity-0 group-hover:opacity-100 md:opacity-100 touch-none"
              aria-label="Next"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Media Counter - Only show if more than 1 item */}
        {mediaItems.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-30">
            {currentIndex + 1} / {mediaItems.length}
          </div>
        )}
      </div>

      {/* Dots Indicator */}
        {showDots && mediaItems.length > 1 && (
          <div 
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-[5] pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={`w-2 h-2 rounded-full transition-all duration-200 pointer-events-auto ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to ${mediaItems[index].type} ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
