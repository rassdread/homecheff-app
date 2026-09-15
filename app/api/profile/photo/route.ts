import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const { image } = await req.json();
  // Allow null values for removing photo
  if (
    typeof image === "string" &&
    (image.startsWith("blob:") || image.startsWith("data:"))
  ) {
    return Response.json(
      { error: "Profielfoto moet een duurzame publieke URL zijn." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("User not found", { status: 404 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { 
      image: image,
      profileImage: image 
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/api/feed");

  return Response.json({ ok: true, image: image ?? null });
}
