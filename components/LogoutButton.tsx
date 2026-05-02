"use client";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';
import { clearAllUserData, clearNextAuthData } from '@/lib/session-cleanup';

export default function LogoutButton() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  if (!session) return null;
  return (
    <button
      className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition"
      onClick={async () => {
        clearAllUserData();
        try {
          await signOut({ callbackUrl: "/", redirect: true });
        } catch {
          clearNextAuthData();
          window.location.assign("/");
        }
      }}
      title={t('navigation.logout')}
    >
      {t('navigation.logout')}
    </button>
  );
}
