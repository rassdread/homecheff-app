'use client';

import { useEffect, useState } from 'react';
import {
  getCardMediaFitMode,
  readCachedImageAspectRatio,
  subscribeImageAspectRatio,
} from '@/lib/inspiratie/media-fit';

export type SmartMediaFitMode = 'card' | 'preview' | 'always-contain';

type Options = {
  /** card = smart aspect-based; preview = same as card; always-contain = instruction/owner step views */
  mode?: SmartMediaFitMode;
  /** Override smart detection */
  forceFit?: 'cover' | 'contain';
};

/**
 * Resolves object-fit for card/feed/profile surfaces from an image that is already on screen.
 * Does not start its own download. The visible image reports its size on load.
 * Defaults to contain until that size is known.
 */
export function useSmartMediaFit(
  src: string | null | undefined,
  options: Options = {},
): 'cover' | 'contain' {
  const { mode = 'card', forceFit } = options;
  const url = src?.trim() || null;
  const known =
    forceFit || mode === 'always-contain' || !url
      ? null
      : readCachedImageAspectRatio(url);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (forceFit || mode === 'always-contain' || !url || known != null) return;
    if (readCachedImageAspectRatio(url) != null) {
      setTick((n) => n + 1);
      return;
    }
    return subscribeImageAspectRatio(url, () => setTick((n) => n + 1));
  }, [url, forceFit, mode, known]);

  if (forceFit) return forceFit;
  if (mode === 'always-contain' || !url) return 'contain';
  return getCardMediaFitMode(readCachedImageAspectRatio(url));
}
