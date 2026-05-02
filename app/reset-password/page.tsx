"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!token) setError(t("passwordReset.missingToken"));
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return;
    if (password !== confirm) {
      setError(t("passwordReset.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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
      setOk(true);
      setTimeout(() => router.push("/login?message=password-reset"), 2500);
    } catch {
      setError(t("passwordReset.networkError"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t("passwordReset.missingToken")}
      </div>
    );
  }

  if (ok) {
    return (
      <div
        className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 text-sm"
        role="status"
      >
        <CheckCircle className="w-5 h-5 shrink-0" aria-hidden />
        <p>{t("passwordReset.successRedirect")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="np" className="block text-sm font-medium text-stone-700 mb-1">
          {t("passwordReset.newPassword")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            id="np"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-12 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-500"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide" : "Show"}
          >
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="npc" className="block text-sm font-medium text-stone-700 mb-1">
          {t("passwordReset.confirmPassword")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            id="npc"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
      >
        {loading ? "…" : t("passwordReset.savePassword")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-emerald-50 via-white to-stone-100">
      <div className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-stone-900 text-center mb-1">
          {t("passwordReset.resetTitle")}
        </h1>
        <p className="text-sm text-stone-600 text-center mb-6">
          {t("passwordReset.resetSubtitle")}
        </p>
        <Suspense
          fallback={
            <div className="h-32 flex items-center justify-center text-stone-500 text-sm">
              …
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
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
