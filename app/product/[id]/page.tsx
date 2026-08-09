import { notFound } from 'next/navigation';
import ListingDetailPage from '@/components/product/ListingDetailPage';
import { loadListingDetailCached } from '@/lib/marketplace/detail/load-listing-detail-cached';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * Server page: load critical listing payload in RSC, hydrate client UI.
 * Reviews / owner checks remain client-deferred.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const raw = typeof resolved?.id === 'string' ? resolved.id : '';
  const id = resolveProductIdFromParam(raw);
  if (!id) notFound();

  const initialData = await loadListingDetailCached(id);
  if (!initialData) notFound();

  // Inactive public products: still show controlled unavailable via client if needed;
  // feed only surfaces active. Keep payload for owners/deep links.
  return <ListingDetailPage initialData={initialData} />;
}
