import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DesignView from '@/components/designs/DesignView';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function getDesign(id: string, userId?: string) {
  const design = await prisma.dish.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { idx: 'asc' }
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
          displayFullName: true,
          displayNameOption: true
        }
      }
    }
  });

  if (!design || design.category !== 'DESIGNER') {
    return null;
  }

  // Check if user has access
  const isOwner = userId && design.userId === userId;
  const isPublic = design.status === 'PUBLISHED';

  if (!isOwner && !isPublic) {
    return null; // Private design, no access
  }

  return design;
}

export default async function DesignPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const design = await getDesign(params.id, userId);

  if (!design) {
    notFound();
  }

  const isOwner = userId && design.userId === userId;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    }>
      <DesignView 
        design={design} 
        isOwner={isOwner}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const design = await prisma.dish.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      description: true,
      photos: {
        where: { isMain: true },
        take: 1
      }
    }
  });

  if (!design) {
    return {
      title: 'Design niet gevonden',
    };
  }

  return {
    title: `${design.title} - HomeCheff Atelier`,
    description: design.description || `Bekijk dit design: ${design.title}`,
    openGraph: {
      title: design.title || 'Design',
      description: design.description || undefined,
      images: design.photos[0]?.url ? [design.photos[0].url] : [],
    },
  };
}




