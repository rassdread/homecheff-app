'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

export default function EcosystemBackLink({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Link
      href="/"
      prefetch={false}
      className={cn(
        'inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-emerald-800 hover:text-emerald-950',
        className,
      )}
    >
      <span aria-hidden>←</span>
      {t('ecosystemVertical.backHome')}
    </Link>
  );
}
