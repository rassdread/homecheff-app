/** Shared Prisma include for public listing product core. */

export const listingProductCoreInclude = {
  seller: {
    select: {
      id: true,
      lat: true,
      lng: true,
      kvk: true,
      companyName: true,
      commerceDeclaration: true,
      User: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
          image: true,
          place: true,
          city: true,
          lat: true,
          lng: true,
          displayFullName: true,
          displayNameOption: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
          Business: {
            select: { verified: true },
          },
        },
      },
    },
  },
  Image: {
    select: { id: true, fileUrl: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  Video: {
    select: {
      id: true,
      url: true,
      thumbnail: true,
      duration: true,
      createdAt: true,
    },
  },
} as const;
