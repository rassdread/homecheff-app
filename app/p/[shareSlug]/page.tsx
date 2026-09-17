import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { REFERRAL_COOKIE_NAME } from '@/lib/affiliate-attribution-contract';
import { isPublicLandingEligible, isSafeForOpenGraphMedia } from '@/lib/affiliate-media/access';
import { sanitizeDestinationPath } from '@/lib/affiliate-media/destination';
import { creatorCreditLabel } from '@/lib/affiliate-media/serialize';
import { canonicalPromoUrl, isValidShareSlug } from '@/lib/affiliate-media/share-url';
import { MAIN_DOMAIN } from '@/lib/seo/constants';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ shareSlug: string }> };

async function loadPublicAsset(shareSlug: string) {
  if (!isValidShareSlug(shareSlug)) return null;
  return prisma.affiliateMediaAsset.findFirst({
    where: { shareSlug, deletedAt: null },
    include: {
      creator: {
        select: {
          name: true,
          username: true,
          displayFullName: true,
          displayNameOption: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareSlug } = await params;
  const asset = await loadPublicAsset(shareSlug);
  const canonical = canonicalPromoUrl(shareSlug, MAIN_DOMAIN);

  if (!asset || !isPublicLandingEligible(asset) || !isSafeForOpenGraphMedia(asset)) {
    return {
      title: 'HomeCheff',
      robots: { index: false, follow: false, noarchive: true },
      alternates: { canonical },
      openGraph: {
        title: 'HomeCheff',
        url: canonical,
        siteName: 'HomeCheff',
      },
    };
  }

  const ogImage = asset.kind === 'VIDEO' ? asset.posterUrl : asset.mediaUrl;
  const title = asset.title?.trim() || 'HomeCheff';
  const description =
    asset.caption?.trim() ||
    'Ontdek HomeCheff — lokaal kopen, verkopen, bezorgen en verdienen.';

  return {
    title: `${title} | HomeCheff`,
    description,
    robots:
      asset.visibility === 'PRIVATE'
        ? { index: false, follow: true, noarchive: true }
        : { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'HomeCheff',
      type: 'website',
      images: ogImage
        ? [{ url: ogImage, width: asset.width || 1200, height: asset.height || 630, alt: title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PromoLandingPage({ params }: Props) {
  const { shareSlug } = await params;
  const asset = await loadPublicAsset(shareSlug);
  if (!asset || !isPublicLandingEligible(asset)) notFound();

  const jar = await cookies();
  const refCode = jar.get(REFERRAL_COOKIE_NAME)?.value?.trim() || null;
  if (refCode) {
    const affiliate = await prisma.referralLink.findFirst({
      where: { OR: [{ code: refCode }, { code: refCode.toUpperCase() }] },
      select: { affiliateId: true },
    });
    void prisma.affiliateMediaClickEvent
      .create({
        data: {
          assetId: asset.id,
          sharingAffiliateId: affiliate?.affiliateId ?? null,
          refCode,
        },
      })
      .catch(() => undefined);
  }

  const credit = creatorCreditLabel({ visibility: asset.visibility, creator: asset.creator });
  const href = sanitizeDestinationPath(asset.destinationPath) || '/';
  const poster = asset.kind === 'VIDEO' ? asset.posterUrl : asset.mediaUrl;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <article className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">HomeCheff</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{asset.title || 'HomeCheff'}</h1>
        <p className="mt-1 text-sm text-slate-600">Gemaakt door {credit}</p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {asset.kind === 'VIDEO' ? (
            <video
              className="aspect-video w-full bg-black object-contain"
              src={asset.mediaUrl}
              poster={poster || undefined}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.mediaUrl} alt={asset.title || ''} className="w-full object-cover" />
          )}
        </div>

        {asset.caption ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{asset.caption}</p>
        ) : null}

        <Link
          href={href}
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {asset.ctaText?.trim() || 'Ontdek HomeCheff'}
        </Link>
      </article>
    </main>
  );
}
