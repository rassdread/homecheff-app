import { notFound } from 'next/navigation';
import ListingDetailPage from '@/components/product/ListingDetailPage';
import { loadListingDetailCached } from '@/lib/marketplace/detail/load-listing-detail-cached';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

/** Request/listing alias — same server-first critical payload as /product/[id]. */
export default async function RequestDetailPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const raw = typeof resolved?.slug === 'string' ? resolved.slug : '';
  const id = resolveProductIdFromParam(raw);
  if (!id) notFound();

  const initialData = await loadListingDetailCached(id);
  if (!initialData) notFound();

  return <ListingDetailPage initialData={initialData} />;
}
