import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GardenProjectView from '@/components/profile/GardenProjectView';
import InspirationNormalView from '@/components/inspiratie/InspirationNormalView';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
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
      videos: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
          displayFullName: true,
          displayNameOption: true,
          downloadPermission: true,
          printPermission: true
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

export default async function GardenProjectPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const project = await getGardenProject(params.id, userId);

  if (!project) {
    notFound();
  }

  const isOwner = userId && project.userId === userId;

  // Get current user info for permission checks
  let currentUserId: string | undefined = undefined;
  let isFanOfOwner = false;
  if (userId && !isOwner) {
    currentUserId = userId;
    // Check if current user is a fan of the project owner
    const fanRelation = await prisma.follow.findFirst({
      where: {
        sellerId: project.userId,
        followerId: userId
      }
    });
    isFanOfOwner = !!fanRelation;
  }

  // Check if print view is requested
  const showPrintView = searchParams?.view === 'print' || searchParams?.print === 'true';

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    }>
      {showPrintView ? (
        <GardenProjectView 
          project={{
            ...project,
            video: project.videos?.[0] || null
          }} 
          isOwner={isOwner}
          ownerPermissions={{
            downloadPermission: project.user.downloadPermission || 'EVERYONE',
            printPermission: project.user.printPermission || 'EVERYONE'
          }}
          currentUser={{
            id: currentUserId,
            isFanOfOwner
          }}
        />
      ) : (
        <>
          {/* Debug: Log growth photos on server */}
          {console.log('🌱 Server-side garden project data:', {
            id: project.id,
            title: project.title,
            growthPhotosCount: project.growthPhotos?.length || 0,
            regularPhotosCount: project.photos?.length || 0,
            growthPhotos: project.growthPhotos?.map(p => ({ 
              id: p.id, 
              phaseNumber: p.phaseNumber, 
              hasDescription: !!p.description 
            })) || []
          })}
          <InspirationNormalView
            item={{
              id: project.id,
              title: project.title,
              description: project.description,
              category: project.category,
              subcategory: project.subcategory,
              photos: project.photos.map(p => ({ id: p.id, url: p.url, isMain: p.isMain, idx: p.idx })),
              video: project.videos && project.videos.length > 0 ? {
                url: project.videos[0].url,
                thumbnail: project.videos[0].thumbnail || null
              } : null,
              growthPhotos: (project.growthPhotos && Array.isArray(project.growthPhotos) && project.growthPhotos.length > 0)
                ? project.growthPhotos.map(p => ({ 
                    id: p.id, 
                    url: p.url, 
                    phaseNumber: p.phaseNumber, 
                    description: p.description,
                    idx: p.idx || 0
                  }))
                : [],
              plantType: project.plantType,
              plantDate: project.plantDate ? new Date(project.plantDate) : null,
              harvestDate: project.harvestDate ? new Date(project.harvestDate) : null,
              growthDuration: project.growthDuration,
              sunlight: project.sunlight as 'FULL' | 'PARTIAL' | 'SHADE' | null | undefined,
              waterNeeds: project.waterNeeds as 'HIGH' | 'MEDIUM' | 'LOW' | null | undefined,
              location: project.location as 'INDOOR' | 'OUTDOOR' | 'GREENHOUSE' | 'BALCONY' | null | undefined,
              soilType: project.soilType,
              plantDistance: project.plantDistance,
              difficulty: project.difficulty as 'EASY' | 'MEDIUM' | 'HARD' | null | undefined,
              tags: project.tags || [],
              notes: project.notes,
              createdAt: project.createdAt,
              user: {
                id: project.user.id,
                username: project.user.username,
                name: project.user.name,
                profileImage: project.user.profileImage
              }
            }}
            isOwner={isOwner}
            category="GROWN"
          />
        </>
      )}
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

