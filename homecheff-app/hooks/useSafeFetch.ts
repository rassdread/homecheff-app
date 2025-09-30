import { useEffect, useRef } from 'react';

export function useSafeFetch() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup function to abort any ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const safeFetch = async (url: string, options: RequestInit = {}) => {
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });
      
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, this is expected behavior
        throw new Error('Request was aborted');
      }
      throw error;
    }
  };

  return safeFetch;
}
