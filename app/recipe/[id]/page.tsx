import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentDomain } from '@/lib/seo/metadata';
import InspiratieDetail from '@/components/inspiratie/InspiratieDetail';
import InspiratiePrintView from '@/components/inspiratie/InspiratiePrintView';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadPublicContactChannelsForUser } from '@/lib/profile/load-public-contact-channels';
import { loadInspiratieDetail } from '@/lib/items/load-inspiratie-detail';

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

function isPrintMode(searchParams: PageProps['searchParams']): boolean {
  return searchParams?.view === 'print' || searchParams?.print === 'true';
}

export default async function RecipePage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const result = await loadInspiratieDetail(params.id, userId, { category: 'CHEFF' });
  if (!result) notFound();

  if (isPrintMode(searchParams)) {
    return (
      <InspiratiePrintView
        item={result.item}
        canonicalUrl={`/recipe/${params.id}`}
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

export async function generateMetadata({ params }: PageProps) {
  const recipe = await prisma.dish.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      description: true,
      photos: { where: { isMain: true }, take: 1 },
    },
  });

  if (!recipe) {
    return { title: 'Recept niet gevonden' };
  }

  const imageUrl = recipe.photos[0]?.url
    ? (recipe.photos[0].url.startsWith('http')
        ? recipe.photos[0].url
        : (await getCurrentDomain()) + recipe.photos[0].url)
    : undefined;

  return {
    title: `${recipe.title} - HomeCheff Keuken`,
    description: recipe.description || `Bekijk dit recept: ${recipe.title}`,
    openGraph: {
      title: recipe.title || 'Recept',
      description: recipe.description || undefined,
      images: imageUrl
        ? [{ url: imageUrl, width: 1200, height: 630, alt: recipe.title || 'Recept' }]
        : [],
    },
  };
}
