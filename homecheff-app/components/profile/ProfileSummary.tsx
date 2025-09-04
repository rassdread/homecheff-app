// components/profile/ProfileSummary.tsx — SERVER component
import { prisma } from "@/lib/prisma";
import ProfileAvatar from "@/components/profile/ProfileAvatar";

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
    return (
  <div className="rounded-xl border p-2 bg-white">
        <p className="text-sm text-muted-foreground">Geen gebruiker gevonden. Log in om je profiel te bekijken.</p>
      </div>
    );
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
    const debugId = Math.floor(Math.random() * 100000);
    return (
  <div className="flex flex-col items-center text-center border-2 border-red-500 relative" style={{background: '#F6F8FA', gap: '0.3em', paddingTop: '0.5em', paddingBottom: '0.5em'}}>
        <div className="absolute top-2 right-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs z-50">DEBUG: {debugId}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
  <div style={{position: 'relative', width: '48px', height: '48px', margin: '0.15rem'}}>
          <img
            src={me.image ?? "/avatar-placeholder.png"}
            alt="Profielfoto"
            className="object-cover border bg-gray-200"
            style={{width: '48px', height: '48px', borderRadius: '9999px'}}
            onError={e => {
              e.currentTarget.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.style.width = '48px';
              fallback.style.height = '48px';
              fallback.style.display = 'flex';
              fallback.style.alignItems = 'center';
              fallback.style.justifyContent = 'center';
              fallback.style.background = '#e5e7eb';
              fallback.style.borderRadius = '9999px';
              fallback.innerHTML = `<svg width='48' height='48' fill='currentColor' viewBox='0 0 24 24'><path d='M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z'/></svg>`;
              e.currentTarget.parentElement?.appendChild(fallback);
            }}
          />
          <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', color: '#006D52', fontSize: '9px', textAlign: 'center', borderRadius: '0 0 9999px 9999px', padding: '1px 0', opacity: 0.7}}>
            {me.image ?? "/avatar-placeholder.png"}
          </div>
        </div>
        <div className="mt-2 font-semibold" style={{ fontSize: '2em', color: '#171717', fontWeight: 700 }}>
          {me.username ?? me.name ?? "Gebruiker"}
        </div>

        {/* Props (met icoon) */}
  <div className="mt-0 inline-flex items-center gap-0.5">
          <span
            className="inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 bg-white border-primary/50"
            style={{ color: '#171717', fontSize: '1.3em', fontWeight: 700 }}
            title="Props ontvangen"
          >
            {/* Inline icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-0zM10 5a1 1 0 1 1 2 0v4h-2V5zM5 11h9v8H5v-8z"/>{/* simple lock-like/thumb icon */}
            </svg>
            {propsCount} {propsLabel}
          </span>
          <span className="text-sm text-gray-700">
            <span style={{ color: '#171717', fontSize: '2em', fontWeight: 700 }}>{fansCount}</span> <span style={{ color: '#171717', fontSize: '2em', fontWeight: 700 }}>{fansLabel}</span>
          </span>
        </div>
      </div>
    );
  }

  if (avatarOnly) {
    return <ProfileAvatar imageUrl={me.image ?? undefined} />;
  }
}
