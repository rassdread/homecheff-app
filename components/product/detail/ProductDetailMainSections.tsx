'use client';

import type { ReactNode } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  buildDetailUiSectionPlan,
  isDetailUiSectionVisible,
  listingKindToDetailKind,
} from '@/lib/marketplace/detail';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import ProductSaleAboutSection from '@/components/product/detail/ProductSaleAboutSection';
import ProductValueExchangeSection from '@/components/product/detail/ProductValueExchangeSection';
import ProductDetailAcceptedValuesSection from '@/components/product/detail/ProductDetailAcceptedValuesSection';
import ProductDetailConditionsSection from '@/components/product/detail/ProductDetailConditionsSection';
import ProductDetailTrustBlock from '@/components/product/detail/ProductDetailTrustBlock';
import ProductSaleDomainStory from '@/components/product/detail/ProductSaleDomainStory';
import type { ProductInspirationLink } from '@/components/product/detail/ProductInspirationLinkCard';
import type { ProductSaleDishInfo } from '@/components/product/detail/ProductSaleDomainStory';
import {
  ExchangeSuggestionsDetailBlock,
  ExchangeSuggestionsMobileModule,
} from '@/components/marketplace/exchange-suggestions';

type ProductShape = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  orderMethod?: string;
  barterOpenness?: string | null;
  priceModel?: string | null;
  acceptedSpecializations?: string[];
  specializations?: string[];
  marketplaceCategory?: MarketplaceCategory | null;
  subcategory?: string | null;
  listingIntent?: string | null;
  category?: string | null;
  delivery?: string | null;
  pickupAddress?: string | null;
  sellerCanDeliver?: boolean;
  deliveryRadiusKm?: number | null;
  seller?: {
    User?: {
      place?: string | null;
      city?: string | null;
    };
  } | null;
};

type Props = {
  product: ProductShape;
  trust: DiscoveryTrustContract;
  sellerName: string;
  categoryLabel: string;
  stats: {
    reviewCount: number;
    averageRating: number;
    orderCount: number;
    favoriteCount: number;
  };
  checkoutAvailable: boolean;
  isBusiness: boolean;
  companyName: string | null;
  sellerBadgeCount: number;
  availableStock: number | null;
  dishInfo: ProductSaleDishInfo;
  linkedInspiration: ProductInspirationLink | null;
  /** Desktop: hide sections duplicated in sidebar. */
  variant?: 'main' | 'mobile_stack';
  childrenAfterDescription?: ReactNode;
};

export default function ProductDetailMainSections({
  product,
  trust,
  sellerName,
  categoryLabel,
  stats,
  checkoutAvailable,
  isBusiness,
  companyName,
  sellerBadgeCount,
  availableStock,
  dishInfo,
  linkedInspiration,
  variant = 'main',
  childrenAfterDescription,
}: Props) {
  const { listingKind } = deriveListingKind({
    listingIntent: product.listingIntent,
    marketplaceCategory: product.marketplaceCategory,
    specializations: product.specializations,
    subcategory: product.subcategory,
    category: product.category,
  });

  const detailKind = listingKindToDetailKind(listingKind) ?? 'PRODUCT';
  const sectionPlan = buildDetailUiSectionPlan(detailKind);
  const placeLabel =
    product.seller?.User?.place?.trim() ||
    product.seller?.User?.city?.trim() ||
    null;

  const show = (id: Parameters<typeof isDetailUiSectionVisible>[1]) =>
    isDetailUiSectionVisible(sectionPlan, id);

  const hideOnDesktopSidebar =
    variant === 'main'
      ? 'lg:hidden'
      : '';

  return (
    <div className="space-y-6" data-detail-main-sections={variant}>
      {show('description') ? (
        <ProductSaleAboutSection
          product={product}
          sellerName={sellerName}
          categoryLabel={categoryLabel}
          stats={stats}
          checkoutAvailable={checkoutAvailable}
          isBusiness={isBusiness}
          companyName={companyName}
          sellerBadgeCount={sellerBadgeCount}
        />
      ) : null}

      {childrenAfterDescription}

      {show('value_exchange') ? (
        <ProductValueExchangeSection
          className={hideOnDesktopSidebar}
          barterOpenness={product.barterOpenness}
          priceModel={product.priceModel}
          acceptedSpecializations={product.acceptedSpecializations}
          specializations={product.specializations}
          marketplaceCategory={product.marketplaceCategory}
          subcategory={product.subcategory}
          listingIntent={product.listingIntent}
          category={product.category}
          listingTitle={product.title}
        />
      ) : null}

      {show('accepted_values') ? (
        <ProductDetailAcceptedValuesSection
          acceptedSpecializations={product.acceptedSpecializations}
          marketplaceCategory={product.marketplaceCategory}
          listingIntent={product.listingIntent}
          specializations={product.specializations}
          subcategory={product.subcategory}
          category={product.category}
        />
      ) : null}

      {show('conditions') ? (
        <ProductDetailConditionsSection
          delivery={product.delivery}
          sellerCanDeliver={product.sellerCanDeliver}
          deliveryRadiusKm={product.deliveryRadiusKm}
          pickupAddress={product.pickupAddress}
          placeLabel={placeLabel}
          availableStock={availableStock}
        />
      ) : null}

      {show('trust_block') ? (
        <ProductDetailTrustBlock
          className={hideOnDesktopSidebar}
          trust={trust}
          listingKind={listingKind as ListingKind}
        />
      ) : null}

      {show('exchange_suggestions') ? (
        <>
          <div className="lg:hidden">
            <ExchangeSuggestionsMobileModule context="detail" listingId={product.id} />
          </div>
          <div className="hidden lg:block">
            <ExchangeSuggestionsDetailBlock listingId={product.id} />
          </div>
        </>
      ) : null}

      <ProductSaleDomainStory
        dishInfo={dishInfo}
        inspirationLink={linkedInspiration}
      />
    </div>
  );
}
