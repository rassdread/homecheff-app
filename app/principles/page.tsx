import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { openKnowledgePrinciples } from '@/lib/i18n/openKnowledgeSources';
import { OPEN_KNOWLEDGE_STANDALONE_PATHS } from '@/lib/open-knowledge/docs-registry';
import {
  OPEN_KNOWLEDGE_PRINCIPLES_NAMESPACE,
  PRINCIPLES_PAGE_BLOCKS,
} from '@/lib/open-knowledge/open-knowledge-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(
    OPEN_KNOWLEDGE_STANDALONE_PATHS.principles,
    OPEN_KNOWLEDGE_PRINCIPLES_NAMESPACE,
  );
}

export default function PrinciplesPage() {
  return (
    <>
      <OpenKnowledgeJsonLd
        kind="techArticle"
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.principles}
        headline={openKnowledgePrinciples.title.nl}
        description={openKnowledgePrinciples.metaDescription.nl}
      />
      <AuthorityLandingPage
        ns={OPEN_KNOWLEDGE_PRINCIPLES_NAMESPACE}
        blocks={PRINCIPLES_PAGE_BLOCKS}
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.principles}
      />
    </>
  );
}
