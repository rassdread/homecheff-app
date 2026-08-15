import { notFound, redirect } from 'next/navigation';
import ListingDetailPage from '@/components/product/ListingDetailPage';
import { loadListingDetailCached } from '@/lib/marketplace/detail/load-listing-detail-cached';
import {
  buildProductDetailPath,
  isBareProductUuidParam,
  resolveProductIdFromParam,
} from '@/lib/seo/productSlug';
import { buildListingDetailPath } from '@/lib/seo/listing-routes';
import { isRequestListing } from '@/lib/marketplace/product-visibility';

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * Server page: load critical listing payload in RSC, hydrate client UI.
 * Reviews / owner checks remain client-deferred.
 *
 * Public SEO redirects (bare UUID → slug, REQUEST → /request) live HERE only.
 * Shared product layout also wraps `/edit` and must not strip that segment.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const raw = typeof resolved?.id === 'string' ? resolved.id : '';
  const id = resolveProductIdFromParam(raw);
  if (!id) notFound();

  const initialData = await loadListingDetailCached(id);
  if (!initialData) notFound();

  const product = initialData.product;
  if (product?.isActive && isRequestListing(product as any)) {
    redirect(
      buildListingDetailPath(
        'request',
        product.title,
        product.seller?.User?.place ?? null,
        product.id,
      ),
    );
  }

  if (
    product?.isActive &&
    isBareProductUuidParam(raw) &&
    product.title &&
    product.id
  ) {
    redirect(
      buildProductDetailPath(
        product.title,
        product.seller?.User?.place ?? null,
        product.id,
      ),
    );
  }

  // Inactive public products: still show controlled unavailable via client if needed;
  // feed only surfaces active. Keep payload for owners/deep links.
  return <ListingDetailPage initialData={initialData} />;
}
