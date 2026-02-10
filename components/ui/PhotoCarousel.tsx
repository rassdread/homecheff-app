'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Volume2, VolumeX } from 'lucide-react';
import SafeImage from './SafeImage';
import { checkVideoHasAudio } from '@/lib/videoUtils';
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
}

export default function PhotoCarousel({ 
  photos = [],
  videos = [],
  media = [],
  className = '', 
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 4000
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [videoMutedStates, setVideoMutedStates] = useState<Map<number, boolean>>(new Map());
  const [videoHasAudio, setVideoHasAudio] = useState<Map<number, boolean>>(new Map());
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
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          const videoIndex = Array.from(videoRefs.current.entries()).find(
            ([_, v]) => v === videoElement
          )?.[0];

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Video is visible - play it with sound
            if (videoElement && videoElement.paused) {
              // Stop all other videos first (using global video manager)
              videoManager.stopAllExcept(videoElement);
              // Start muted for autoplay compliance, then unmute immediately after play starts
              videoElement.muted = true;
              const playPromise = videoElement.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    // Unmute immediately after play starts (with sound)
                    if (videoElement && !videoElement.paused) {
                      const userMuted = videoMutedStates.get(videoIndex ?? currentIndex);
                      if (userMuted === undefined || userMuted === false) {
                        videoElement.muted = false;
                        if (videoIndex !== undefined) {
                          setVideoMutedStates((prev) => {
                            const newMap = new Map(prev);
                            newMap.set(videoIndex, false);
                            return newMap;
                          });
                        }
                      }
                    }
                  })
                  .catch(() => {
                    // Autoplay was prevented - this is normal in some browsers
                  });
              }
            }
          }
          // Don't pause when out of view - let video play to completion
        });
      },
      { threshold: 0.5 }
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
  }, [mediaItems, currentIndex, videoMutedStates]);

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

  return (
    <>
      {/* Main Carousel */}
      <div className={`relative group ${className}`}>
        {/* Main Media Container */}
        <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
          {currentMedia.type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(currentIndex, el);
                    // Start muted for autoplay compliance, will unmute after play starts
                    el.muted = true;
                    el.playsInline = true;
                    el.setAttribute('playsinline', 'true');
                    el.setAttribute('webkit-playsinline', 'true');
                    el.preload = 'metadata';
                    el.loop = false; // Don't loop - go to next slide after video ends
                    
                    // Observe with intersection observer
                    if (intersectionObserverRef.current) {
                      intersectionObserverRef.current.observe(el);
                    }
                  }
                }}
                src={currentMedia.url}
                controls
                className="w-full h-full object-cover"
                poster={currentMedia.thumbnail || undefined}
                playsInline
                autoPlay
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
              >
                Je browser ondersteunt geen video element.
              </video>
              {/* Mute/Unmute Button - Only show if video has audio */}
              {videoHasAudio.get(currentIndex) !== false && (
                <button
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
              src={currentMedia.fileUrl || ''}
              alt={`Foto ${currentIndex + 1}`}
              fill
              className="object-cover transition-all duration-500 ease-in-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
            />
          )}
          
          {/* Overlay with controls */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-30"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>

            {/* Play/Pause Button (if autoPlay enabled) */}
            {autoPlay && (
              <button
                onClick={togglePlay}
                className="absolute top-4 left-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                {isPlaying ? (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-2 h-4 bg-gray-700 rounded-sm"></div>
                    <div className="w-2 h-4 bg-gray-700 rounded-sm ml-1"></div>
                  </div>
                ) : (
                  <div className="w-0 h-0 border-l-[6px] border-l-gray-700 border-y-[4px] border-y-transparent ml-1"></div>
                )}
              </button>
            )}

            {/* Media Counter */}
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/90 rounded-full text-sm font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300">
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
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {currentMedia.type === 'video' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(currentIndex, el);
                      // Register with global video manager
                      videoManager.register(el);
                      // Start muted for autoplay compliance, will unmute after play starts
                      el.muted = true;
                      el.playsInline = true;
                      el.setAttribute('playsinline', 'true');
                      el.setAttribute('webkit-playsinline', 'true');
                      el.preload = 'metadata';
                      el.loop = false; // Don't loop - go to next slide after video ends
                    }
                  }}
                  src={currentMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain rounded-lg"
                  poster={currentMedia.thumbnail || undefined}
                  playsInline
                  onEnded={() => {
                    // After video ends, automatically go to next slide (gallery)
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
                >
                  Je browser ondersteunt geen video element.
                </video>
                {/* Mute/Unmute Button - Only show if video has audio */}
                {videoHasAudio.get(currentIndex) !== false && (
                  <button
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
                src={currentMedia.fileUrl || ''}
                alt={`Foto ${currentIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}

            {/* Fullscreen Navigation */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Fullscreen Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 rounded-full text-white font-medium">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
