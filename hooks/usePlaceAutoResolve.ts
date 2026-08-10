'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResolvedPlaceCandidate } from '@/lib/geo/resolve-place-input';

export type PlaceAutoResolveState =
  | { status: 'idle' }
  | { status: 'resolving' }
  | { status: 'resolved'; result: ResolvedPlaceCandidate }
  | { status: 'ambiguous'; candidates: ResolvedPlaceCandidate[]; message: string }
  | { status: 'none'; message: string }
  | { status: 'error'; message: string };

type UsePlaceAutoResolveOpts = {
  query: string;
  countryCode?: string;
  /** When false, do not fire network requests. */
  enabled?: boolean;
  debounceMs?: number;
  /** Called when a single high-confidence result is auto-accepted. */
  onResolved?: (result: ResolvedPlaceCandidate) => void;
  /** Called when query changes enough that prior coords must be cleared. */
  onInvalidate?: () => void;
};

/**
 * Debounced place → coords resolution for create/edit UX.
 * Cancels stale responses; latest query wins.
 */
export function usePlaceAutoResolve(opts: UsePlaceAutoResolveOpts) {
  const {
    query,
    countryCode = 'NL',
    enabled = true,
    debounceMs = 450,
    onResolved,
    onInvalidate,
  } = opts;

  const [state, setState] = useState<PlaceAutoResolveState>({ status: 'idle' });
  const lastQueryRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const onResolvedRef = useRef(onResolved);
  const onInvalidateRef = useRef(onInvalidate);
  onResolvedRef.current = onResolved;
  onInvalidateRef.current = onInvalidate;

  const selectCandidate = useCallback((candidate: ResolvedPlaceCandidate) => {
    setState({ status: 'resolved', result: candidate });
    onResolvedRef.current?.(candidate);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }

    if (trimmed !== lastQueryRef.current) {
      const previous = lastQueryRef.current;
      lastQueryRef.current = trimmed;
      // Skip invalidate on first populate ('' → initial place); only when text materially changes.
      if (previous !== '' && previous !== trimmed) {
        onInvalidateRef.current?.();
      }
    }

    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setState({ status: 'idle' });
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setState({ status: 'resolving' });
      try {
        const res = await fetch('/api/geocoding/resolve-place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed, countryCode }),
          signal: ac.signal,
        });
        const data = await res.json();
        if (ac.signal.aborted) return;
        if (data.status === 'resolved' && data.result) {
          setState({ status: 'resolved', result: data.result });
          onResolvedRef.current?.(data.result);
        } else if (data.status === 'ambiguous' && Array.isArray(data.candidates)) {
          setState({
            status: 'ambiguous',
            candidates: data.candidates,
            message: data.message || 'Welke locatie bedoel je?',
          });
        } else if (data.status === 'error') {
          setState({
            status: 'error',
            message: data.message || 'Locatie kon tijdelijk niet worden opgezocht.',
          });
        } else {
          setState({
            status: 'none',
            message: data.message || 'Locatie niet gevonden.',
          });
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        setState({
          status: 'error',
          message: 'Locatie kon tijdelijk niet worden opgezocht.',
        });
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, countryCode, enabled, debounceMs]);

  return { state, selectCandidate };
}
