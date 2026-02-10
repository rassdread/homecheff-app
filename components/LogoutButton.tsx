"use client";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';

export default function LogoutButton() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  if (!session) return null;
  return (
    <button
      className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition"
      onClick={async () => {
        await signOut({ callbackUrl: "/" });
        window.location.href = "/";
      }}
      title={t('navigation.logout')}
    >
      {t('navigation.logout')}
    </button>
  );
}
