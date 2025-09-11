import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function ProfileSummaryInfo({ type }: { type: "name" | "stats" }) {
  // Haal user info op
  let me = null;
  try {
    const session = await auth();
    const email: string | undefined = session?.user?.email;
    if (email) {
      me = await prisma.user.findUnique({
        where: { email },
        select: { id: true, username: true, name: true },
      });
    }
  } catch {}
  if (!me) {
    me = await prisma.user.findFirst({
      select: { id: true, username: true, name: true },
      orderBy: { createdAt: "desc" }
    });
  }
  if (!me) return null;
  if (type === "name") {
    return <span className="text-2xl font-bold text-emerald-700 font-sans drop-shadow-sm">{me.username ?? me.name ?? "Gebruiker"}</span>;
  }
  if (type === "stats") {
    // Fans en props ophalen
    let fansCount = 0;
    let propsCount = 0;
    try {
      const anyPrisma: any = prisma as any;
      if (anyPrisma.follow?.count) {
        fansCount = await anyPrisma.follow.count({ where: { sellerId: me.id } });
      }
      if (anyPrisma.prop?.count) {
        propsCount = await anyPrisma.prop.count({ where: { targetUserId: me.id } });
      }
    } catch {}
    return (
      <>
        <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white text-primary border-primary/50 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-0zM10 5a1 1 0 1 1 2 0v4h-2V5zM5 11h9v8H5v-8z"/>
          </svg>
          {propsCount} Props
        </span>
        <span className="text-sm text-emerald-700 font-semibold ml-2">
          <span className="font-bold">{fansCount}</span> Fan{fansCount === 1 ? "" : "s"}
        </span>
      </>
    );
  }
  return null;
}