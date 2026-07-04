'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  partitionUserActionItems,
  type UserActionItem,
  type UserActionCenterVariant,
} from '@/lib/user/user-action-center';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import { cn } from '@/lib/utils';

type ActionCenterResponse = {
  items: UserActionItem[];
  totalCount: number;
  healthy: boolean;
  hasSellerProfile?: boolean;
  roles?: {
    hasSellerProfile?: boolean;
    hasDeliveryProfile?: boolean;
    hasAffiliate?: boolean;
  };
};

type Props = {
  variant?: UserActionCenterVariant;
  className?: string;
  /** Homepage: universal. Dashboard: seller-only subset. */
  apiEndpoint?: '/api/user/action-center' | '/api/seller/action-center';
  viewAllHref?: string;
};

const VARIANT_MAX: Record<UserActionCenterVariant, number> = {
  dashboard: 5,
  sidebar: 3,
  mobileCompact: 2,
};

const severityStyles = {
  red: {
    card: 'border-red-200 bg-red-50/80',
    dot: 'bg-red-500',
    title: 'text-red-950',
    desc: 'text-red-900/80',
    cta: 'bg-red-600 hover:bg-red-700 text-white',
  },
  orange: {
    card: 'border-amber-200 bg-amber-50/80',
    dot: 'bg-amber-500',
    title: 'text-amber-950',
    desc: 'text-amber-900/80',
    cta: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  green: {
    card: 'border-emerald-200 bg-emerald-50/80',
    dot: 'bg-emerald-500',
    title: 'text-emerald-950',
    desc: 'text-emerald-900/80',
    cta: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  gray: {
    card: 'border-gray-200 bg-gray-50',
    dot: 'bg-gray-400',
    title: 'text-gray-900',
    desc: 'text-gray-600',
    cta: 'bg-gray-700 hover:bg-gray-800 text-white',
  },
} as const;

function ActionRow({
  item,
  compact,
  showDescription,
}: {
  item: UserActionItem;
  compact: boolean;
  showDescription: boolean;
}) {
  const styles = severityStyles[item.severity] ?? severityStyles.gray;
  const [stripeLoading, setStripeLoading] = useState(false);
  const ctaClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-colors',
    compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs sm:ml-3',
    styles.cta,
  );

  const handleStripeOnboard = async () => {
    setStripeLoading(true);
    try {
      await startStripeConnectOnboarding();
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border flex flex-col gap-2',
        compact ? 'px-2.5 py-2' : 'px-4 py-3',
        compact ? '' : 'sm:flex-row sm:items-center sm:justify-between',
        styles.card,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              'shrink-0 rounded-full',
              compact ? 'mt-1 h-1.5 w-1.5' : 'mt-1.5 h-2 w-2',
              styles.dot,
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <p
              className={cn(
                'font-semibold leading-snug',
                compact ? 'text-xs' : 'text-sm',
                styles.title,
              )}
            >
              {item.title}
            </p>
            {showDescription ? (
              <p
                className={cn(
                  'mt-0.5 leading-relaxed',
                  compact ? 'text-[11px]' : 'text-xs',
                  styles.desc,
                )}
              >
                {item.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {item.actionKind === 'stripe-onboard' ? (
        <button
          type="button"
          onClick={() => void handleStripeOnboard()}
          disabled={stripeLoading}
          className={cn(ctaClass, stripeLoading && 'opacity-70')}
        >
          {stripeLoading ? '…' : item.actionLabel}
        </button>
      ) : (
        <Link href={item.actionHref} className={ctaClass}>
          {item.actionLabel}
        </Link>
      )}
    </div>
  );
}

function shouldShowActionCenter(
  data: ActionCenterResponse | null,
  variant: UserActionCenterVariant,
  sellerScope: boolean,
): boolean {
  if (!data) return false;
  if (data.items.length > 0) return true;
  if (!data.healthy) return false;
  if (variant === 'mobileCompact') return false;
  if (sellerScope) {
    return Boolean(data.hasSellerProfile ?? data.roles?.hasSellerProfile);
  }
  return variant === 'sidebar' || variant === 'dashboard';
}

function resolveViewAllHref(
  data: ActionCenterResponse | null,
  override?: string,
): string {
  if (override) return override;
  const isSeller = Boolean(
    data?.hasSellerProfile ?? data?.roles?.hasSellerProfile,
  );
  return isSeller ? '/verkoper/dashboard' : '/notifications';
}

export default function UserActionCenter({
  variant = 'dashboard',
  className,
  apiEndpoint = '/api/user/action-center',
  viewAllHref,
}: Props) {
  const { tOr } = useTranslation();
  const [data, setData] = useState<ActionCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  const sellerScope = apiEndpoint === '/api/seller/action-center';
  const compact = variant !== 'dashboard';
  const showDescription = variant !== 'mobileCompact';
  const maxVisible = VARIANT_MAX[variant];

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) {
        setError(true);
        setData(null);
        return;
      }
      const json = (await res.json()) as ActionCenterResponse;
      setData(json);
      setError(false);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener('focus', onRefresh);
    window.addEventListener('notificationsUpdated', onRefresh);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void load();
    });
    return () => {
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('notificationsUpdated', onRefresh);
    };
  }, [load]);

  const title = tOr(
    'home.actionCenter.title',
    tOr('seller.actionCenter.title', 'Action required', 'Acties vereist'),
    'Acties vereist',
  );
  const subtitle = tOr(
    'home.actionCenter.subtitle',
    tOr(
      'seller.actionCenter.subtitle',
      'Items that need your attention',
      'Items die jouw aandacht nodig hebben',
    ),
    'Wat nu jouw aandacht vraagt',
  );
  const healthyTitle = tOr(
    'home.actionCenter.healthyTitle',
    tOr('seller.actionCenter.healthyTitle', 'Everything looks good', 'Alles ziet er goed uit'),
    'Alles ziet er goed uit',
  );
  const healthyDesc = tOr(
    'home.actionCenter.healthyDescription',
    tOr(
      'seller.actionCenter.healthyDescription',
      'Your account has no open actions right now.',
      'Je account heeft momenteel geen openstaande acties.',
    ),
    'Je hebt momenteel geen openstaande acties.',
  );
  const viewAllLabel = tOr(
    'home.actionCenter.viewAll',
    tOr('seller.actionCenter.viewAll', 'View all actions', 'Bekijk alle acties'),
    'Bekijk alle acties',
  );

  if (loading) {
    if (variant === 'mobileCompact') {
      return (
        <div
          className={cn(
            'animate-pulse rounded-xl border border-gray-200 bg-white px-3 py-2',
            className,
          )}
        >
          <div className="h-3 w-24 rounded bg-gray-200 mb-2" />
          <div className="h-10 rounded-lg bg-gray-100" />
        </div>
      );
    }
    if (variant === 'sidebar') {
      return (
        <div
          className={cn(
            'hc-dorpsplein-card animate-pulse px-3 py-3',
            className,
          )}
        >
          <div className="h-3 w-28 rounded bg-gray-200 mb-2" />
          <div className="h-12 rounded-lg bg-gray-100" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          'mb-4 animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm',
          className,
        )}
      >
        <div className="h-4 w-32 rounded bg-gray-200 mb-2" />
        <div className="h-3 w-48 rounded bg-gray-100 mb-4" />
        <div className="h-16 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error || !shouldShowActionCenter(data, variant, sellerScope)) {
    return null;
  }

  const items = data?.items ?? [];
  const { visible, hidden, hasMore } = partitionUserActionItems(items, maxVisible);
  const showHidden = expanded ? hidden : [];
  const allActionsHref = resolveViewAllHref(data, viewAllHref);

  if (data?.healthy || items.length === 0) {
    if (variant === 'sidebar') {
      return (
        <section
          className={cn(
            'hc-dorpsplein-card border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5',
            className,
          )}
          aria-label={title}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <p className="text-xs font-semibold text-emerald-950">{healthyTitle}</p>
          </div>
        </section>
      );
    }

    return (
      <section
        className={cn(
          'mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm',
          className,
        )}
        aria-label={title}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div>
            <h2 className="text-sm font-bold text-emerald-950">{healthyTitle}</h2>
            <p className="mt-0.5 text-xs text-emerald-900/80 leading-relaxed">
              {healthyDesc}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const shellClass =
    variant === 'sidebar'
      ? 'hc-dorpsplein-card px-3 py-3'
      : variant === 'mobileCompact'
        ? 'rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm'
        : 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm';

  return (
    <section
      className={cn(variant === 'dashboard' ? 'mb-4' : 'mb-0', shellClass, className)}
      aria-label={title}
    >
      <div className={cn('flex items-start gap-2', compact ? 'mb-2' : 'mb-3')}>
        <AlertCircle
          className={cn(
            'shrink-0 text-amber-600',
            compact ? 'mt-0.5 h-3.5 w-3.5' : 'mt-0.5 h-4 w-4',
          )}
          aria-hidden
        />
        <div>
          <h2 className={cn('font-bold text-gray-900', compact ? 'text-xs' : 'text-sm')}>
            {title}
          </h2>
          {variant === 'dashboard' ? (
            <p className="text-xs text-gray-600">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
        {[...visible, ...showHidden].map((item) => (
          <ActionRow
            key={item.id}
            item={item}
            compact={compact}
            showDescription={showDescription}
          />
        ))}
      </div>

      {hasMore ? (
        expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-semibold text-secondary-brand hover:text-secondary-700"
          >
            <ChevronUp className="h-3 w-3" aria-hidden />
            {tOr('home.actionCenter.showLess', 'Show less', 'Minder tonen')}
          </button>
        ) : (
          <Link
            href={allActionsHref}
            className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-semibold text-secondary-brand hover:text-secondary-700"
          >
            <ChevronDown className="h-3 w-3" aria-hidden />
            {viewAllLabel}
          </Link>
        )
      ) : null}
    </section>
  );
}
