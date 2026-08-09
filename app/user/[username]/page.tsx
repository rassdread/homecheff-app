import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getCurrentDomain } from "@/lib/seo/metadata";
import { formatCityLabel } from "@/lib/seo/productSlug";
import { mondayStartUtc } from "@/lib/gamification/leaderboard-queries";
import { hcpLevelFromTotal } from "@/lib/gamification/hcp-level";
import { hcpPublicLevelTitle } from "@/lib/gamification/hcp-public-label";
import { iconKeyToDisplayIcon } from "@/lib/gamification/author-badge-summaries";
import { sortBadgesByDisplayPriority } from "@/lib/gamification/badge-priority";
import PublicProfileClient, { type PublicProfileHcpPayload } from "./PublicProfileClient";
import { loadPublicContactChannelsForUser } from "@/lib/profile/load-public-contact-channels";
import { buildProfilePageJsonLd } from '@/lib/seo/schema-builders';
import { getDisplayName } from "@/lib/displayName";

export const revalidate = 0;

/** Alleen dev: geen volledige slug/logins loggen — alleen lengtes en strategie. */
function logPublicProfileLookupDev(payload: {
  rawSegmentLen: number;
  normalizedLen: number;
  strategy: "username" | "uuid-id";
  found: boolean;
}) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[hc-public-profile]", payload);
}

