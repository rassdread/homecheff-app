'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface DistanceResult {
  id: string;
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
}

interface DistanceError {
  id: string;
  error: string;
  message?: string;
}

interface UseLazyDistanceOptions {
  origin: { lat: number; lng: number } | null;
  items: Array<{
    id: string;
    lat: number;
    lng: number;
  }>;
  enabled?: boolean;
  batchSize?: number;
  mode?: 'driving' | 'walking' | 'bicycling';
}

interface UseLazyDistanceReturn {
  distances: Map<string, DistanceResult>;
  errors: Map<string, DistanceError>;
  loading: boolean;
  calculateDistances: (itemIds?: string[]) => Promise<void>;
  clearDistances: () => void;
}

/**
 * Hook for lazy loading Google Maps distances
 * Only calculates distances for items that are actually visible/needed
 */
export function useLazyDistance({
  origin,
  items,
  enabled = true,
  batchSize = 10, // Calculate 10 at a time to avoid overwhelming the API
  mode = 'driving'
}: UseLazyDistanceOptions): UseLazyDistanceReturn {
  const [distances, setDistances] = useState<Map<string, DistanceResult>>(new Map());
  const [errors, setErrors] = useState<Map<string, DistanceError>>(new Map());
  const [loading, setLoading] = useState(false);
  const calculatingRef = useRef<Set<string>>(new Set());
  const cacheRef = useRef<Map<string, DistanceResult>>(new Map());

  // Clear distances when origin changes
  useEffect(() => {
    if (origin) {
      setDistances(new Map());
      setErrors(new Map());
      cacheRef.current.clear();
    }
  }, [origin?.lat, origin?.lng]);

  const calculateDistances = useCallback(async (itemIds?: string[]) => {
    if (!origin || !enabled || loading) return;

    // Filter items to calculate
    const itemsToCalculate = itemIds
      ? items.filter(item => itemIds.includes(item.id))
      : items;

    // Filter out items already calculated or being calculated
    const itemsToProcess = itemsToCalculate.filter(item => {
      const cacheKey = `${origin.lat},${origin.lng}|${item.lat},${item.lng}`;
      return (
        !distances.has(item.id) &&
        !errors.has(item.id) &&
        !calculatingRef.current.has(item.id) &&
        !cacheRef.current.has(cacheKey)
      );
    });

    if (itemsToProcess.length === 0) return;

    setLoading(true);

    try {
      // Process in batches to avoid overwhelming the API
      for (let i = 0; i < itemsToProcess.length; i += batchSize) {
        const batch = itemsToProcess.slice(i, i + batchSize);
        
        // Mark as calculating
        batch.forEach(item => calculatingRef.current.add(item.id));

        // Prepare destinations
        const destinations = batch.map(item => ({
          lat: item.lat,
          lng: item.lng,
          id: item.id
        }));

        // Call API
        const response = await fetch('/api/distance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origin,
            destinations,
            mode
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('API returned error');
        }

        // Process results
        const newDistances = new Map(distances);
        const newErrors = new Map(errors);

        data.results.forEach((result: DistanceResult | DistanceError) => {
          if ('error' in result) {
            newErrors.set(result.id, result);
          } else {
            newDistances.set(result.id, result);
            // Cache the result
            const cacheKey = `${origin.lat},${origin.lng}|${batch.find(b => b.id === result.id)?.lat},${batch.find(b => b.id === result.id)?.lng}`;
            if (cacheKey) {
              cacheRef.current.set(cacheKey, result);
            }
          }
        });

        setDistances(newDistances);
        setErrors(newErrors);

        // Remove from calculating set
        batch.forEach(item => calculatingRef.current.delete(item.id));
      }
    } catch (error) {
      console.error('Error calculating distances:', error);
      // Mark all as failed
      const newErrors = new Map(errors);
      itemsToProcess.forEach(item => {
        newErrors.set(item.id, {
          id: item.id,
          error: 'calculation_failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        calculatingRef.current.delete(item.id);
      });
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  }, [origin, items, enabled, batchSize, mode, distances, errors]);

  const clearDistances = useCallback(() => {
    setDistances(new Map());
    setErrors(new Map());
    cacheRef.current.clear();
    calculatingRef.current.clear();
  }, []);

  return {
    distances,
    errors,
    loading,
    calculateDistances,
    clearDistances
  };
}






















