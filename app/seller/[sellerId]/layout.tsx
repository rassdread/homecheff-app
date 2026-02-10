import type { Metadata } from 'next';
import Script from 'next/script';
import { prisma } from '@/lib/prisma';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ sellerId: string }> }
): Promise<Metadata> {
  const { sellerId } = await params;
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const alternateDomain = currentDomain === 'https://homecheff.eu' ? 'https://homecheff.nl' : 'https://homecheff.eu';

  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: {
        User: {
          select: {
            name: true,
            username: true,
            city: true,
            country: true,
            profileImage: true,
          }
        },
        products: {
          where: { isActive: true },
          select: { id: true, category: true },
          take: 100
        }
      }
    });

    if (!seller) {
      return {
        title: lang === 'en' ? 'Seller Not Found' : 'Verkoper Niet Gevonden',
        robots: { index: false, follow: false }
      };
    }

    const sellerName = seller.User?.name || seller.User?.username || seller.displayName || 'Seller';
    const location = [seller.User?.city, seller.User?.country].filter(Boolean).join(', ') || '';
    const productCount = seller.products.length;
    const categories = [...new Set(seller.products.map(p => p.category))];
    
    const description = seller.bio
      ? seller.bio.substring(0, 155) + (seller.bio.length > 155 ? '...' : '')
      : (lang === 'en'
        ? `Shop ${productCount} ${productCount === 1 ? 'homemade product' : 'homemade products'} from ${sellerName}${location ? ` in ${location}` : ''} on HomeCheff. ${categories.length > 0 ? `Categories: ${categories.join(', ')}.` : ''} Buy directly from the maker.`
        : `Shop ${productCount} ${productCount === 1 ? 'thuisgemaakt product' : 'thuisgemaakte producten'} van ${sellerName}${location ? ` uit ${location}` : ''} op HomeCheff. ${categories.length > 0 ? `Categorieën: ${categories.join(', ')}.` : ''} Koop direct bij de maker.`);

    const title = lang === 'en'
      ? `${sellerName} - Seller on HomeCheff${location ? ` | ${location}` : ''}`
      : `${sellerName} - Verkoper op HomeCheff${location ? ` | ${location}` : ''}`;

    const keywords = [
      sellerName,
      location,
      ...categories.map(c => c.toLowerCase()),
      lang === 'en' ? 'homemade' : 'thuisgemaakt',
      lang === 'en' ? 'local seller' : 'lokale verkoper',
      lang === 'en' ? 'buy local' : 'koop lokaal',
      'homecheff'
    ].filter(Boolean);

    const imageUrl = seller.User?.profileImage
      ? (seller.User.profileImage.startsWith('http') ? seller.User.profileImage : `${currentDomain}${seller.User.profileImage}`)
      : `${currentDomain}/og-image.jpg`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        type: 'profile',
        title,
        description,
        url: `${currentDomain}/seller/${sellerId}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: sellerName,
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
        canonical: `${currentDomain}/seller/${sellerId}`,
        languages: {
          'nl-NL': `${alternateDomain}/seller/${sellerId}`,
          'en-US': `${currentDomain}/seller/${sellerId}`,
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error('Error generating seller metadata:', error);
    return {
      title: lang === 'en' ? 'Seller - HomeCheff' : 'Verkoper - HomeCheff',
      robots: { index: false, follow: false }
    };
  }
}

export default async function SellerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;
  const currentDomain = await getCurrentDomain();

  // Fetch seller data for structured data
  let structuredData: any = null;
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: {
        User: {
          select: {
            name: true,
            username: true,
            city: true,
            country: true,
          }
        }
      }
    });

    if (seller && seller.User) {
      const sellerName = seller.User.name || seller.User.username || seller.displayName || '';
      const location = [seller.User.city, seller.User.country].filter(Boolean).join(', ');

      // Person/Organization structured data (Schema.org)
      structuredData = {
        '@context': 'https://schema.org',
        '@type': seller.companyName ? 'Organization' : 'Person',
        name: sellerName,
        ...(seller.bio && { description: seller.bio }),
        ...(location && {
          address: {
            '@type': 'PostalAddress',
            addressLocality: seller.User.city || '',
            addressCountry: seller.User.country || '',
          }
        }),
        url: `${currentDomain}/seller/${sellerId}`,
      };
    }
  } catch (error) {
    console.error('Error generating seller structured data:', error);
  }

  return (
    <>
      {structuredData && (
        <Script
          id="seller-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      {children}
    </>
  );
}

