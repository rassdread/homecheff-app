import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicProfileClient from "./PublicProfileClient";

export const revalidate = 0;

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;

  // Haal gebruiker op via username
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
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
      createdAt: true,
      // Publieke producten (alleen gepubliceerde)
      Dish: {
        where: {
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          description: true,
          priceCents: true,
          stock: true,
          maxStock: true,
          place: true,
          status: true,
          createdAt: true,
          photos: {
            select: { url: true, idx: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicProfileClient user={user as any} />
    </div>
  );
}

// Generate static params for popular users (optional)
export async function generateStaticParams() {
  // Optioneel: pre-generate voor populaire gebruikers
  return [];
}
