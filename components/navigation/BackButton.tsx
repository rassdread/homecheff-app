'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getSameOriginReferrerPath,
  getTrackedPreviousPath,
} from '@/lib/navigation/backHistory';

function isAuthGatePath(path: string): boolean {
  const base = path.split('?')[0]?.split('#')[0] ?? path;
  return (
    base.startsWith('/login') ||
    base.startsWith('/register') ||
    base.startsWith('/auth') ||
    base.startsWith('/signin')
  );
}

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
  /**
   * `auto` (default): prefer browser history when stack allows, else tracked path / referrer / fallback.
   * `explicit`: always `router.push(fallbackUrl)` — use when the label promises a fixed destination
   * (e.g. “Terug naar berichten” → `/messages`), never `router.back()` which can land on another chat.
   */
  backNavMode?: 'auto' | 'explicit';
}

const DORPSPLEIN_FALLBACK = '/?chip=sale#homecheff-feed';

export default function BackButton({
  fallbackUrl = DORPSPLEIN_FALLBACK,
  label = 'Terug',
  className = '',
  variant = 'default',
  backNavMode = 'auto',
}: BackButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    if (typeof window === 'undefined') {
      router.push(fallbackUrl);
      return;
    }

    if (backNavMode === 'explicit') {
      router.push(fallbackUrl);
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    const tracked = getTrackedPreviousPath();
    const refPath = getSameOriginReferrerPath();
    const pick =
      (tracked && !isAuthGatePath(tracked) ? tracked : null) ||
      (refPath && !isAuthGatePath(refPath) ? refPath : null);
    router.push(pick || fallbackUrl);
  };

  const variantStyles = {
    default:
      'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm touch-manipulation',
    minimal:
      'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50/80 active:bg-teal-100/80 transition-colors touch-manipulation',
    floating:
      'fixed top-[max(5rem,env(safe-area-inset-top,0px)+4.5rem)] left-3 z-40 inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border border-white/20 bg-gray-900/85 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-gray-900 transition-all shadow-lg print:hidden touch-manipulation',
  };

  return (
    <button type="button" onClick={handleBack} className={`${variantStyles[variant]} ${className}`} aria-label={t('common.goBack')}>
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
