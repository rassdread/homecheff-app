import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { openKnowledgeChangelog } from '@/lib/i18n/openKnowledgeSources';
import { OPEN_KNOWLEDGE_STANDALONE_PATHS } from '@/lib/open-knowledge/docs-registry';
import {
  CHANGELOG_PAGE_BLOCKS,
  OPEN_KNOWLEDGE_CHANGELOG_NAMESPACE,
} from '@/lib/open-knowledge/open-knowledge-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(
    OPEN_KNOWLEDGE_STANDALONE_PATHS.changelog,
    OPEN_KNOWLEDGE_CHANGELOG_NAMESPACE,
  );
}

export default function ChangelogPage() {
  return (
    <>
      <OpenKnowledgeJsonLd
        kind="techArticle"
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.changelog}
        headline={openKnowledgeChangelog.title.nl}
        description={openKnowledgeChangelog.metaDescription.nl}
      />
      <AuthorityLandingPage
        ns={OPEN_KNOWLEDGE_CHANGELOG_NAMESPACE}
        blocks={CHANGELOG_PAGE_BLOCKS}
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.changelog}
      />
    </>
  );
}
