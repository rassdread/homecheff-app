/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentUserWithSeller() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { sellerProfile: true },
  });
  return user;
}
