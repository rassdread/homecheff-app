import { prisma } from "@/lib/prisma";

async function getMe() {
  // Probeer NextAuth v5
  try {
  const mod: any = await import("@/lib/auth");
    const session = await mod.auth();
    const email: string | undefined = session?.user?.email;
    if (!email) return null;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, image: true },
    });
    return user;
  } catch {}

  // V4 fallback
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    const email: string | undefined = (session as any)?.user?.email;
    if (!email) return null;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, image: true },
    });
    return user;
  } catch {}

  // Dev fallback (geen sessie)
  const user = await prisma.user.findFirst({
    select: { id: true, name: true, email: true, image: true },
    orderBy: { createdAt: "desc" }
  });
  return user;
}

export default async function ProfileSummary() {
  const me = await getMe();
  if (!me) {
    return (
      <div className="rounded-xl border p-4 bg-white">
        <p className="text-sm text-muted-foreground">Geen gebruiker gevonden. Log in om je profiel te bekijken.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border p-4 bg-white flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={me.image ?? "/avatar-placeholder.png"}
        alt="avatar"
        className="w-16 h-16 rounded-full object-cover border"
      />
      <div>
        <p className="font-medium">{me.name ?? "Naam onbekend"}</p>
        <p className="text-sm text-muted-foreground">{me.email}</p>
      </div>
    </div>
  );
}
