'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChefHat, Sprout, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import GuestSalesInfoPanel from '@/components/home/GuestSalesInfoPanel';
import type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';
import { scrollToHomeFeed } from '@/lib/guest/guest-explanation-panels';
import { useCallback, useState } from 'react';

const VERTICALS = [
  {
    key: 'cheff' as const,
    panel: 'cheff' as const,
    icon: ChefHat,
    accent: 'from-orange-400 to-orange-600',
    blob: 'bg-orange-300/30',
    bg: 'bg-gradient-to-br from-orange-50 via-white to-amber-50/40',
    border: 'border-orange-200/80 hover:border-orange-300 hover:shadow-orange-100/50',
    dot: 'bg-orange-500',
    decor: '🍲',
  },
  {
    key: 'garden' as const,
    panel: 'garden' as const,
    icon: Sprout,
    accent: 'from-emerald-500 to-primary-brand',
    blob: 'bg-emerald-300/25',
    bg: 'bg-gradient-to-br from-emerald-50/90 via-white to-primary-50/30',
    border: 'border-emerald-200/80 hover:border-emerald-300 hover:shadow-emerald-100/50',
    dot: 'bg-primary-brand',
    decor: '🌱',
  },
  {
    key: 'designer' as const,
    panel: 'designer' as const,
    icon: Palette,
    accent: 'from-violet-500 to-secondary-brand',
    blob: 'bg-purple-300/25',
    bg: 'bg-gradient-to-br from-purple-50/90 via-white to-secondary-50/25',
    border: 'border-purple-200/80 hover:border-purple-300 hover:shadow-purple-100/50',
    dot: 'bg-secondary-brand',
    decor: '🎨',
  },
];

type Props = { className?: string };

function VerticalCardInner({
  icon: Icon,
  accent,
  blob,
  bg,
  border,
  dot,
  decor,
  title,
  description,
}: {
  icon: typeof ChefHat;
  accent: string;
  blob: string;
  bg: string;
  border: string;
  dot: string;
  decor: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden hc-dorpsplein-card text-left p-4 sm:p-5 min-h-[108px]',
        'hc-card-lift',
        bg,
        border
      )}
    >
      <span
        className={cn('absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl pointer-events-none', blob)}
        aria-hidden
      />
      <span
        className="absolute bottom-2 right-3 text-2xl opacity-20 pointer-events-none select-none"
        aria-hidden
      >
        {decor}
      </span>
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            'inline-flex rounded-2xl bg-gradient-to-br p-3 shadow-md ring-2 ring-white/90',
            accent
          )}
        >
          <Icon className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} aria-hidden />
            <h2 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-snug line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomeVerticalCards({ className }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [guestPanel, setGuestPanel] = useState<GuestSalesPanelId | null>(null);
  const isGuest = status !== 'loading' && !session?.user;

  const openVerticalFeed = useCallback(
    (key: string) => {
      router.push(`/?chip=sale&vertical=${key}#homecheff-feed`);
      window.setTimeout(scrollToHomeFeed, 150);
    },
    [router]
  );

  return (
    <>
      <div className={cn('grid gap-3 sm:grid-cols-3 mb-5 sm:mb-6', className)}>
        {VERTICALS.map(({ key, panel, icon, accent, blob, bg, border, dot, decor }) => {
          const title = t(`homePhase1.verticals.${key}.title`);
          const description = t(`homePhase1.verticals.${key}.description`);
          const inner = (
            <VerticalCardInner
              icon={icon}
              accent={accent}
              blob={blob}
              bg={bg}
              border={border}
              dot={dot}
              decor={decor}
              title={title}
              description={description}
            />
          );

          return isGuest ? (
            <button key={key} type="button" onClick={() => setGuestPanel(panel)} className="text-left">
              {inner}
            </button>
          ) : (
            <Link
              key={key}
              href={`/?chip=sale&vertical=${key}#homecheff-feed`}
              prefetch={false}
              onClick={(e) => {
                e.preventDefault();
                openVerticalFeed(key);
              }}
              className="block"
            >
              {inner}
            </Link>
          );
        })}
      </div>
      {isGuest ? (
        <GuestSalesInfoPanel panel={guestPanel} onClose={() => setGuestPanel(null)} />
      ) : null}
    </>
  );
}
