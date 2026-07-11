import { notFound } from 'next/navigation';
import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { OPEN_KNOWLEDGE_SOURCES } from '@/lib/i18n/openKnowledgeSources';
import {
  OPEN_KNOWLEDGE_DOC_BLOCKS,
  OPEN_KNOWLEDGE_DOC_SLUGS,
  isOpenKnowledgeDocSlug,
  openKnowledgeDocNamespace,
  openKnowledgeDocPath,
  type OpenKnowledgeDocSlug,
} from '@/lib/open-knowledge/docs-registry';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return OPEN_KNOWLEDGE_DOC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!isOpenKnowledgeDocSlug(slug)) return { title: 'HomeCheff', robots: { index: false } };
  return buildAuthorityPageMetadata(openKnowledgeDocPath(slug), openKnowledgeDocNamespace(slug));
}

function docMeta(slug: OpenKnowledgeDocSlug) {
  const ns = openKnowledgeDocNamespace(slug);
  const src = OPEN_KNOWLEDGE_SOURCES[ns];
  return {
    headline: src?.title?.nl ?? slug,
    description: src?.metaDescription?.nl ?? '',
  };
}

export default async function OpenKnowledgeDocPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isOpenKnowledgeDocSlug(slug)) notFound();

  const path = openKnowledgeDocPath(slug);
  const ns = openKnowledgeDocNamespace(slug);
  const meta = docMeta(slug);

  return (
    <>
      <OpenKnowledgeJsonLd
        kind="techArticle"
        path={path}
        headline={meta.headline}
        description={meta.description}
      />
      <AuthorityLandingPage
        ns={ns}
        blocks={OPEN_KNOWLEDGE_DOC_BLOCKS[slug]}
        path={path}
        breadcrumbTrail={[
          { labelKey: 'linkDocsHub', path: '/docs', ns: 'openKnowledgeShared' },
        ]}
      />
    </>
  );
}
