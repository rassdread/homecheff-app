// components/profile/ProfileSummary.tsx — SERVER component (clean, no duplicate avatar)
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileSummaryInfo from "@/components/profile/ProfileSummaryInfo";

type Props = {
  avatarOnly?: boolean;
  stacked?: boolean;
  size?: number; // avatar size in px
  showAvatar?: boolean; // NEW: default false to prevent duplicates if used with PhotoUploader
};

export default async function ProfileSummary({ avatarOnly = false, stacked = true, size = 200, showAvatar = false }: Props) {
  let me: { image?: string | null; profileImage?: string | null; username?: string | null; name?: string | null } | null = null;
  try {
    const session = await auth();
    const email: string | undefined = session?.user?.email || undefined;
    
    // DEBUG: Log session data for privacy investigation

    if (email) {
      me = await prisma.user.findUnique({
        where: { email },
        select: { image: true, profileImage: true, username: true, name: true },
      });
      
      // DEBUG: Log found user data

    }
  } catch (error) {
    console.error('🔍 PROFILE SUMMARY ERROR:', error);
    me = null;
  }

  const name = me?.username || me?.name || "Gebruiker";

  if (avatarOnly) {
    return (
      <div className="flex items-center justify-center">
        <ProfileAvatar imageUrl={me?.profileImage ?? me?.image ?? undefined} size={size} />
      </div>
    );
  }

  return (
    <div className={stacked ? "flex flex-col items-center text-center" : "flex items-center gap-4"}>
      {showAvatar ? <ProfileAvatar imageUrl={me?.profileImage ?? me?.image ?? undefined} size={size} /> : null}
      <div className={stacked ? (showAvatar ? "mt-3" : "") : ""}>
        <div className="text-2xl font-bold text-emerald-700">{name}</div>
        <div className="mt-1 flex items-center gap-3">
          {/* Props & Fans */}
          <ProfileSummaryInfo type="stats" />
        </div>
      </div>
    </div>
  );
}
