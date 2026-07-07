import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';
import {
  buildListingDetailPath,
  isBareListingUuidParam,
  resolveListingIdFromParam,
} from '@/lib/seo/listing-routes';
import { getDisplayName, PUBLIC_DISPLAY_FALLBACK } from '@/lib/displayName';
import { formatCityLabel } from '@/lib/seo/productSlug';
import { isRequestListing } from '@/lib/marketplace/product-visibility';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const routeParam = (await params).slug;
  const id = resolveListingIdFromParam(routeParam);
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
                displayFullName: true,
                displayNameOption: true,
              },
            },
          },
        },
        Image: {
          select: { fileUrl: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });

    if (!product || !product.isActive || !isRequestListing(product)) {
      return {
        title: lang === 'en' ? 'Request not found' : 'Verzoek niet gevonden',
        robots: { index: false, follow: false },
      };
    }

    const slugSegment = buildListingDetailPath(
      'request',
      product.title,
      product.seller?.User?.place,
      product.id,
    ).replace('/request/', '');
    const canonicalPath = `/request/${slugSegment}`;
    const canonicalUrl = `${currentDomain}${canonicalPath}`;

    const requesterName = product.seller?.User
      ? getDisplayName(product.seller.User)
      : PUBLIC_DISPLAY_FALLBACK;
    const city = formatCityLabel(product.seller?.User?.place);

    const title =
      lang === 'en'
        ? city
          ? `${product.title} — help wanted in ${city} | HomeCheff`
          : `${product.title} — help wanted | HomeCheff`
        : city
          ? `${product.title} — gezocht in ${city} | HomeCheff`
          : `${product.title} — gezocht | HomeCheff`;

    const description =
      lang === 'en'
        ? `${requesterName} is looking for: ${product.title}. Respond with a proposal on HomeCheff.`
        : `${requesterName} zoekt: ${product.title}. Reageer met een voorstel op HomeCheff.`;

    const imageUrl = product.Image?.[0]?.fileUrl
      ? product.Image[0].fileUrl.startsWith('http')
        ? product.Image[0].fileUrl
        : `${currentDomain}${product.Image[0].fileUrl}`
      : `${currentDomain}/og-image.jpg`;

    return {
      title,
      description,
      openGraph: {
        type: 'website',
        title,
        description,
        url: canonicalUrl,
        images: [{ url: imageUrl, width: 1200, height: 630, alt: product.title }],
        siteName: 'HomeCheff',
      },
      alternates: {
        canonical: canonicalUrl,
        languages: seoHreflangLanguagesOnEu(canonicalPath),
      },
      robots: { index: true, follow: true },
    };
  } catch (error) {
    console.error('Error generating request metadata:', error);
    return {
      title: lang === 'en' ? 'Request - HomeCheff' : 'Verzoek - HomeCheff',
      robots: { index: false, follow: false },
    };
  }
}

export default async function RequestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const routeParam = (await params).slug;
  const resolvedId = resolveListingIdFromParam(routeParam);

  const product = await prisma.product.findUnique({
    where: { id: resolvedId },
    select: {
      id: true,
      title: true,
      listingIntent: true,
      isActive: true,
      seller: { select: { User: { select: { place: true } } } },
    },
  });

  if (product?.isActive && !isRequestListing(product)) {
    redirect(
      buildListingDetailPath(
        'product',
        product.title,
        product.seller?.User?.place,
        product.id,
      ),
    );
  }

  if (product?.isActive && isBareListingUuidParam(routeParam)) {
    redirect(
      buildListingDetailPath(
        'request',
        product.title,
        product.seller?.User?.place,
        product.id,
      ),
    );
  }

  return children;
}
