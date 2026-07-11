import Script from 'next/script';
import { cookies, headers } from 'next/headers';
import {
  buildCollectionPageJsonLd,
  buildDefinedTermSetJsonLd,
  buildTechArticleJsonLd,
} from '@/lib/seo/schema-builders';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';
import { OPEN_KNOWLEDGE_LAST_REVIEWED } from '@/lib/open-knowledge/docs-registry';

export type OpenKnowledgeSchemaKind = 'techArticle' | 'collectionPage' | 'definedTermSet';

type BaseProps = {
  kind: OpenKnowledgeSchemaKind;
  path: string;
  headline: string;
  description: string;
};

type CollectionProps = BaseProps & {
  kind: 'collectionPage';
  hasPart: Array<{ name: string; url: string }>;
};

type DefinedTermSetProps = BaseProps & {
  kind: 'definedTermSet';
  terms: Array<{ name: string; description: string }>;
};

type TechArticleProps = BaseProps & {
  kind: 'techArticle';
};

type Props = CollectionProps | DefinedTermSetProps | TechArticleProps;

async function resolveLang(): Promise<'nl' | 'en'> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');
  if (languageHeader === 'nl' || languageHeader === 'en') return languageHeader;
  if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    return languageCookie.value as 'nl' | 'en';
  }
  return 'nl';
}

export default async function OpenKnowledgeJsonLd(props: Props) {
  const lang = await resolveLang();
  const domain = MAIN_DOMAIN;
  const id = `open-knowledge-ld-${props.path.replace(/\//g, '-')}`;

  let jsonLd: Record<string, unknown>;

  if (props.kind === 'collectionPage') {
    jsonLd = buildCollectionPageJsonLd({
      domain,
      lang,
      path: props.path,
      name: props.headline,
      description: props.description,
      dateModified: OPEN_KNOWLEDGE_LAST_REVIEWED,
      hasPart: props.hasPart,
    });
  } else if (props.kind === 'definedTermSet') {
    jsonLd = buildDefinedTermSetJsonLd({
      domain,
      lang,
      path: props.path,
      name: props.headline,
      description: props.description,
      dateModified: OPEN_KNOWLEDGE_LAST_REVIEWED,
      terms: props.terms,
    });
  } else {
    jsonLd = buildTechArticleJsonLd({
      domain,
      lang,
      path: props.path,
      headline: props.headline,
      description: props.description,
      dateModified: OPEN_KNOWLEDGE_LAST_REVIEWED,
    });
  }

  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
