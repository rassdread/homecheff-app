'use client';

import Link from 'next/link';
import {
  ECOSYSTEM_HUB_HREF,
  ECOSYSTEM_HUB_LABEL,
  ECOSYSTEM_PRODUCTS,
  ecosystemProductHref,
  type EcosystemNavSurface,
  type EcosystemProductId,
} from '@/lib/ecosystem-navigation/contract';
import { trackEcosystemProductClick } from '@/lib/ecosystem-navigation/analytics';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Palette,
  Rocket,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';

const PRODUCT_ICONS: Record<EcosystemProductId, LucideIcon> = {
  homecheff: Store,
  studio: Palette,
  growth: Rocket,
  affiliate: Users,
};

type Props = {
  currentProduct: EcosystemProductId;
  authenticated: boolean;
  surface: EcosystemNavSurface;
  rowClassName: string;
  onNavigate?: () => void;
};

/**
 * Account-menu ecosystem switcher — every row is icon + visible text label.
 */
export function EcosystemAccountNavLinks({
  currentProduct,
  authenticated,
  surface,
  rowClassName,
  onNavigate,
}: Props) {
  const { t, language } = useTranslation();
  const isNl = language === 'nl';

  const labelForProduct = (id: EcosystemProductId, compactName: string) => {
    if (id === 'homecheff') {
      return tOr(t, 'myHomeCheffHub.modules.marketplace.title', 'HomeCheff Marketplace', 'HomeCheff Marketplace', isNl);
    }
    if (id === 'studio') {
      return tOr(t, 'myHomeCheffHub.modules.studio.title', 'HomeCheff Studio', 'HomeCheff Studio', isNl);
    }
    if (id === 'growth') {
      return tOr(t, 'myHomeCheffHub.modules.growth.title', 'HomeCheff Growth', 'HomeCheff Growth', isNl);
    }
    if (id === 'affiliate') {
      return tOr(t, 'myHomeCheffHub.modules.affiliate.title', 'HomeCheff Affiliate', 'HomeCheff Affiliate', isNl);
    }
    return compactName;
  };

  return (
    <div className="py-1" role="group" aria-label={isNl ? 'HomeCheff onderdelen' : 'HomeCheff modules'}>
      {authenticated ? (
        <Link
          href={ECOSYSTEM_HUB_HREF}
          prefetch={false}
          className={cn(rowClassName, 'font-semibold text-emerald-900 hover:bg-emerald-50')}
          onClick={onNavigate}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {tOr(t, 'myHomeCheffHub.nav.hub', ECOSYSTEM_HUB_LABEL, ECOSYSTEM_HUB_LABEL, isNl)}
          </span>
        </Link>
      ) : null}

      {ECOSYSTEM_PRODUCTS.map((product) => {
        const Icon = PRODUCT_ICONS[product.id];
        const isCurrent = product.id === currentProduct;
        const href = ecosystemProductHref(product, surface);
        const label = labelForProduct(product.id, product.compactName);

        if (isCurrent) {
          return (
            <div
              key={product.id}
              className={cn(
                rowClassName,
                'cursor-default bg-emerald-50/80 text-emerald-950',
              )}
              aria-current="page"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                {isNl ? 'Huidig' : 'Current'}
              </span>
            </div>
          );
        }

        return (
          <a
            key={product.id}
            href={href}
            className={rowClassName}
            onClick={() => {
              trackEcosystemProductClick({
                sourceProduct: currentProduct,
                targetProduct: product.id,
                authenticated,
                surface,
              });
              onNavigate?.();
            }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </a>
        );
      })}
    </div>
  );
}

function tOr(
  t: (key: string) => string,
  key: string,
  fallbackEn: string,
  fallbackNl: string,
  isNl: boolean,
): string {
  const value = t(key);
  if (value.trim()) return value;
  return isNl ? fallbackNl : fallbackEn;
}
