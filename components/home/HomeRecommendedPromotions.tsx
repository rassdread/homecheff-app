'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Smartphone, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useHomePromotionVisibility } from '@/hooks/useVisibleHomePromotions';
import {
  getHomePromotionById,
  getVisibleHomePromotions,
  type HomePromotion,
  type HomePromotionIcon,
} from '@/lib/promotions/home-promotions';
import { cn } from '@/lib/utils';

const ICONS: Record<HomePromotionIcon, typeof Smartphone> = {
  smartphone: Smartphone,
  'trending-up': TrendingUp,
  briefcase: Briefcase,
};

const SIDEBAR_MAX = 3;

function promotionTexts(t: (key: string) => string, promo: HomePromotion) {
  const base = `homePromotions.${promo.i18nKey}`;
  return {
    title: t(`${base}.title`),
    eyebrow: t(`${base}.eyebrow`),
    description: t(`${base}.description`),
    actionLabel: t(`${base}.actionLabel`),
  };
}

function PromotionBadge({
  promo,
  className,
}: {
  promo: HomePromotion;
  className?: string;
}) {
  const { t } = useTranslation();
  const badgeKey = promo.badgeKey ?? 'recommended';
  const label =
    badgeKey === 'sponsored'
      ? t('homePromotions.badgeSponsored')
      : t('homePromotions.badgeRecommended');

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
        badgeKey === 'sponsored'
          ? 'border-amber-200/80 bg-amber-50/90 text-amber-900/80'
          : 'border-primary-brand/20 bg-primary-50/80 text-primary-brand/90',
        className
      )}
    >
      {label}
    </span>
  );
}

function PromotionTile({
  promo,
  variant,
}: {
  promo: HomePromotion;
  variant: 'sidebar' | 'feedInsert';
}) {
  const { t } = useTranslation();
  const Icon = ICONS[promo.icon];
  const { title, eyebrow, description, actionLabel } = promotionTexts(t, promo);
  const isFeedInsert = variant === 'feedInsert';

  return (
    <Link
      href={promo.href}
      className={cn(
        'group block touch-manipulation transition-colors',
        isFeedInsert
          ? 'rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 hover:border-primary-brand/25 hover:bg-primary-50/30'
          : 'rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 hover:border-secondary-brand/25 hover:bg-secondary-50/30'
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg border',
            isFeedInsert
              ? 'h-9 w-9 border-primary-brand/15 bg-primary-50/60 text-primary-brand'
              : 'h-8 w-8 border-secondary-brand/15 bg-secondary-50/50 text-secondary-brand'
          )}
          aria-hidden
        >
          <Icon className={isFeedInsert ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            {isFeedInsert ? <PromotionBadge promo={promo} /> : null}
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {eyebrow}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{title}</p>
          <p
            className={cn(
              'mt-0.5 text-gray-600 leading-snug',
              isFeedInsert ? 'text-xs line-clamp-2' : 'text-[11px] line-clamp-2'
            )}
          >
            {description}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-secondary-brand group-hover:text-secondary-700">
            {actionLabel}
            <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

type Props =
  | { variant: 'sidebar'; className?: string }
  | { variant: 'feedInsert'; promotionId: string; className?: string };

export default function HomeRecommendedPromotions(props: Props) {
  const { t } = useTranslation();
  const visibility = useHomePromotionVisibility();
  const visible = getVisibleHomePromotions(visibility);

  if (props.variant === 'feedInsert') {
    const promo = getHomePromotionById(props.promotionId);
    if (!promo || !visible.some((p) => p.id === promo.id)) return null;
    return (
      <div className={cn('w-full', props.className)}>
        <PromotionTile promo={promo} variant="feedInsert" />
      </div>
    );
  }

  const tiles = visible.slice(0, SIDEBAR_MAX);
  if (tiles.length === 0) return null;

  return (
    <section
      className={cn('hc-dorpsplein-card px-4 py-3', props.className)}
      aria-labelledby="home-recommended-promotions-heading"
    >
      <div className="mb-2.5">
        <h3 id="home-recommended-promotions-heading" className="hc-section-title text-base">
          {t('homePromotions.sectionTitle')}
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-500 leading-snug">
          {t('homePromotions.sectionSubtitle')}
        </p>
      </div>
      <div className="grid gap-2">
        {tiles.map((promo) => (
          <PromotionTile key={promo.id} promo={promo} variant="sidebar" />
        ))}
      </div>
    </section>
  );
}
