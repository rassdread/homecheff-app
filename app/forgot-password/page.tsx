"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("passwordReset.genericError")
        );
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError(t("passwordReset.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-emerald-50 via-white to-stone-100">
      <div className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-stone-900 text-center mb-1">
          {t("passwordReset.forgotTitle")}
        </h1>
        <p className="text-sm text-stone-600 text-center mb-6">
          {t("passwordReset.forgotSubtitle")}
        </p>

        {done ? (
          <div
            className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 text-sm"
            role="status"
          >
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <p>{t("passwordReset.emailSentConfirmation")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="w-5 h-5 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                {t("passwordReset.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("passwordReset.emailPlaceholder")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading ? t("passwordReset.submitting") : t("passwordReset.submit")}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {t("passwordReset.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
