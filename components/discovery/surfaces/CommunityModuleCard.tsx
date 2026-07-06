'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import {
  Award,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { CommunityModuleContract } from '@/lib/discovery/surfaces/surface-contract';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Award,
};

export type CommunityModuleCardProps = {
  contract: CommunityModuleContract;
  t: (key: string) => string;
  surface?: string;
  className?: string;
  onDismiss?: () => void;
};

export default function CommunityModuleCard({
  contract,
  t,
  surface = 'desktop_sidebar',
  className = '',
  onDismiss,
}: CommunityModuleCardProps) {
  const Icon = ICON_MAP[contract.icon] ?? Users;
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
  }, []);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white p-3 shadow-sm ${className}`}
      data-surface-module="community"
      data-surface-module-id={contract.moduleId}
      data-surface={surface}
    >
      {contract.dismissible ? (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 hover:bg-white/80 hover:text-gray-600"
          aria-label={t('buttons.close')}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="flex gap-3 pr-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-snug text-gray-900">
            {t(contract.titleKey)}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 line-clamp-2">
            {t(contract.descriptionKey)}
          </p>
          {contract.actionHref ? (
            <Link
              href={contract.actionHref}
              className="mt-2 inline-flex text-xs font-semibold text-violet-700 hover:text-violet-800"
            >
              {t(contract.actionLabelKey)} →
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
