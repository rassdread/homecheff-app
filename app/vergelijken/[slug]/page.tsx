import { notFound } from 'next/navigation';
import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import {
  COMPARISON_LANDING_BLOCKS,
  COMPARISON_PAGE_REGISTRY,
  getComparisonBySlug,
} from '@/lib/seo/comparison-pages';

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISON_PAGE_REGISTRY.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const page = getComparisonBySlug(params.slug);
  if (!page) return { title: 'HomeCheff' };
  return buildAuthorityPageMetadata(page.path, page.namespace);
}

export default function ComparisonSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = getComparisonBySlug(params.slug);
  if (!page) notFound();

  const blocks = COMPARISON_LANDING_BLOCKS[page.namespace];

  return (
    <AuthorityLandingPage
      ns={page.namespace}
      blocks={blocks}
      path={page.path}
    />
  );
}
