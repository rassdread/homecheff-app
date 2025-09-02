import { prisma } from "@/lib/prisma";

async function getMe() {
  try {
  const mod: any = await import("@/lib/auth");
    const session = await mod.auth();
    const email: string | undefined = session?.user?.email;
    if (!email) return null;
    return prisma.user.findUnique({ where: { email }, select: { id: true, username: true, name: true } });
  } catch {}
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    const email: string | undefined = (session as any)?.user?.email;
    if (!email) return null;
    return prisma.user.findUnique({ where: { email }, select: { id: true, username: true, name: true } });
  } catch {}
  return null;
}

export default async function UsernameForm() {
  const me = await getMe();
  const current = me?.username ?? "";
  return (
    <form action="/api/profile/username" method="post" className="flex gap-3 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium">Gebruikersnaam</label>
        <input
          name="username"
          defaultValue={current}
          placeholder="bijv. chefsergio"
          className="w-full mt-1 rounded-xl border px-3 py-2"
          required
          minLength={3}
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground mt-1">Dit wordt zichtbaar op je profiel.</p>
      </div>
      <button className="rounded-xl px-4 py-2 border shadow-sm hover:shadow transition" type="submit">Opslaan</button>
    </form>
  );
}
