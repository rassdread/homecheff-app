'use client';

import { useEffect, useState } from 'react';
import {
  getCardMediaFitMode,
  loadImageAspectRatio,
} from '@/lib/inspiratie/media-fit';

export type SmartMediaFitMode = 'card' | 'preview' | 'always-contain';

type Options = {
  /** card = smart aspect-based; preview = same as card; always-contain = instruction/owner step views */
  mode?: SmartMediaFitMode;
  /** Override smart detection */
  forceFit?: 'cover' | 'contain';
};

/**
 * Resolves object-fit for card/feed/profile surfaces from image aspect ratio.
 * Defaults to contain until ratio is known (safe, no aggressive crop flash).
 */
export function useSmartMediaFit(
  src: string | null | undefined,
  options: Options = {},
): 'cover' | 'contain' {
  const { mode = 'card', forceFit } = options;
  const [fit, setFit] = useState<'cover' | 'contain'>(
    forceFit ?? (mode === 'always-contain' ? 'contain' : 'contain'),
  );

  useEffect(() => {
    if (forceFit) {
      setFit(forceFit);
      return;
    }
    if (mode === 'always-contain') {
      setFit('contain');
      return;
    }
    if (!src || !src.trim()) {
      setFit('contain');
      return;
    }

    let cancelled = false;
    void loadImageAspectRatio(src).then((ratio) => {
      if (cancelled) return;
      setFit(getCardMediaFitMode(ratio));
    });

    return () => {
      cancelled = true;
    };
  }, [src, forceFit, mode]);

  return fit;
}
