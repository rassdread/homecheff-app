import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { openKnowledgeGlossary } from '@/lib/i18n/openKnowledgeSources';
import { OPEN_KNOWLEDGE_STANDALONE_PATHS } from '@/lib/open-knowledge/docs-registry';
import { GLOSSARY_TERMS, OPEN_KNOWLEDGE_GLOSSARY_NAMESPACE } from '@/lib/open-knowledge/glossary-terms';
import {
  GLOSSARY_PAGE_BLOCKS,
} from '@/lib/open-knowledge/open-knowledge-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(
    OPEN_KNOWLEDGE_STANDALONE_PATHS.glossary,
    OPEN_KNOWLEDGE_GLOSSARY_NAMESPACE,
  );
}

const glossarySchemaTerms = GLOSSARY_TERMS.map((term) => ({
  name: openKnowledgeGlossary[term.termKey]?.nl ?? term.termKey,
  description: [
    openKnowledgeGlossary[term.shortKey]?.nl,
    openKnowledgeGlossary[term.longKey]?.nl,
  ]
    .filter(Boolean)
    .join(' — '),
}));

export default function GlossaryPage() {
  return (
    <>
      <OpenKnowledgeJsonLd
        kind="definedTermSet"
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.glossary}
        headline={openKnowledgeGlossary.title.nl}
        description={openKnowledgeGlossary.metaDescription.nl}
        terms={glossarySchemaTerms}
      />
      <AuthorityLandingPage
        ns={OPEN_KNOWLEDGE_GLOSSARY_NAMESPACE}
        blocks={GLOSSARY_PAGE_BLOCKS}
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.glossary}
      />
    </>
  );
}
