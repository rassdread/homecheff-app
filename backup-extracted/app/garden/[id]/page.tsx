import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GardenProjectView from '@/components/profile/GardenProjectView';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function getGardenProject(id: string, userId?: string) {
  const project = await prisma.dish.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { idx: 'asc' }
      },
      growthPhotos: {
        orderBy: [
          { phaseNumber: 'asc' },
          { idx: 'asc' }
        ]
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

  if (!project || project.category !== 'GROWN') {
    return null;
  }

  // Check if user has access
  const isOwner = userId && project.userId === userId;
  const isPublic = project.status === 'PUBLISHED';

  if (!isOwner && !isPublic) {
    return null; // Private project, no access
  }

  return project;
}

export default async function GardenProjectPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const project = await getGardenProject(params.id, userId);

  if (!project) {
    notFound();
  }

  const isOwner = userId && project.userId === userId;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <GardenProjectView 
        project={project} 
        isOwner={isOwner}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const project = await prisma.dish.findUnique({
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

  if (!project) {
    return {
      title: 'Kweek niet gevonden',
    };
  }

  return {
    title: `${project.title} - HomeCheff Mijn Tuin`,
    description: project.description || `Bekijk dit kweekproject: ${project.title}`,
    openGraph: {
      title: project.title || 'Kweekproject',
      description: project.description || undefined,
      images: project.photos[0]?.url ? [project.photos[0].url] : [],
    },
  };
}

