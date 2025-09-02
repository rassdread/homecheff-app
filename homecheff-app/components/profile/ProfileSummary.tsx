// components/profile/ProfileSummary.tsx — SERVER component
import { prisma } from "@/lib/prisma";

type Props = { avatarOnly?: boolean; stacked?: boolean };

async function getMe() {
  try {
    const mod: any = await import("@/lib/auth");
    const session = await mod.auth();
    const email: string | undefined = session?.user?.email;
    if (!email) return null;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, name: true, email: true, image: true },
    });
    return user;
  } catch {}

  // Dev fallback
  const user = await prisma.user.findFirst({
    select: { id: true, username: true, name: true, email: true, image: true },
    orderBy: { createdAt: "desc" }
  });
  return user;
}

export default async function ProfileSummary({ avatarOnly, stacked }: Props) {
  const me = await getMe();
  if (!me) {
    return avatarOnly ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={"/avatar-placeholder.png"} alt="avatar" className="w-full h-full object-cover" />
    ) : (
      <div className="rounded-xl border p-4 bg-white">
        <p className="text-sm text-muted-foreground">Geen gebruiker gevonden. Log in om je profiel te bekijken.</p>
      </div>
    );
  }

  if (avatarOnly) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={me.image ?? "/avatar-placeholder.png"} alt="avatar" className="w-full h-full object-cover" />;
  }

  // Fans = aantal volgers (mensen die mij volgen)
  let fansCount = 0;
  try {
    const anyPrisma: any = prisma as any;
    if (anyPrisma.follow?.count) {
      fansCount = await anyPrisma.follow.count({ where: { sellerId: me.id } });
    }
  } catch {}

  const fansLabel = fansCount === 1 ? "Fan" : "Fans";

  // Props = likes. Label is ALTIJD "Props" (geen enkelvoud), optioneel via Prop-tabel
  let propsCount = 0;
  try {
    const anyPrisma: any = prisma as any;
    if (anyPrisma.prop?.count) {
      propsCount = await anyPrisma.prop.count({ where: { targetUserId: me.id } });
    }
  } catch {}
  const propsLabel = "Props";

  if (stacked) {
    return (
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={me.image ?? "/avatar-placeholder.png"}
          alt="avatar"
          className="w-40 h-40 rounded-full object-cover border"
        />
        <div className="mt-3 font-semibold">{me.username ?? me.name ?? "Gebruiker"}</div>

        {/* Props (met icoon) */}
        <div className="mt-1 inline-flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-white text-primary border-primary/50"
            title="Props ontvangen"
          >
            {/* Inline icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-0zM10 5a1 1 0 1 1 2 0v4h-2V5zM5 11h9v8H5v-8z"/>{/* simple lock-like/thumb icon */}
            </svg>
            {propsCount} {propsLabel}
          </span>
          <span className="text-sm text-gray-700">
            <span className="font-medium text-primary">{fansCount}</span> {fansLabel}
          </span>
        </div>
      </div>
    );
  }

  // Default kaartvariant
  return (
    <div className="rounded-xl border p-4 bg-white flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={me.image ?? "/avatar-placeholder.png"}
        alt="avatar"
        className="w-16 h-16 rounded-full object-cover border"
      />
      <div>
        <p className="font-medium">{me.username ?? me.name ?? "Gebruiker"}</p>
        <div className="text-sm text-gray-700 flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            {/* icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-0zM10 5a1 1 0 1 1 2 0v4h-2V5zM5 11h9v8H5v-8z"/>
            </svg>
            {propsCount} {propsLabel}
          </span>
          <span>
            <span className="font-medium text-primary">{fansCount}</span> {fansLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
