import type { Metadata } from 'next';
import Script from 'next/script';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
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

const BREADCRUMB_HOME_NL = 'Home';
const BREADCRUMB_HOME_EN = 'Home';
const BREADCRUMB_SQUARE_NL = 'Dorpsplein';
const BREADCRUMB_SQUARE_EN = 'Village Square';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const routeParam = (await params).id;
  const id = resolveProductIdFromParam(routeParam);
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            User: {
              select: {
                name: true,
                username: true,
                place: true,
              },
            },
          },
        },
        Image: {
          select: { fileUrl: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        reviews: {
          select: { rating: true },
          where: { reviewSubmittedAt: { not: null } },
        },
      },
    });

    if (!product || !product.isActive) {
      return {
        title: lang === 'en' ? 'Product Not Found' : 'Product Niet Gevonden',
        robots: { index: false, follow: false },
      };
    }

    const slugSegment = buildProductSlugPath(
      product.title,
      product.seller?.User?.place,
      product.id
    );
    const canonicalPath = `/product/${slugSegment}`;
    const canonicalUrl = `${currentDomain}${canonicalPath}`;

    const sellerName =
      product.seller?.User?.name || product.seller?.User?.username || '';
    const city = formatCityLabel(product.seller?.User?.place);
    const price = (product.priceCents / 100).toFixed(2);
    const averageRating =
      product.reviews.length > 0
        ? (
            product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          ).toFixed(1)
        : null;

    const title =
      lang === 'en'
        ? city
          ? `${product.title} in ${city} | Buy on HomeCheff`
          : `${product.title} | Buy local on HomeCheff`
        : city
          ? `${product.title} in ${city} kopen | HomeCheff`
          : `${product.title} lokaal kopen | HomeCheff`;

    const description =
      lang === 'en'
        ? city
          ? `Order ${product.title} from local makers in ${city} on HomeCheff.`
          : `Order ${product.title} from local makers on HomeCheff.`
        : city
          ? `Bestel ${product.title} van lokale makers in ${city} via HomeCheff.`
          : `Bestel ${product.title} van lokale makers via HomeCheff.`;

    const keywords = [
      product.title,
      sellerName,
      city,
      product.category.toLowerCase(),
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

  const productForLayout = await prisma.product.findUnique({
    where: { id: resolvedId },
    include: {
      seller: {
        include: {
          User: {
            select: {
              name: true,
              username: true,
              place: true,
            },
          },
        },
      },
      Image: {
        select: { fileUrl: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
      reviews: {
        where: { reviewSubmittedAt: { not: null } },
        select: {
          rating: true,
          comment: true,
          title: true,
          buyer: { select: { name: true } },
        },
        take: 10,
      },
    },
  });

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

      const sellerName =
        product.seller?.User?.name || product.seller?.User?.username || '';
      const city = formatCityLabel(product.seller?.User?.place);
      const username = product.seller?.User?.username;
      const price = (product.priceCents / 100).toFixed(2);
      const averageRating =
        product.reviews.length > 0
          ? (
              product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            ).toFixed(1)
          : null;
      const reviewCount = product.reviews.length;
      const imageUrl = product.Image?.[0]?.fileUrl
        ? product.Image[0].fileUrl.startsWith('http')
          ? product.Image[0].fileUrl
          : `${currentDomain}${product.Image[0].fileUrl}`
        : `${currentDomain}/og-image.jpg`;

      const sellerPerson: Record<string, unknown> = {
        '@type': 'Person',
        name: sellerName || 'Maker',
        ...(username
          ? { url: `${currentDomain}/user/${username}` }
          : {}),
        ...(city
          ? {
              address: {
                '@type': 'PostalAddress',
                addressLocality: city,
              },
            }
          : {}),
      };

      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description || '',
        image: imageUrl,
        brand: {
          '@type': 'Brand',
          name: sellerName || 'HomeCheff',
        },
        seller: sellerPerson,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: 'EUR',
          availability:
            product.stock && product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: productUrl,
        },
        ...(averageRating &&
          reviewCount > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: averageRating,
              reviewCount,
            },
            review: product.reviews.slice(0, 5).map((review) => ({
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: review.buyer?.name || 'Anonymous',
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating,
              },
              reviewBody: review.comment || review.title || '',
            })),
          }),
      };

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
            item: `${currentDomain}/dorpsplein`,
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
