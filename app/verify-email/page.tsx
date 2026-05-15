"use client";
import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Mail, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

type VerificationState = {
  status: "loading" | "success" | "error" | "expired" | "pending";
  message: string;
  email?: string;
  canResend: boolean;
  isResending: boolean;
  mailDown?: boolean;
};

function VerifyEmailContent() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const email = searchParams?.get("email");

  const [state, setState] = useState<VerificationState>({
    status: "pending",
    message: "",
    email: email || "",
    canResend: false,
    isResending: false,
    mailDown: false,
  });
  const [hasRequestedCode, setHasRequestedCode] = useState(false);

  const lastResendAtRef = useRef(0);
  const MAIL_DOWN_COOLDOWN_MS = 45_000;

  const verifyEmail = useCallback(
    async (verificationToken: string) => {
      setState((prev) => ({
        ...prev,
        status: "loading",
        message: t("verifyEmailPage.verifying"),
      }));

      try {
        const response = await fetch(
          `/api/auth/verify-email-simple?token=${verificationToken}`,
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setState({
            status: "success",
            message: typeof data.message === "string" ? data.message : "",
            email: data.user?.email || email || "",
            canResend: false,
            isResending: false,
          });
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          setState({
            status: "error",
            message: data.error || t("verifyEmailPage.verifyFailed"),
            email: email || "",
            canResend: true,
            isResending: false,
          });
        }
      } catch (error) {
        console.error("Verification error:", error);
        setState({
          status: "error",
          message: t("verifyEmailPage.verifyError"),
          email: email || "",
          canResend: true,
          isResending: false,
        });
      }
    },
    [t, router, email],
  );

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  const resendVerification = async () => {
    if (!state.email) {
      setState((prev) => ({
        ...prev,
        message: t("verifyEmailPage.emailRequired"),
      }));
      return;
    }

    if (state.mailDown) {
      const now = Date.now();
      const prev = lastResendAtRef.current;
      if (prev > 0 && now - prev < MAIL_DOWN_COOLDOWN_MS) {
        const sec = Math.ceil((MAIL_DOWN_COOLDOWN_MS - (now - prev)) / 1000);
        setState((prev) => ({
          ...prev,
          message: t("verifyEmailPage.resendWaitMailDown", { seconds: String(sec) }),
          isResending: false,
        }));
        return;
      }
    }
    lastResendAtRef.current = Date.now();

    setState((prev) => ({
      ...prev,
      isResending: true,
      message: hasRequestedCode
        ? t("verifyEmailPage.resendingMail")
        : t("verifyEmailPage.sendingMail"),
    }));

    try {
      const locale = language === "en" ? "en" : "nl";
      const response = await fetch("/api/auth/resend-verification-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, locale }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        code?: string;
        retryAfterSec?: number;
      };

      if (response.ok && data.success) {
        setHasRequestedCode(true);
        setState((prev) => ({
          ...prev,
          status: "pending",
          message: data.message || t("verifyEmailPage.codeSentOk"),
          canResend: false,
          isResending: false,
          mailDown: false,
        }));
        return;
      }

      if (response.status === 429 && data.code === "RATE_LIMITED") {
        const sec =
          typeof data.retryAfterSec === "number" ? data.retryAfterSec : 60;
        setState((prev) => ({
          ...prev,
          message: t("verifyEmailPage.rateLimited", { seconds: String(sec) }),
          isResending: false,
        }));
        return;
      }

      if (response.status === 409 && data.code === "ALREADY_VERIFIED") {
        setState((prev) => ({
          ...prev,
          message: t("verifyEmailPage.alreadyVerified"),
          isResending: false,
        }));
        return;
      }

      if (response.status === 503 || data.code === "EMAIL_UNAVAILABLE") {
        setState((prev) => ({
          ...prev,
          message: t("verifyEmailPage.mailUnavailable"),
          isResending: false,
          mailDown: true,
        }));
        return;
      }

      if (response.status === 500 && data.code === "EMAIL_NOT_CONFIGURED") {
        setState((prev) => ({
          ...prev,
          message: t("verifyEmailPage.mailNotConfigured"),
          isResending: false,
          mailDown: true,
        }));
        return;
      }

      if (response.status === 400 || data.code === "INVALID_EMAIL") {
        setState((prev) => ({
          ...prev,
          message: t("verifyEmailPage.invalidEmail"),
          isResending: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        message: t("verifyEmailPage.resendFailed"),
        isResending: false,
      }));
    } catch (error) {
      console.error("Resend error:", error);
      setState((prev) => ({
        ...prev,
        message: t("verifyEmailPage.resendNetworkError"),
        isResending: false,
      }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, email: e.target.value }));
  };

  const title =
    state.status === "success"
      ? t("verifyEmailPage.titleSuccess")
      : state.status === "error" || state.status === "expired"
        ? t("verifyEmailPage.titleError")
        : t("verifyEmailPage.titlePending");

  const subtitle =
    state.status === "success"
      ? t("verifyEmailPage.subtitleSuccess")
      : state.status === "error" || state.status === "expired"
        ? t("verifyEmailPage.subtitleError")
        : t("verifyEmailPage.subtitlePending");

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {state.status === "success" ? (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              ) : state.status === "error" || state.status === "expired" ? (
                <AlertCircle className="w-8 h-8 text-red-600" />
              ) : (
                <Mail className="w-8 h-8 text-emerald-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {state.message && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                state.status === "success"
                  ? "bg-green-50 border border-green-200"
                  : state.status === "error" || state.status === "expired"
                    ? "bg-red-50 border border-red-200"
                    : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-center">
                {state.status === "loading" && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3" />
                )}
                <p
                  className={`text-sm ${
                    state.status === "success"
                      ? "text-green-800"
                      : state.status === "error" || state.status === "expired"
                        ? "text-red-800"
                        : "text-blue-800"
                  }`}
                >
                  {state.message}
                </p>
              </div>
            </div>
          )}

          {state.canResend && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("verifyEmailPage.emailLabel")}
              </label>
              <input
                type="email"
                value={state.email}
                onChange={handleEmailChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t("verifyEmailPage.emailPlaceholder")}
              />
            </div>
          )}

          <div className="space-y-3">
            {state.status === "success" && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {t("verifyEmailPage.redirectHome")}
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  {t("verifyEmailPage.toHome")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}

            {state.status === "error" || state.status === "expired" ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-slate-600 leading-relaxed">
                  {state.mailDown
                    ? t("emailVerification.explainProviderDown")
                    : t("emailVerification.explainRequestCode")}
                </p>
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={state.isResending || !state.email}
                  className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {state.isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {t("emailVerification.resending")}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {hasRequestedCode
                        ? t("emailVerification.resendCodeCta")
                        : t("emailVerification.requestCodeCta")}
                    </>
                  )}
                </button>

                <Link
                  href="/login"
                  className="block w-full text-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t("verifyEmailPage.backToLogin")}
                </Link>
              </div>
            ) : state.status === "pending" && !token ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t("verifyEmailPage.introPending")}
                </p>
                <p className="text-sm text-slate-600">
                  {state.mailDown
                    ? t("emailVerification.explainProviderDown")
                    : t("emailVerification.explainRequestCode")}
                </p>
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={state.isResending || !state.email}
                  className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {state.isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {t("emailVerification.resending")}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {hasRequestedCode
                        ? t("emailVerification.resendCodeCta")
                        : t("emailVerification.requestCodeCta")}
                    </>
                  )}
                </button>

                <Link
                  href="/login"
                  className="block w-full text-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t("verifyEmailPage.backToLogin")}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t("verifyEmailPage.helpTitle")}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• {t("verifyEmailPage.helpSpam")}</li>
              <li>• {t("verifyEmailPage.helpExpiry")}</li>
              <li>
                •{" "}
                <Link
                  href="/profile"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  {t("verifyEmailPage.helpProfile")}
                </Link>
              </li>
              <li>
                •{" "}
                <Link
                  href="/contact"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  {t("verifyEmailPage.helpContact")}
                </Link>{" "}
                {t("verifyEmailPage.helpSupport")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">…</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
