'use client';

import FavoriteButton from '@/components/favorite/FavoriteButton';
import ShareButton from '@/components/ui/ShareButton';
import ProductDetailLocality from '@/components/product/detail/ProductDetailLocality';
import ProductDetailDelivery from '@/components/product/detail/ProductDetailDelivery';
import ProductMakerTrustStrip from '@/components/product/detail/ProductMakerTrustStrip';
import ProductDetailTags from '@/components/product/detail/ProductDetailTags';
import ProductSalePrimaryActions from '@/components/product/detail/ProductSalePrimaryActions';
import ProductSaleCommerceTrustLine from '@/components/product/detail/ProductSaleCommerceTrustLine';
import ProductSaleSecondaryContact from '@/components/product/detail/ProductSaleSecondaryContact';
import { useProductStoryCopy } from '@/components/product/detail/ProductSaleAboutSection';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import type { UserBadgeChipItem } from '@/components/gamification/UserBadgeChips';
import {
  formatProductPriceLabel,
  hasPublicDisplayPrice,
  isContactOnlyProduct,
} from '@/lib/product/order-method';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import type { PublicPaymentStatus } from '@/lib/stripe/seller-payment-status';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type ProductShape = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  orderMethod?: ProductOrderMethodValue;
  category?: string;
  subcategory?: string;
  tags?: string[];
  delivery?: 'PICKUP' | 'DELIVERY' | 'BOTH';
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  sellerCanDeliver?: boolean;
  deliveryRadiusKm?: number | null;
  stock?: number | null;
  maxStock?: number | null;
  image?: string | null;
  seller?: {
    lat?: number | null;
    lng?: number | null;
    User?: {
      id?: string;
      name?: string | null;
      username?: string | null;
      avatar?: string | null;
      profileImage?: string | null;
      image?: string | null;
      displayFullName?: boolean | null;
      displayNameOption?: string | null;
      place?: string | null;
      city?: string | null;
      lat?: number | null;
      lng?: number | null;
    };
  } | null;
};

type Props = {
  product: ProductShape;
  theme: {
    badge: string;
    label: string;
    gradient: string;
  };
  categoryIcon: LucideIcon;
  stats: {
    reviewCount: number;
    averageRating: number;
    orderCount: number;
    favoriteCount: number;
  };
  sellerBadges: UserBadgeChipItem[];
  isBusiness: boolean;
  companyName: string | null;
  profileViewerCoords: { lat?: number | null; lng?: number | null } | null;
  sellerName: string;
  quantity: number;
  availableStock: number | null;
  isOwner: boolean;
  checkoutAvailable: boolean;
  paymentStatus?: PublicPaymentStatus | null;
  publicContactChannels: PublicContactChannel[];
  carouselImageUrl?: string | null;
  shareUrl: string;
  sellerBadgeCount?: number;
  onQuantityChange: (n: number) => void;
  onAddedToCart?: () => void;
  className?: string;
};

