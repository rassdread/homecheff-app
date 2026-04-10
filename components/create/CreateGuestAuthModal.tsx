"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  open: boolean;
  /** X / backdrop: sluit modal en wist create-intent (gebruiker breekt af). */
  onAbandon: () => void;
  /** Na klik op Inloggen of Aanmelden: alleen modal dicht, intent blijft voor na login. */
  onAuthNavigate: () => void;
  loginHref: string;
  registerHref: string;
};

export default function CreateGuestAuthModal({
  open,
  onClose,
  loginHref,
  registerHref,
}: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-guest-auth-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onAbandon();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-brand to-primary-600 p-5 text-white relative">
          <button
            type="button"
            onClick={onAbandon}
            className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label={t("buttons.close")}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 id="create-guest-auth-title" className="text-xl font-bold pr-10">
            {t("navbar.verdienenGuestTitle")}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {t("navbar.verdienenGuestBody")}
          </p>
          <div className="space-y-3">
            <Link
              href={loginHref}
              onClick={onAuthNavigate}
              className="border-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all w-full no-underline"
            >
              {t("navbar.login")}
            </Link>
            <Link
              href={registerHref}
              onClick={onAuthNavigate}
              className="bg-gradient-to-r from-primary-brand to-primary-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all w-full no-underline"
            >
              {t("navbar.register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
