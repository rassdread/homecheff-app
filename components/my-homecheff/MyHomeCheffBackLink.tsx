'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MY_HOMECHEFF_HUB_PATH } from '@/lib/navigation/my-homecheff-hub';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  compact?: boolean;
};

export default function MyHomeCheffBackLink({ className, compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <Link
      href={MY_HOMECHEFF_HUB_PATH}
      prefetch={false}
      className={cn(
        'inline-flex min-h-[36px] items-center gap-1 font-semibold text-emerald-800 transition hover:text-emerald-950 touch-manipulation',
        compact ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      <ChevronLeft className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      {t('myHomeCheffHub.backLink')}
    </Link>
  );
}
