"use client";
import { useSession } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';
import { performLogout } from '@/lib/session-cleanup';

export default function LogoutButton() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  if (!session) return null;
  return (
    <button
      className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition"
      onClick={() => {
        // Geen await: Safari blokkeert anders soms de hard navigation als de await te lang duurt.
        // performLogout doet zelf window.location.assign aan het einde.
        void performLogout('/');
      }}
      title={t('navigation.logout')}
    >
      {t('navigation.logout')}
    </button>
  );
}
