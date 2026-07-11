import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import {
  DOCS_HUB_BLOCKS,
  OPEN_KNOWLEDGE_HUB_NAMESPACE,
} from '@/lib/open-knowledge/open-knowledge-blocks';
import {
  OPEN_KNOWLEDGE_DOC_SLUGS,
  OPEN_KNOWLEDGE_STANDALONE_PATHS,
  openKnowledgeDocPath,
} from '@/lib/open-knowledge/docs-registry';
import { openKnowledgeHub } from '@/lib/i18n/openKnowledgeSources';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(
    OPEN_KNOWLEDGE_STANDALONE_PATHS.hub,
    OPEN_KNOWLEDGE_HUB_NAMESPACE,
  );
}

export default function DocsHubPage() {
  const hasPart = OPEN_KNOWLEDGE_DOC_SLUGS.map((slug) => ({
    name: slug,
    url: openKnowledgeDocPath(slug),
  }));

  return (
    <>
      <OpenKnowledgeJsonLd
        kind="collectionPage"
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.hub}
        headline={openKnowledgeHub.title.nl}
        description={openKnowledgeHub.metaDescription.nl}
        hasPart={hasPart}
      />
      <AuthorityLandingPage
        ns={OPEN_KNOWLEDGE_HUB_NAMESPACE}
        blocks={DOCS_HUB_BLOCKS}
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.hub}
      />
    </>
  );
}
