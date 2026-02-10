import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DesignView from '@/components/designs/DesignView';
import InspirationNormalView from '@/components/inspiratie/InspirationNormalView';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

async function getDesign(id: string, userId?: string) {
  const design = await prisma.dish.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { idx: 'asc' }
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

export default async function DesignPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const design = await getDesign(params.id, userId);

  if (!design) {
    notFound();
  }

  const isOwner = userId && design.userId === userId;

  // Get current user info for permission checks
  let currentUserId: string | undefined = undefined;
  let isFanOfOwner = false;
  if (userId && !isOwner) {
    currentUserId = userId;
    // Check if current user is a fan of the design owner
    const fanRelation = await prisma.follow.findFirst({
      where: {
        sellerId: design.userId,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    }>
      {showPrintView ? (
        <DesignView 
          design={{
            ...design,
            video: design.videos?.[0] || null
          }} 
          isOwner={isOwner}
          ownerPermissions={{
            downloadPermission: design.user.downloadPermission || 'EVERYONE',
            printPermission: design.user.printPermission || 'EVERYONE'
          }}
          currentUser={{
            id: currentUserId,
            isFanOfOwner
          }}
        />
      ) : (
        <InspirationNormalView
          item={{
            id: design.id,
            title: design.title,
            description: design.description,
            category: design.category,
            subcategory: design.subcategory,
            photos: design.photos.map(p => ({ id: p.id, url: p.url, isMain: p.isMain, idx: p.idx })),
            video: design.videos && design.videos.length > 0 ? {
              url: design.videos[0].url,
              thumbnail: design.videos[0].thumbnail || null
            } : null,
            materials: design.materials || [],
            createdAt: design.createdAt,
            user: {
              id: design.user.id,
              username: design.user.username,
              name: design.user.name,
              profileImage: design.user.profileImage
            }
          }}
          isOwner={isOwner}
          category="DESIGNER"
        />
      )}
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

