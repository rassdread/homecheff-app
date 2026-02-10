'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  children: React.ReactNode;
}

export default function InfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.8,
  children
}: InfiniteScrollProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  // Verslavende loading progress animatie
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setLoadingProgress(0);
    }
  }, [isLoading]);

  return (
    <>
      {children}
      
      {/* Verslavende Loading Indicator */}
      <div ref={sentinelRef} className="py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Pulsing Loader */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-30 animate-ping"></div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            {/* Verslavende Text */}
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Meer verslavende content laden...
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </p>
              <p className="text-sm text-gray-600">
                {Math.round(loadingProgress)}% geladen
              </p>
            </div>
          </div>
        )}
        
        {!hasMore && !isLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-6 py-3 rounded-full font-semibold">
              <Sparkles className="w-5 h-5" />
              Je hebt alles gezien! 🎉
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              Kom later terug voor meer inspiratie
            </p>
          </div>
        )}
      </div>
    </>
  );
}



