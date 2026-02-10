import type { Metadata } from 'next';
import Script from 'next/script';
import { prisma } from '@/lib/prisma';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const alternateDomain = currentDomain === 'https://homecheff.eu' ? 'https://homecheff.nl' : 'https://homecheff.eu';

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
              }
            }
          }
        },
        Image: {
          select: { fileUrl: true },
          orderBy: { sortOrder: 'asc' },
          take: 1
        },
        reviews: {
          select: { rating: true },
          where: { reviewSubmittedAt: { not: null } }
        }
      }
    });

    if (!product || !product.isActive) {
      return {
        title: lang === 'en' ? 'Product Not Found' : 'Product Niet Gevonden',
        robots: { index: false, follow: false }
      };
    }

    const sellerName = product.seller?.User?.name || product.seller?.User?.username || '';
    const price = (product.priceCents / 100).toFixed(2);
    const averageRating = product.reviews.length > 0
      ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
      : null;
    
    const description = product.description
      ? product.description.substring(0, 155) + (product.description.length > 155 ? '...' : '')
      : (lang === 'en' 
        ? `Buy ${product.title} from ${sellerName} on HomeCheff. ${product.category === 'CHEFF' ? 'Homemade meals' : product.category === 'GROWN' ? 'Fresh produce' : 'Handmade products'} delivered to your door.`
        : `Koop ${product.title} van ${sellerName} op HomeCheff. ${product.category === 'CHEFF' ? 'Thuisgemaakte maaltijden' : product.category === 'GROWN' ? 'Verse producten' : 'Handgemaakte producten'} thuis bezorgd.`);

    const title = lang === 'en'
      ? `${product.title} - €${price} | HomeCheff`
      : `${product.title} - €${price} | HomeCheff`;

    const keywords = [
      product.title,
      sellerName,
      product.category.toLowerCase(),
      product.subcategory || '',
      lang === 'en' ? 'homemade' : 'thuisgemaakt',
      lang === 'en' ? 'local' : 'lokaal',
      lang === 'en' ? 'buy online' : 'online kopen',
      'homecheff'
    ].filter(Boolean);

    const imageUrl = product.Image?.[0]?.fileUrl 
      ? (product.Image[0].fileUrl.startsWith('http') ? product.Image[0].fileUrl : `${currentDomain}${product.Image[0].fileUrl}`)
      : `${currentDomain}/og-image.jpg`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        type: 'website',
        title,
        description,
        url: `${currentDomain}/product/${id}`,
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
        canonical: `${currentDomain}/product/${id}`,
        languages: {
          'nl-NL': `${alternateDomain}/product/${id}`,
          'en-US': `${currentDomain}/product/${id}`,
        },
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
      robots: { index: false, follow: false }
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
  const { id } = await params;
  const currentDomain = await getCurrentDomain();

  // Fetch product data for structured data
  let structuredData: any = null;
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
              }
            }
          }
        },
        Image: {
          select: { fileUrl: true },
          orderBy: { sortOrder: 'asc' },
          take: 1
        },
        reviews: {
          where: { reviewSubmittedAt: { not: null } },
          select: { rating: true, comment: true, title: true, buyer: { select: { name: true } } },
          take: 10
        }
      }
    });

    if (product && product.isActive) {
      const sellerName = product.seller?.User?.name || product.seller?.User?.username || '';
      const price = (product.priceCents / 100).toFixed(2);
      const averageRating = product.reviews.length > 0
        ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
        : null;
      const reviewCount = product.reviews.length;
      const imageUrl = product.Image?.[0]?.fileUrl 
        ? (product.Image[0].fileUrl.startsWith('http') ? product.Image[0].fileUrl : `${currentDomain}${product.Image[0].fileUrl}`)
        : `${currentDomain}/og-image.jpg`;

      // Product structured data (Schema.org)
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description || '',
        image: imageUrl,
        brand: {
          '@type': 'Brand',
          name: sellerName
        },
        offers: {
          '@type': 'Offer',
          price: price,
          priceCurrency: 'EUR',
          availability: product.stock && product.stock > 0 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          url: `${currentDomain}/product/${id}`,
        },
        ...(averageRating && reviewCount > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRating,
            reviewCount: reviewCount,
          },
          review: product.reviews.slice(0, 5).map(review => ({
            '@type': 'Review',
            author: {
              '@type': 'Person',
              name: review.buyer?.name || 'Anonymous'
            },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating,
            },
            reviewBody: review.comment || review.title || '',
          }))
        })
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
      {children}
    </>
  );
}

