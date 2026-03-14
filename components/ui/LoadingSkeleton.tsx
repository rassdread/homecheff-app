'use client';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

/**
 * Eenvoudige skeleton voor laden: toon terwijl content wordt opgehaald.
 */
export default function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: i === lines - 1 && lines > 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}
