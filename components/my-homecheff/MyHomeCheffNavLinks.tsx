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

type Props = {
  user: Record<string, unknown> | null;
  rowClassName: string;
  onNavigate?: () => void;
  /** Show only hub-priority items (mobile compact block) */
  priorityOnly?: boolean;
};

export default function MyHomeCheffNavLinks({
  user,
  rowClassName,
  onNavigate,
  priorityOnly = false,
}: Props) {
  const { t } = useTranslation();
  const ctx = settingsHubContextFromSessionUser(user);
  if (!ctx) return null;

  const items = listMyHomeCheffNavItems(ctx).filter((item) => {
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
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </>
  );
}