/** URL-segment → prisma lookup (decode %40 etc.; reject kapotte placeholders). */
function normalizeUsernameParam(raw: string | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  s = s.trim();
  if (!s || s === "undefined" || s === "null") return null;
  return s;
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const username = normalizeUsernameParam(params.username);
  const currentDomain = await getCurrentDomain();

  if (!username) {
    return { title: "Profiel" };
  }

  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: {
      name: true,
      username: true,
      profileImage: true,
      bio: true,
      place: true,
      showProfileToEveryone: true,
      accountDeletedAt: true,
      displayFullName: true,
      displayNameOption: true,
    },
  });

  if (!user || user.accountDeletedAt || !user.showProfileToEveryone) {
    return { title: "Profiel" };
  }

  const displayName = getDisplayName(user);
  const title = `${displayName} | HomeCheff`;
  const description = user.bio
    ? user.bio.substring(0, 155) + (user.bio.length > 155 ? "..." : "")
    : `${displayName} op HomeCheff`;
  const imageUrl =
    user.profileImage?.startsWith("http")
      ? user.profileImage
      : user.profileImage
        ? `${currentDomain}${user.profileImage}`
        : null;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
      url: `${currentDomain}/user/${encodeURIComponent(username)}`,
      siteName: "HomeCheff",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 400, height: 400, alt: displayName }],
      }),
    },
    twitter: imageUrl
      ? { card: "summary_large_image", images: [imageUrl] }
      : undefined,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const rawSegment = typeof params.username === "string" ? params.username : "";
  const username = normalizeUsernameParam(params.username);

  if (!username) {
    logPublicProfileLookupDev({
      rawSegmentLen: rawSegment.length,
      normalizedLen: 0,
      strategy: "username",
      found: false,
    });
    notFound();
  }

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      username,
    );

  const publicProfileSelect = {
    id: true,
    name: true,
    username: true,
    email: true,
    bio: true,
    quote: true,
    place: true,
    gender: true,
    interests: true,
    profileImage: true,
    role: true,
    sellerRoles: true,
    buyerRoles: true,
    displayFullName: true,
    displayNameOption: true,
    showFansList: true,
    showProfileToEveryone: true,
    accountDeletedAt: true,
    createdAt: true,
    profileViews: true,
    Dish: {
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        status: true,
        createdAt: true,
        category: true,
        subcategory: true,
        photos: {
          select: { url: true, idx: true, isMain: true },
        },
        growthPhotos: {
          select: { id: true, url: true, phaseNumber: true },
          orderBy: { phaseNumber: "asc" as const },
        },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" as const },
      take: 48,
    },
    SellerProfile: {
      select: {
        id: true,
        kvk: true,
        companyName: true,
        subscriptionId: true,
        Subscription: {
          select: { id: true, name: true },
        },
        products: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            priceCents: true,
            category: true,
            createdAt: true,
            Image: { select: { fileUrl: true }, take: 1 },
          },
          orderBy: { createdAt: "desc" as const },
          take: 48,
        },
      },
    },
    DeliveryProfile: {
      select: {
        id: true,
        age: true,
        bio: true,
        transportation: true,
        maxDistance: true,
        preferredRadius: true,
        deliveryMode: true,
        availableDays: true,
        availableTimeSlots: true,
        isActive: true,
        isVerified: true,
        totalDeliveries: true,
        averageRating: true,
        totalEarnings: true,
        createdAt: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                displayFullName: true,
                displayNameOption: true,
              },
            },
          },
          orderBy: { createdAt: "desc" as const },
          take: 10,
        },
        vehiclePhotos: {
          orderBy: { sortOrder: "asc" as const },
          take: 12,
        },
      },
    },
  } as const;

  let lookupStrategy: "username" | "uuid-id" = isUUID ? "uuid-id" : "username";

  let user = isUUID
    ? await prisma.user.findUnique({
        where: { id: username },
        select: publicProfileSelect,
      })
    : await prisma.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
        select: publicProfileSelect,
      });

  // Canonicalise username casing so shared/lowercased links resolve once.
  if (
    user?.username &&
    !isUUID &&
    user.username !== username &&
    user.username.toLowerCase() === username.toLowerCase()
  ) {
    redirect(`/user/${encodeURIComponent(user.username)}`);
  }

  logPublicProfileLookupDev({
    rawSegmentLen: rawSegment.length,
    normalizedLen: username.length,
    strategy: lookupStrategy,
    found: Boolean(user),
  });

  if (!user) {
    notFound();
  }

  if (user.accountDeletedAt) {
    notFound();
  }

  // 🔒 PRIVACY CHECK: Check if profile is public
  if (!user.showProfileToEveryone) {
    notFound(); // Return 404 to hide that the profile exists
  }

  // Public profile content does not wait on session; resolve ownership in parallel.
  const weekStart = mondayStartUtc();
  const [session, hcpStats, badgeRows, weekHcpAgg, lastHcpEvent, listingsThisWeek, publicContactChannels] =
    await Promise.all([
      getServerSession(authOptions as any),
      prisma.userHcpStats.findUnique({
        where: { userId: user.id },
        select: { totalHcp: true, currentStreak: true },
      }),
      prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: { select: { slug: true, name: true, iconKey: true } } },
        orderBy: { awardedAt: "desc" },
        take: 24,
      }),
      prisma.hcpEvent.aggregate({
        where: { userId: user.id, createdAt: { gte: weekStart } },
        _sum: { points: true },
      }),
      prisma.hcpEvent.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      user.SellerProfile?.id
        ? prisma.product.count({
            where: { sellerId: user.SellerProfile.id, createdAt: { gte: weekStart } },
          })
        : Promise.resolve(0),
      loadPublicContactChannelsForUser(user.id),
    ]);

  const viewerId = (session?.user as { id?: string } | undefined)?.id;
  const isOwnProfile = Boolean(viewerId && viewerId === user.id);

  const totalHcp = hcpStats?.totalHcp ?? 0;
  const level = hcpLevelFromTotal(totalHcp);
  const weeklyHcpEarned = weekHcpAgg._sum.points ?? 0;
  const activeThisWeek = lastHcpEvent?.createdAt
    ? Date.now() - new Date(lastHcpEvent.createdAt).getTime() < 7 * 86400000
    : false;
  const publicHcp = {
    totalHcp,
    level,
    levelTitle: hcpPublicLevelTitle(level),
    currentStreak: hcpStats?.currentStreak ?? 0,
    weeklyHcpEarned,
    activeThisWeek,
    badges: sortBadgesByDisplayPriority(
      badgeRows.map((ub) => ({
        key: ub.badge.slug,
        name: ub.badge.name,
        icon: iconKeyToDisplayIcon(ub.badge.iconKey),
      })),
    ),
  };

  const locality = formatCityLabel(user.place);
  const ecosystemChipKeys: string[] = [];
  if (locality) ecosystemChipKeys.push('ecosystemProfile.chips.localRooted');
  if (publicHcp.activeThisWeek || listingsThisWeek > 0) {
    ecosystemChipKeys.push('ecosystemProfile.chips.presentThisWeek');
  }
  if ((user.sellerRoles?.length ?? 0) > 0 && ecosystemChipKeys.length < 4) {
    ecosystemChipKeys.push('ecosystemProfile.chips.makerHere');
  }

  const currentDomain = await getCurrentDomain();
  const profileDisplay = getDisplayName(user);
  const canonicalUsername = user.username || username;
  const profileUrl = `${currentDomain}/user/${encodeURIComponent(canonicalUsername)}`;
  const imageUrl =
    user.profileImage?.startsWith("http")
      ? user.profileImage
      : user.profileImage
        ? `${currentDomain}${user.profileImage}`
        : null;
  const profileLd = buildProfilePageJsonLd({
    domain: currentDomain,
    displayName: profileDisplay,
    profileUrl,
    bio: user.bio,
    locality,
    imageUrl,
  });

  return (
    <>
      <Script
        id="profile-person-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileLd) }}
      />
      <div className="min-h-screen w-full min-w-0 max-w-[100vw] overflow-x-hidden bg-gray-50">
        <PublicProfileClient
          user={user as any}
          openNewProducts={false}
          isOwnProfile={isOwnProfile}
          publicHcp={publicHcp}
          ecosystemChipKeys={ecosystemChipKeys}
          publicContactChannels={publicContactChannels}
        />
      </div>
    </>
  );
}

// Generate static params for popular users (optional)
export async function generateStaticParams() {
  // Optioneel: pre-generate voor populaire gebruikers
  return [];
}
