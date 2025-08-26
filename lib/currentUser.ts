import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentUserWithSeller() {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { sellerProfile: true },
  });
  return user;
}
