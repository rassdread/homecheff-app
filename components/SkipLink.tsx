'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function SkipLink() {
  const { t } = useTranslation();

  return (
    <Link
      href="#main-content"
      className="absolute left-[-9999px] w-px h-px overflow-hidden focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:w-auto focus:h-auto focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:overflow-visible"
    >
      {t('a11y.skipToContent')}
    </Link>
  );
}
