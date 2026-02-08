'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle, Volume2, VolumeX } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import { isIntersectionObserverSupported, createSafeIntersectionObserver } from '@/lib/browser-utils';
import { checkVideoHasAudio, getVideoUrlWithCors } from '@/lib/videoUtils';
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
  objectFit = 'cover' // Default to cover for grid items, can be set to 'contain' for detail pages
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
  
  // Detect mobile vs desktop
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768 || 'ontouchstart' in window;
  }, []);
  
  // Stop all videos except the one specified (using global video manager)
  const stopAllVideosExcept = (exceptVideo: HTMLVideoElement | null) => {
    // Use global video manager to stop all videos across all components
    videoManager.stopAllExcept(exceptVideo);
    currentlyPlayingVideoRef.current = exceptVideo;
  };

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

  // Setup intersection observer for video playback (all browsers, all users)
  useEffect(() => {
    const observer = createSafeIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          // Only play when fully visible (100% in viewport)
          if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
            // Stop all other videos first
            stopAllVideosExcept(video);
            // Play this video
            // Respect user's mute preference - only set to muted if not already set by user
            // Find the video index
            let videoIndex = -1;
            videoRefs.current.forEach((v, idx) => {
              if (v === video) videoIndex = idx;
            });
            if (videoIndex >= 0) {
              const userMutedState = videoMutedStates.get(videoIndex);
              // Start muted for autoplay compliance, then unmute after play starts
              video.muted = userMutedState !== undefined ? userMutedState : true;
              if (userMutedState === undefined) {
                setVideoMutedStates((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(videoIndex, true); // Start muted
                  return newMap;
                });
              }
            } else {
              // Fallback: start muted for autoplay
              video.muted = true;
            }
            
            // Ensure all browser-specific attributes are set for autoplay
            // Don't loop - after video ends, go to next slide (gallery)
            video.loop = false;
            video.playsInline = true;
            video.setAttribute('playsinline', 'true'); // iOS Safari
            video.setAttribute('webkit-playsinline', 'true'); // Older iOS Safari
            
            // Try to play - catch errors silently (browser may block autoplay)
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  // After video starts playing, unmute immediately (with sound)
                  const currentMutedState = videoMutedStates.get(videoIndex);
                  if (currentMutedState === undefined || currentMutedState === true) {
                    // Only unmute if it was auto-muted (not user-muted)
                    if (video && !video.paused) {
                      const userMuted = videoMutedStates.get(videoIndex);
                      // Only unmute if user hasn't explicitly set it to muted
                      if (userMuted === undefined || userMuted === true) {
                        video.muted = false;
                        setVideoMutedStates((prev) => {
                          const newMap = new Map(prev);
                          newMap.set(videoIndex, false);
                          return newMap;
                        });
                      }
                    }
                  }
                })
                .catch((error) => {
                  // Autoplay was prevented - this is normal in some browsers
                  // User can still click play button
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Video autoplay prevented by browser:', error);
                  }
                });
            }
          } else {
            // Don't pause - let video play to completion
            // Only stop if user explicitly navigates away
          }
        });
      },
      { 
        threshold: 1.0, // Only trigger when 100% visible
        rootMargin: '0px' // No margin for precise detection
      }
    );
    
    intersectionObserverRef.current = observer;
    
    // Fallback for browsers without IntersectionObserver (very old browsers only)
    // Modern browsers (Chrome 51+, Firefox 55+, Edge 15+, Safari 12.1+) all support it
    if (!observer) {
      // Use scroll-based fallback for very old browsers
      const handleScroll = () => {
        videoRefs.current.forEach((video, index) => {
          if (video) {
            const rect = video.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const isFullyVisible = rect.top >= 0 && 
                                  rect.left >= 0 && 
                                  rect.bottom <= windowHeight && 
                                  rect.right <= (window.innerWidth || document.documentElement.clientWidth);
            
            if (isFullyVisible && video.paused) {
              // Start with sound ON (user can mute if needed)
              const videoIndex = Array.from(videoRefs.current.entries()).find(([_, v]) => v === video)?.[0];
              if (videoIndex !== undefined) {
                const userMutedState = videoMutedStates.get(videoIndex);
                video.muted = userMutedState !== undefined ? userMutedState : false;
              } else {
                video.muted = false;
              }
              video.loop = false; // Don't loop - go to next slide after video ends
              video.playsInline = true;
              video.setAttribute('playsinline', 'true');
              video.setAttribute('webkit-playsinline', 'true');
              
              stopAllVideosExcept(video);
              video.play().catch(() => {
                // Autoplay might be blocked
              });
            }
            // Don't pause when not fully visible - let video play to completion
          }
        });
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
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [videoMutedStates, stopAllVideosExcept]);

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

  // Check if videos have audio when they're loaded
  useEffect(() => {
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.type === 'video' && currentMedia.url) {
      // Check if we already know about this video's audio status
      if (!videoHasAudio.has(currentIndex)) {
        // Check if video has audio
        checkVideoHasAudio(currentMedia.url).then((hasAudio) => {
          setVideoHasAudio((prev) => {
            const newMap = new Map(prev);
            newMap.set(currentIndex, hasAudio);
            return newMap;
          });
          
          // If video has no audio, log a warning
          if (!hasAudio) {
            console.warn('⚠️ Video has no audio track:', currentMedia.url);
          }
        }).catch((error) => {
          console.warn('Could not check video audio:', error);
          // Default to true (assume audio exists)
          setVideoHasAudio((prev) => {
            const newMap = new Map(prev);
            newMap.set(currentIndex, true);
            return newMap;
          });
        });
      }
    }
  }, [mediaItems, currentIndex, videoHasAudio]);

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
    
    // Also try to play current video if it's visible and a video
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.type === 'video') {
      const video = videoRefs.current.get(currentIndex);
      if (video) {
        // Check if video is already visible
        const checkAndPlay = () => {
          const rect = video.getBoundingClientRect();
          const isVisible = rect.top >= 0 && rect.left >= 0 && 
                           rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                           rect.right <= (window.innerWidth || document.documentElement.clientWidth);
          
          if (isVisible && video.paused) {
            // Video is visible and paused, trigger play
            stopAllVideosExcept(video);
            const userMutedState = videoMutedStates.get(currentIndex);
            video.muted = userMutedState !== undefined ? userMutedState : true;
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  // Unmute immediately after play starts (with sound)
                  if (video && !video.paused) {
                    const userMuted = videoMutedStates.get(currentIndex);
                    if (userMuted === undefined || userMuted === false) {
                      video.muted = false;
                      setVideoMutedStates((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(currentIndex, false);
                        return newMap;
                      });
                    }
                  }
                })
                .catch(() => {});
            }
          }
        };
        
        // Check immediately and after a short delay
        setTimeout(checkAndPlay, 100);
      }
    }
  }, [mediaItems, currentIndex, videoMutedStates, stopAllVideosExcept]);

  // Handle video playback when slide changes (desktop behavior)
  useEffect(() => {
    if (isMobileRef.current) {
      // On mobile, intersection observer handles playback
      return;
    }

    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.type === 'video') {
      // Stop all videos first
      stopAllVideosExcept(null);
    } else {
      // Pause all videos when showing an image
      stopAllVideosExcept(null);
    }
  }, [currentIndex, mediaItems]);

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
    // Don't start if there's only 1 or no media items
    if (mediaItems.length <= 1) {
      return;
    }

    // Clear any existing interval
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
  }, [mediaItems.length, scrollSlideInterval, stopAutoSlide]);

  // Intersection Observer for scroll-based auto-slide
  useEffect(() => {
    if (!autoSlideOnScroll || mediaItems.length <= 1) {
      return;
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

          if (isVisible) {
            // Start auto-sliding when visible
            startAutoSlide();
          } else {
            // Stop auto-sliding when not visible
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
      startAutoSlide();
      return;
    }

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
      stopAutoSlide();
    };
  }, [autoSlideOnScroll, mediaItems.length, startAutoSlide, stopAutoSlide]);

  // Auto-play functionality (time-based, regardless of visibility)
  useEffect(() => {
    if (autoPlay && mediaItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === mediaItems.length - 1 ? 0 : prevIndex + 1
        );
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [autoPlay, mediaItems.length, autoPlayInterval]);

  // Reset to first media item when media array changes
  useEffect(() => {
    if (mediaItems.length > 0 && currentIndex >= mediaItems.length) {
      setCurrentIndex(0);
    }
  }, [mediaItems.length, currentIndex]);

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
    // Don't block clicks on video controls or any element inside a video
    const target = e.target as HTMLElement;
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
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't block clicks on mute button, video controls, or any element inside a video
    const target = e.target as HTMLElement;
    // Check if click is on mute button
    if (target.closest('[data-video-mute-button]') || target.hasAttribute('data-video-mute-button')) {
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

  // Check if single video has audio
  useEffect(() => {
    if (mediaItems.length === 1 && mediaItems[0]?.type === 'video' && mediaItems[0].url) {
      if (!videoHasAudio.has(0)) {
        checkVideoHasAudio(mediaItems[0].url).then((hasAudio) => {
          setVideoHasAudio((prev) => {
            const newMap = new Map(prev);
            newMap.set(0, hasAudio);
            return newMap;
          });
          if (!hasAudio) {
            console.warn('⚠️ Single video has no audio track:', mediaItems[0].url);
          }
        }).catch(() => {
          setVideoHasAudio((prev) => {
            const newMap = new Map(prev);
            newMap.set(0, true);
            return newMap;
          });
        });
      }
    }
  }, [mediaItems, videoHasAudio]);

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
          <div style={{ zIndex: 10, position: 'relative' }}>
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(0, el);
                  // Register with global video manager
                  videoManager.register(el);
                  // Cross-browser compatibility: ensure all attributes are set
                    // Start with sound ON (user can mute if needed)
                    const isMuted = videoMutedStates.get(0) ?? false;
                    el.muted = isMuted;
                  el.loop = false; // Don't loop - go to next slide after video ends
                  
                  // iOS Safari compatibility
                  el.playsInline = true;
                  el.setAttribute('playsinline', 'true'); // Standard attribute
                  el.setAttribute('webkit-playsinline', 'true'); // WebKit prefix for older iOS
                  
                  // Preload strategy
                  el.preload = 'metadata';
                  
                  // Observe with intersection observer (for autoplay on all browsers)
                  if (intersectionObserverRef.current) {
                    intersectionObserverRef.current.observe(el);
                  }
                }
              }}
              src={getVideoUrlWithCors(singleMedia.url)}
              className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
              controls
              playsInline
              webkit-playsinline="true"
              preload="metadata"
              style={{ zIndex: 10, position: 'relative' }}
              onEnded={() => {
                // After video ends, go to next slide (gallery)
                if (mediaItems.length > 1) {
                  const nextIndex = currentIndex < mediaItems.length - 1 ? currentIndex + 1 : 0;
                  setCurrentIndex(nextIndex);
                }
              }}
              onClick={(e) => {
                // Allow video controls to work - don't propagate to parent
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                // Allow video controls to work - don't propagate to parent
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                // Allow video controls to work on touch devices
                e.stopPropagation();
              }}
              onMouseEnter={() => {
                // Desktop: Play on hover
                if (!isMobileRef.current && videoRefs.current.get(0)) {
                  const video = videoRefs.current.get(0);
                  if (video) {
                    stopAllVideosExcept(video);
                    // Respect user's mute preference
                    const userMutedState = videoMutedStates.get(0);
                    if (userMutedState === undefined) {
                      // First time - start with sound ON
                      video.muted = false;
                      setVideoMutedStates((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(0, false);
                        return newMap;
                      });
                    } else {
                      // Respect user's choice
                      video.muted = userMutedState;
                    }
                    video.play().catch(() => {});
                  }
                }
              }}
              onMouseLeave={() => {
                // Desktop: Pause when mouse leaves
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
            {/* Mute/Unmute Button - Only show if video has audio */}
            {videoHasAudio.get(0) !== false && (
              <button
                data-video-mute-button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const video = videoRefs.current.get(0);
                  if (video) {
                    const newMutedState = !video.muted;
                    video.muted = newMutedState;
                    setVideoMutedStates((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(0, newMutedState);
                      return newMap;
                    });
                  }
                }}
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-30 transition-all duration-200"
                aria-label={videoMutedStates.get(0) ? "Unmute video" : "Mute video"}
              >
                {videoMutedStates.get(0) ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            )}
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
            quality={priority ? 80 : 70} // Lower quality for faster loading
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
        // Pause auto-slide on hover (desktop)
        lastUserInteractionRef.current = Date.now();
        stopAutoSlide();
        
        // Desktop: Play video on hover
        if (!isMobileRef.current) {
          const currentMedia = mediaItems[currentIndex];
          if (currentMedia?.type === 'video') {
            const video = videoRefs.current.get(currentIndex);
            if (video) {
              stopAllVideosExcept(video);
              // Respect user's mute preference
              const userMutedState = videoMutedStates.get(currentIndex);
              if (userMutedState === undefined) {
                // First time - start with sound ON
                video.muted = false;
                setVideoMutedStates((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(currentIndex, false);
                  return newMap;
                });
              } else {
                // Respect user's choice
                video.muted = userMutedState;
              }
              video.loop = false; // Don't loop - go to next slide after video ends
              video.play().catch(() => {
                // Autoplay might be blocked
              });
            }
          }
        }
      }}
      onMouseLeave={() => {
        // Resume auto-slide when mouse leaves (desktop)
        if (isVisibleRef.current) {
          setTimeout(() => {
            startAutoSlide();
          }, 1000); // Wait 1 second after mouse leave
        }
        
        // Don't pause video on mouse leave - let it play to completion
      }}
      data-image-slider
    >
      {/* Main Media */}
      <div className="absolute inset-0">
        {mediaItems[currentIndex] ? (
          mediaItems[currentIndex].type === 'video' ? (
            <div className="relative w-full h-full" style={{ zIndex: 10, position: 'relative' }}>
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(currentIndex, el);
                    // Register with global video manager
                    videoManager.register(el);
                    // Cross-browser compatibility: ensure all attributes are set
                    // Start with sound ON (user can mute if needed)
                    const isMuted = videoMutedStates.get(currentIndex) ?? false;
                    el.muted = isMuted;
                    el.loop = false; // Don't loop - go to next slide after video ends
                    
                    // iOS Safari compatibility
                    el.playsInline = true;
                    el.setAttribute('playsinline', 'true'); // Standard attribute
                    el.setAttribute('webkit-playsinline', 'true'); // WebKit prefix for older iOS
                    
                    // Preload strategy for better performance
                    el.preload = currentIndex === 0 ? 'metadata' : 'none';
                    
                    // Observe with intersection observer (for autoplay on all browsers)
                    if (intersectionObserverRef.current) {
                      intersectionObserverRef.current.observe(el);
                    }
                    
                    // On desktop: also allow hover to play (for logged in users)
                    // Video will play on hover via onMouseEnter handler
                  }
                }}
                src={getVideoUrlWithCors(mediaItems[currentIndex].url)}
                poster={mediaItems[currentIndex].thumbnail || undefined}
                className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                controls
                playsInline
                webkit-playsinline="true"
                preload={currentIndex === 0 ? "metadata" : "none"}
                autoPlay
                style={{ zIndex: 10, position: 'relative' }}
                onEnded={() => {
                  // After video ends, automatically go to next slide (gallery)
                  if (currentIndex < mediaItems.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    // If video is last item, go to first image (skip video if it's not first)
                    const firstImageIndex = mediaItems.findIndex(m => m.type === 'image');
                    if (firstImageIndex >= 0) {
                      setCurrentIndex(firstImageIndex);
                    } else {
                      setCurrentIndex(0); // Fallback to first item
                    }
                  }
                }}
                onClick={(e) => {
                  // Allow video controls to work - don't propagate to parent
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  // Allow video controls to work - don't propagate to parent
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  // Allow video controls to work on touch devices
                  e.stopPropagation();
                }}
              />
              {/* Mute/Unmute Button - Only show if video has audio */}
              {videoHasAudio.get(currentIndex) !== false && (
                <button
                  data-video-mute-button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const video = videoRefs.current.get(currentIndex);
                    if (video) {
                      const newMutedState = !video.muted;
                      video.muted = newMutedState;
                      setVideoMutedStates((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(currentIndex, newMutedState);
                        return newMap;
                      });
                    }
                  }}
                  className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-30 transition-all duration-200"
                  aria-label={videoMutedStates.get(currentIndex) ? "Unmute video" : "Mute video"}
                >
                  {videoMutedStates.get(currentIndex) ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              )}
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
