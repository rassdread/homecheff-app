import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getCurrentDomain } from '@/lib/seo/metadata';
import InspiratieDetail from '@/components/inspiratie/InspiratieDetail';
import InspiratiePrintView from '@/components/inspiratie/InspiratiePrintView';
import { loadPublicContactChannelsForUser } from '@/lib/profile/load-public-contact-channels';
import { loadInspiratieDetail } from '@/lib/items/load-inspiratie-detail';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

function isPrintMode(searchParams?: PageProps['searchParams']): boolean {
  return searchParams?.view === 'print' || searchParams?.print === 'true';
}

export default async function InspiratieItemPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const viewerUserId = (session?.user as { id?: string } | undefined)?.id;
  const result = await loadInspiratieDetail(params.id, viewerUserId);

  if (!result) {
    notFound();
  }

  if (isPrintMode(searchParams)) {
    return (
      <InspiratiePrintView
        item={result.item}
        canonicalUrl={`/inspiratie/${params.id}`}
      />
    );
  }

  const publicContactChannels = await loadPublicContactChannelsForUser(result.item.user.id);

  return (
    <InspiratieDetail
      item={result.item}
      isOwner={result.isOwner}
      publicContactChannels={publicContactChannels}
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const item = await prisma.dish.findUnique({
    where: { id: params.id },
    include: {
      photos: {
        where: { isMain: true },
        take: 1,
      },
    },
  });

  if (!item || item.status !== 'PUBLISHED') {
    return {
      title: 'Inspiratie-item niet gevonden',
    };
  }

  const mainPhoto = item.photos[0];
  const imageUrl = mainPhoto?.url
    ? (mainPhoto.url.startsWith('http') ? mainPhoto.url : (await getCurrentDomain()) + mainPhoto.url)
    : undefined;

  return {
    title: item.title ? `${item.title} - HomeCheff Inspiratie` : 'Inspiratie-item',
    description: item.description ?? undefined,
    openGraph: {
      title: item.title ?? 'Inspiratie-item',
      description: item.description ?? undefined,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: item.title ?? 'Inspiratie' }] : [],
    },
  };
}
