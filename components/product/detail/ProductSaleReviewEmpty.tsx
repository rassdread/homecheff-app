'use client';

import { useProductStoryCopy } from '@/components/product/detail/ProductSaleAboutSection';

type ProductShape = {
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags?: string[] | null;
  delivery?: string | null;
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  sellerCanDeliver?: boolean | null;
  deliveryRadiusKm?: number | null;
  orderMethod?: string | null;
  priceCents?: number | null;
  stock?: number | null;
  seller?: {
    lat?: number | null;
    lng?: number | null;
    User?: {
      place?: string | null;
      city?: string | null;
      lat?: number | null;
      lng?: number | null;
    } | null;
  } | null;
};

type Props = {
  product: ProductShape;
  sellerName: string;
  categoryLabel?: string;
  stats: {
    reviewCount: number;
    averageRating: number;
    orderCount: number;
  };
  checkoutAvailable: boolean;
  isBusiness?: boolean;
  companyName?: string | null;
  sellerBadgeCount?: number;
};

export default function ProductSaleReviewEmpty({
  product,
  sellerName,
  categoryLabel,
  stats,
  checkoutAvailable,
  isBusiness,
  companyName,
  sellerBadgeCount = 0,
}: Props) {
  const { emptyReview } = useProductStoryCopy({
    product,
    sellerName,
    categoryLabel,
    stats,
    checkoutAvailable,
    isBusiness,
    companyName,
    sellerBadgeCount,
  });

  return (
    <div className="mb-4 space-y-1 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
      <p className="text-sm font-medium text-gray-800">{emptyReview.primary}</p>
      {emptyReview.secondary ? (
        <p className="text-sm text-gray-600">{emptyReview.secondary}</p>
      ) : null}
    </div>
  );
}
