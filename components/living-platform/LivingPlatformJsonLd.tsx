import Script from 'next/script';
import { cookies, headers } from 'next/headers';
import {
  buildDatasetJsonLd,
  buildItemListJsonLd,
  buildTechArticleJsonLd,
} from '@/lib/seo/schema-builders';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';
import { LIVING_PLATFORM_LAST_REVIEWED } from '@/lib/living-platform/registry';
import { resolveLivingPlatformLang } from '@/lib/living-platform/server-i18n';

export type LivingPlatformSchemaKind = 'techArticle' | 'dataset' | 'itemList';

type Base = {
  kind: LivingPlatformSchemaKind;
  path: string;
  name: string;
  description: string;
};

type DatasetProps = Base & {
  kind: 'dataset';
};

type ItemListProps = Base & {
  kind: 'itemList';
  items: Array<{ name: string; url?: string }>;
};

type TechArticleProps = Base & {
  kind: 'techArticle';
};

type Props = DatasetProps | ItemListProps | TechArticleProps;

async function resolveLang() {
  const headersList = await headers();
  const cookieStore = await cookies();
  return resolveLivingPlatformLang(
    headersList.get('X-HomeCheff-Language'),
    cookieStore.get('homecheff-language')?.value,
  );
}

export default async function LivingPlatformJsonLd(props: Props) {
  const lang = await resolveLang();
  const domain = MAIN_DOMAIN;
  const id = `living-platform-ld-${props.path.replace(/\//g, '-')}`;

  let jsonLd: Record<string, unknown>;

  if (props.kind === 'dataset') {
    jsonLd = buildDatasetJsonLd({
      domain,
      lang,
      path: props.path,
      name: props.name,
      description: props.description,
      dateModified: LIVING_PLATFORM_LAST_REVIEWED,
    });
  } else if (props.kind === 'itemList') {
    jsonLd = buildItemListJsonLd({
      domain,
      lang,
      path: props.path,
      name: props.name,
      description: props.description,
      dateModified: LIVING_PLATFORM_LAST_REVIEWED,
      items: props.items,
    });
  } else {
    jsonLd = buildTechArticleJsonLd({
      domain,
      lang,
      path: props.path,
      headline: props.name,
      description: props.description,
      dateModified: LIVING_PLATFORM_LAST_REVIEWED,
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
