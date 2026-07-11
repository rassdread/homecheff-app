import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { openKnowledgeTrust } from '@/lib/i18n/openKnowledgeSources';
import {
  OPEN_KNOWLEDGE_STANDALONE_PATHS,
} from '@/lib/open-knowledge/docs-registry';
import {
  OPEN_KNOWLEDGE_TRUST_NAMESPACE,
  TRUST_PAGE_BLOCKS,
} from '@/lib/open-knowledge/open-knowledge-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(
    OPEN_KNOWLEDGE_STANDALONE_PATHS.trust,
    OPEN_KNOWLEDGE_TRUST_NAMESPACE,
  );
}

export default function TrustPage() {
  return (
    <>
      <OpenKnowledgeJsonLd
        kind="techArticle"
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.trust}
        headline={openKnowledgeTrust.title.nl}
        description={openKnowledgeTrust.metaDescription.nl}
      />
      <AuthorityLandingPage
        ns={OPEN_KNOWLEDGE_TRUST_NAMESPACE}
        blocks={TRUST_PAGE_BLOCKS}
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.trust}
      />
    </>
  );
}
