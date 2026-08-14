import type { Metadata } from 'next';
import Script from 'next/script';
import { redirect, notFound } from 'next/navigation';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';
import {
  buildProductSlugPath,
  formatCityLabel,
  isBareProductUuidParam,
  resolveProductIdFromParam,
} from '@/lib/seo/productSlug';
import {
  buildListingDetailPath,
} from '@/lib/seo/listing-routes';
import { isRequestListing } from '@/lib/marketplace/product-visibility';
import { buildListingJsonLd } from '@/lib/seo/schema-builders';
import { getDisplayName, PUBLIC_DISPLAY_FALLBACK } from '@/lib/displayName';
import { getCachedListingProductCore } from '@/lib/marketplace/detail/get-cached-listing-product-core';
import { rethrowIfNotFound } from '@/lib/seo/rethrow-if-not-found';

const BREADCRUMB_HOME_NL = 'Home';
const BREADCRUMB_HOME_EN = 'Home';
const BREADCRUMB_SQUARE_NL = 'Dorpsplein';
const BREADCRUMB_SQUARE_EN = 'Village Square';

/** Keep redirects dynamic; product core is request-deduped via React.cache. */
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const routeParam = (await params).id;
  const id = resolveProductIdFromParam(routeParam);
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();

  if (!id) notFound();

  let product: Awaited<ReturnType<typeof getCachedListingProductCore>> = null;
  try {
    product = await getCachedListingProductCore(id);
  } catch (error) {
    rethrowIfNotFound(error);
    console.error('Error loading product for metadata:', error);
    notFound();
  }

  if (!product) notFound();

  try {

    const slugSegment = buildProductSlugPath(
      product.title,
      product.seller?.User?.place,
      product.id
    );
    const canonicalPath = `/product/${slugSegment}`;
    const canonicalUrl = `${currentDomain}${canonicalPath}`;

    const sellerName = product.seller?.User
      ? getDisplayName(product.seller.User)
      : '';
    const city = formatCityLabel(product.seller?.User?.place);

    const title =
      lang === 'en'
        ? sellerName
          ? city
            ? `${product.title} — ${sellerName} in ${city} | HomeCheff`
            : `${product.title} — ${sellerName} | HomeCheff`
          : city
            ? `${product.title} in ${city} | HomeCheff`
            : `${product.title} | HomeCheff`
        : sellerName
          ? city
            ? `${product.title} — ${sellerName} in ${city} | HomeCheff`
            : `${product.title} — ${sellerName} | HomeCheff`
          : city
            ? `${product.title} in ${city} | HomeCheff`
            : `${product.title} | HomeCheff`;

    const description =
      lang === 'en'
        ? sellerName
          ? `${product.title} from ${sellerName}${city ? ` in ${city}` : ''} on HomeCheff — personal craftsmanship from a real local maker.`
          : city
            ? `Discover ${product.title} from local makers in ${city} on HomeCheff.`
            : `Discover ${product.title} from local makers on HomeCheff.`
        : sellerName
          ? `${product.title} van ${sellerName}${city ? ` in ${city}` : ''} op HomeCheff — persoonlijk vakmanschap van een echte maker.`
          : city
            ? `Ontdek ${product.title} van lokale makers in ${city} via HomeCheff.`
            : `Ontdek ${product.title} van lokale makers via HomeCheff.`;

    const keywords = [
      product.title,
      sellerName,
      city,
      String(product.category || '').toLowerCase(),
      product.subcategory || '',
      lang === 'en' ? 'homemade' : 'thuisgemaakt',
      lang === 'en' ? 'local' : 'lokaal',
      lang === 'en' ? 'buy online' : 'online kopen',
      'homecheff',
    ].filter(Boolean);

    const imageUrl = product.Image?.[0]?.fileUrl
      ? product.Image[0].fileUrl.startsWith('http')
        ? product.Image[0].fileUrl
        : `${currentDomain}${product.Image[0].fileUrl}`
      : `${currentDomain}/og-image.jpg`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        type: 'website',
        title,
        description,
        url: canonicalUrl,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.title,
          },
        ],
        siteName: 'HomeCheff',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
        languages: seoHreflangLanguagesOnEu(canonicalPath),
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    rethrowIfNotFound(error);
    console.error('Error generating product metadata:', error);
    return {
      title: lang === 'en' ? 'Product - HomeCheff' : 'Product - HomeCheff',
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const routeParam = (await params).id;
  const resolvedId = resolveProductIdFromParam(routeParam);
  const currentDomain = await getCurrentDomain();
  const lang = await getCurrentLanguage();

  let structuredData: Record<string, unknown> | null = null;
  let breadcrumbData: Record<string, unknown> | null = null;

  const productForLayout = resolvedId
    ? await getCachedListingProductCore(resolvedId)
    : null;

  if (!resolvedId || !productForLayout) notFound();

  if (productForLayout?.isActive && isRequestListing(productForLayout as any)) {
    redirect(
      buildListingDetailPath(
        'request',
        productForLayout.title,
        productForLayout.seller?.User?.place,
        productForLayout.id,
      ),
    );
  }

  if (productForLayout?.isActive && isBareProductUuidParam(routeParam)) {
    redirect(
      `/product/${buildProductSlugPath(
        productForLayout.title,
        productForLayout.seller?.User?.place,
        productForLayout.id
      )}`
    );
  }

  try {
    const product = productForLayout;

    if (product && product.isActive) {
      const slugSegment = buildProductSlugPath(
        product.title,
        product.seller?.User?.place,
        product.id
      );
      const productUrl = `${currentDomain}/product/${slugSegment}`;

      const sellerName = product.seller?.User
        ? getDisplayName(product.seller.User)
        : '';
      const city = formatCityLabel(product.seller?.User?.place);
      const username = product.seller?.User?.username;
      const price = (product.priceCents / 100).toFixed(2);
      // Individual review rows deferred — aggregateRating filled by extras later; JSON-LD stays valid without reviews array.
      const averageRating = null;
      const reviewCount = 0;
      const imageUrl = product.Image?.[0]?.fileUrl
        ? product.Image[0].fileUrl.startsWith('http')
          ? product.Image[0].fileUrl
          : `${currentDomain}${product.Image[0].fileUrl}`
        : `${currentDomain}/og-image.jpg`;

      structuredData = buildListingJsonLd({
        domain: currentDomain,
        title: product.title,
        description: product.description || '',
        imageUrl,
        price,
        productUrl,
        sellerName: sellerName || PUBLIC_DISPLAY_FALLBACK,
        sellerUsername: username,
        city,
        marketplaceCategory: product.marketplaceCategory,
        stock: product.stock,
        averageRating,
        reviewCount,
        reviews: [],
      });

      const homeLabel = lang === 'en' ? BREADCRUMB_HOME_EN : BREADCRUMB_HOME_NL;
      const squareLabel =
        lang === 'en' ? BREADCRUMB_SQUARE_EN : BREADCRUMB_SQUARE_NL;
      breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: homeLabel,
            item: `${currentDomain}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: squareLabel,
            item: `${currentDomain}/?chip=sale`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.title,
            item: productUrl,
          },
        ],
      };
    }
  } catch (error) {
    rethrowIfNotFound(error);
    console.error('Error generating structured data:', error);
  }

  return (
    <>
      {structuredData && (
        <Script
          id="product-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      {breadcrumbData && (
        <Script
          id="product-breadcrumb-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
      )}
      {children}
    </>
  );
}
