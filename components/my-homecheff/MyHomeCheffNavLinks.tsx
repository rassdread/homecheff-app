'use client';

import Link from 'next/link';
import {
  LayoutGrid,
  Package,
  Settings,
  Store,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import {
  listMyHomeCheffNavItems,
  MY_HOMECHEFF_HUB_PATH,
  settingsHubContextFromSessionUser,
} from '@/lib/navigation/my-homecheff-hub';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

const NAV_ICONS: Record<string, typeof Package> = {
  hub: LayoutGrid,
  orders: Package,
  seller: Store,
  affiliate: Users,
  delivery: Truck,
  earnings: TrendingUp,
  settings: Settings,
};

const NAV_LABEL_FALLBACKS: Record<string, { nl: string; en: string }> = {
  'myHomeCheffHub.nav.hub': { nl: 'Mijn HomeCheff', en: 'My HomeCheff' },
  'myHomeCheffHub.nav.orders': { nl: 'Mijn bestellingen', en: 'My orders' },
  'myHomeCheffHub.nav.seller': { nl: 'Verkopen', en: 'Selling' },
  'myHomeCheffHub.nav.affiliate': { nl: 'Affiliate', en: 'Affiliate' },
  'myHomeCheffHub.nav.delivery': { nl: 'Bezorging', en: 'Delivery' },
  'myHomeCheffHub.nav.earnings': { nl: 'Verdiensten', en: 'Earnings' },
  'myHomeCheffHub.nav.settings': { nl: 'Instellingen', en: 'Settings' },
};

function resolveNavLabel(
  t: (key: string) => string,
  labelKey: string,
  language: string,
): string {
  const translated = t(labelKey);
  if (translated.trim()) return translated;
  const fb = NAV_LABEL_FALLBACKS[labelKey];
  if (!fb) return labelKey;
  return language === 'en' ? fb.en : fb.nl;
}

type Props = {
  user: Record<string, unknown> | null;
  rowClassName: string;
  onNavigate?: () => void;
  /** Show only hub-priority items (mobile compact block) */
  priorityOnly?: boolean;
  /** Hide items already shown in ecosystem account block */
  excludeIds?: string[];
};

export default function MyHomeCheffNavLinks({
  user,
  rowClassName,
  onNavigate,
  priorityOnly = false,
  excludeIds = [],
}: Props) {
  const { t, language } = useTranslation();
  const ctx = settingsHubContextFromSessionUser(user);
  if (!ctx) return null;

  const exclude = new Set(excludeIds);
  const items = listMyHomeCheffNavItems(ctx).filter((item) => {
    if (exclude.has(item.id)) return false;
    if (!priorityOnly) return true;
    return ['hub', 'orders', 'seller', 'affiliate', 'delivery', 'earnings', 'settings'].includes(
      item.id,
    );
  });

  return (
    <>
      {items.map((item) => {
        const Icon = NAV_ICONS[item.id] ?? LayoutGrid;
        const isHub = item.href === MY_HOMECHEFF_HUB_PATH;
        const label = resolveNavLabel(t, item.labelKey, language);
        return (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            className={cn(
              rowClassName,
              item.highlight &&
                'text-emerald-800 font-semibold hover:bg-emerald-50',
              isHub && 'bg-emerald-50/60',
            )}
            onClick={onNavigate}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