export default function ProductSaleCommerceZone({
  product,
  theme,
  categoryIcon: CategoryIcon,
  stats,
  sellerBadges,
  isBusiness,
  companyName,
  profileViewerCoords,
  sellerName,
  quantity,
  availableStock,
  isOwner,
  checkoutAvailable,
  paymentStatus,
  publicContactChannels,
  carouselImageUrl,
  shareUrl,
  sellerBadgeCount = 0,
  onQuantityChange,
  onAddedToCart,
  className,
}: Props) {
  const { t } = useTranslation();
  const { summary, makerLine } = useProductStoryCopy({
    product,
    sellerName,
    categoryLabel: theme.label,
    stats,
    checkoutAvailable,
    isBusiness,
    companyName,
    sellerBadgeCount,
  });

  const showQuantity =
    !isContactOnlyProduct(product) &&
    !isOwner &&
    availableStock !== null &&
    availableStock > 0;

  const stockBadge = (() => {
    if (availableStock === null) return null;
    if (availableStock === 0) {
      return (
        <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
          Uitverkocht
        </span>
      );
    }
    if (availableStock <= 5) {
      return (
        <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
          Nog {availableStock} beschikbaar
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        {availableStock} op voorraad
      </span>
    );
  })();

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:gap-4 sm:p-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            theme.badge,
          )}
        >
          <CategoryIcon className="h-3.5 w-3.5" aria-hidden />
          {theme.label}
        </span>
        {stockBadge}
      </div>

      <div>
        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
          {product.title}
        </h1>
        {summary ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
            {summary}
          </p>
        ) : null}
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('productOrder.priceLabel')}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <div
            className={cn(
              'font-bold text-gray-900',
              hasPublicDisplayPrice(product) ? 'text-3xl sm:text-4xl' : 'text-xl',
            )}
          >
            {formatProductPriceLabel(product, t)}
          </div>
          {isContactOnlyProduct(product) ? (
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {t('productOrder.badgeContactOnly')}
            </span>
          ) : null}
        </div>
        {!isContactOnlyProduct(product) ? (
          <p className="mt-0.5 text-xs text-gray-500">{t('productOrder.priceIncludesVat')}</p>
        ) : (
          <p className="mt-1 text-sm text-gray-600">{t('productOrder.buyerContactIntro')}</p>
        )}
      </div>

      {showQuantity ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            {t('productOrder.quantityLabel')}
          </label>
          <select
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="w-full max-w-[8rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
          >
            {Array.from({ length: Math.min(10, availableStock || 10) }, (_, i) => i + 1).map(
              (num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ),
            )}
          </select>
        </div>
      ) : null}

      <ProductDetailLocality
        pickupAddress={product.pickupAddress}
        pickupLat={product.pickupLat}
        pickupLng={product.pickupLng}
        seller={product.seller}
        profileViewerCoords={profileViewerCoords}
      />

      <ProductDetailDelivery
        delivery={product.delivery}
        sellerCanDeliver={product.sellerCanDeliver}
        deliveryRadiusKm={product.deliveryRadiusKm}
        orderMethod={product.orderMethod}
        className="!mt-0 space-y-1.5"
      />

      <ProductSaleCommerceTrustLine
        product={product}
        sellerName={sellerName}
        stats={stats}
        checkoutAvailable={checkoutAvailable}
        isBusiness={isBusiness}
        companyName={companyName}
        sellerBadgeCount={sellerBadges.length}
        sellerUserId={product.seller?.User?.id ?? null}
      />

      <ProductSalePrimaryActions
        product={product}
        carouselImageUrl={carouselImageUrl}
        sellerName={sellerName}
        quantity={quantity}
        availableStock={availableStock}
        isOwner={isOwner}
        checkoutAvailable={checkoutAvailable}
        paymentStatus={paymentStatus}
        publicContactChannels={publicContactChannels}
        onAdded={onAddedToCart}
      />

      <ProductSaleSecondaryContact
        product={product}
        sellerName={sellerName}
        publicContactChannels={publicContactChannels}
      />

      <ProductMakerTrustStrip
        sellerUser={product.seller?.User}
        sellerBadges={sellerBadges}
        isBusiness={isBusiness}
        companyName={companyName}
        makerLine={makerLine}
        productStats={{
          reviewCount: stats.reviewCount,
          averageRating: stats.averageRating,
          orderCount: stats.orderCount,
          favoriteCount: stats.favoriteCount,
        }}
      />

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
        <ProductDetailTags tags={product.tags} subcategory={product.subcategory} />
        {!isOwner ? (
          <div className="flex items-center gap-2">
            <FavoriteButton
              productId={product.id}
              productTitle={product.title}
              size="sm"
              variant="button"
            />
            <ShareButton
              url={shareUrl}
              title={product.title}
              description={product.description || ''}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
