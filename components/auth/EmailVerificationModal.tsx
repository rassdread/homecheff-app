'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { X, Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export type EmailVerificationModalMode = 'soft' | 'required';
export type EmailVerificationRequiredReason = 'message' | 'create' | 'checkout' | 'generic';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  mode?: EmailVerificationModalMode;
  requiredReason?: EmailVerificationRequiredReason;
  initialSendOk?: boolean;
  providerUnavailable?: boolean;
  onVerified: () => void;
  onClose?: () => void;
  onLater?: () => void;
  /** Required mode: veilige uitweg wanneer e-mailprovider niet bereikbaar is */
  onNavigateBack?: () => void;
}

export default function EmailVerificationModal({
  isOpen,
  email,
  mode = 'soft',
  requiredReason = 'generic',
  initialSendOk = true,
  providerUnavailable = false,
  onVerified,
  onClose,
  onLater,
  onNavigateBack,
}: EmailVerificationModalProps) {
  const { t, language } = useTranslation();
  const isRequired = mode === 'required';
  const lastResendAtRef = useRef(0);
  const PROVIDER_RESEND_COOLDOWN_MS = 45_000;
  const [step, setStep] = useState<'intro' | 'code'>(() => (isRequired ? 'code' : 'intro'));
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [providerDown, setProviderDown] = useState(false);
  const [hasRequestedCode, setHasRequestedCode] = useState(false);

  const canSendResendNow = useCallback(() => {
    if (!providerDown) return true;
    const now = Date.now();
    const prev = lastResendAtRef.current;
    if (prev > 0 && now - prev < PROVIDER_RESEND_COOLDOWN_MS) {
      const sec = Math.ceil((PROVIDER_RESEND_COOLDOWN_MS - (now - prev)) / 1000);
      setError(t('emailVerification.resendDebounced', { seconds: String(sec) }));
      return false;
    }
    lastResendAtRef.current = now;
    return true;
  }, [providerDown, t]);

  const ProviderDownLinks = () => (
    <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left text-sm text-slate-700">
      <p>{t('emailVerification.providerDownLinksIntro')}</p>
      <div className="flex flex-col gap-2">
        <Link
          href="/profile"
          className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
        >
          {t('emailVerification.changeEmailCta')}
        </Link>
        <Link
          href="/contact"
          className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
        >
          {t('emailVerification.contactSupportCta')}
        </Link>
        <Link
          href="/verify-email"
          className="text-slate-600 underline underline-offset-2 hover:text-slate-800"
        >
          {t('emailVerification.openVerifyPage')}
        </Link>
      </div>
    </div>
  );

  useEffect(() => {
    if (!isOpen) return;
    setStep(isRequired ? 'code' : 'intro');
    setCode('');
    setError(null);
    setSuccess(false);
    setResendSuccess(false);
    setProviderDown(
      Boolean(providerUnavailable) || (isRequired && initialSendOk === false),
    );
    setHasRequestedCode(false);
  }, [isOpen, isRequired, providerUnavailable, initialSendOk]);

  useEffect(() => {
    if (!providerDown) {
      lastResendAtRef.current = 0;
    }
  }, [providerDown]);

  const requiredTitle = t('emailVerification.requiredTitle');
  const requiredBody = (() => {
    switch (requiredReason) {
      case 'message':
        return t('emailVerification.requiredReasonMessage');
      case 'create':
        return t('emailVerification.requiredReasonCreate');
      case 'checkout':
        return t('emailVerification.requiredReasonCheckout');
      default:
        return t('emailVerification.requiredReasonGeneric');
    }
  })();

  const applyResendResponse = useCallback(
    async (response: Response) => {
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        generic?: boolean;
        code?: string;
        retryAfterSec?: number;
      };

      if (response.status === 429 && data?.code === 'RATE_LIMITED') {
        const sec = typeof data.retryAfterSec === 'number' ? data.retryAfterSec : 60;
        setError(t('emailVerification.resendRateLimited', { seconds: String(sec) }));
        return false;
      }

      if (response.status === 409 && data?.code === 'ALREADY_VERIFIED') {
        setError(t('emailVerification.resendAlreadyVerified'));
        return false;
      }

      if (response.status === 503 || data?.code === 'EMAIL_UNAVAILABLE') {
        setProviderDown(true);
        lastResendAtRef.current = Date.now();
        setError(t('emailVerification.emailSendFailed'));
        return false;
      }

      if (response.status === 500 && data?.code === 'EMAIL_NOT_CONFIGURED') {
        setProviderDown(true);
        lastResendAtRef.current = Date.now();
        setError(t('emailVerification.emailNotConfiguredHint'));
        return false;
      }

      if (response.status === 400 || data?.code === 'INVALID_EMAIL') {
        setError(t('emailVerification.resendInvalidEmail'));
        return false;
      }

      if (response.ok && data.success) {
        setProviderDown(false);
        setHasRequestedCode(true);
        setResendSuccess(true);
        setError(null);
        return true;
      }

      setError(t('emailVerification.resendGenericError'));
      return false;
    },
    [t],
  );

  const postResend = useCallback(async () => {
    const locale = language === 'en' ? 'en' : 'nl';
    return fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale }),
    });
  }, [email, language]);

  const handleVerifyNow = async () => {
    setError(null);
    setResendSuccess(false);

    if (initialSendOk && !providerUnavailable) {
      setStep('code');
      return;
    }

    if (!canSendResendNow()) return;

    setIsResending(true);
    try {
      const response = await postResend();
      const ok = await applyResendResponse(response);
      if (ok) setStep('code');
    } catch {
      setError(t('emailVerification.resendNetworkError'));
    } finally {
      setIsResending(false);
    }
  };

  const handleLater = () => {
    onLater?.();
    onClose?.();
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError(t('emailVerification.verifyCodeError'));
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; success?: boolean };

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        onVerified();
      } else {
        setError(data.error || t('emailVerification.verifyInvalid'));
      }
    } catch {
      setError(t('emailVerification.verifyNetworkError'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendSuccess(false);

    if (!canSendResendNow()) return;

    setIsResending(true);

    try {
      const response = await postResend();
      await applyResendResponse(response);
    } catch {
      setError(t('emailVerification.resendNetworkError'));
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  if (!isOpen) return null;

  const showIntro = !isRequired && step === 'intro';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {!isRequired && showIntro ? (
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-hidden
          onClick={handleLater}
        />
      ) : null}
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-200 z-[1]"
        onClick={(e) => e.stopPropagation()}
      >
        {!isRequired && (showIntro || step === 'code') && (onClose || onLater) ? (
          <button
            onClick={showIntro ? handleLater : () => setStep('intro')}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showIntro ? t('emailVerification.later') : t('common.close')}
            type="button"
          >
            {step === 'code' && !isRequired ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        ) : null}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          {showIntro ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('emailVerification.softIntroTitle')}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{t('emailVerification.softIntroBody')}</p>
            </>
          ) : isRequired ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{requiredTitle}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{requiredBody}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('emailVerification.title')}</h2>
              <p className="text-gray-600 text-sm">
                {hasRequestedCode
                  ? t('emailVerification.descriptionAfterSent')
                  : t('emailVerification.descriptionBeforeSent')}
              </p>
            </>
          )}
          <p className="text-emerald-600 font-medium mt-2 break-all">{email}</p>
        </div>

        {providerUnavailable && showIntro ? (
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <p className="text-amber-900 text-sm">{t('emailVerification.emailSendFailed')}</p>
            </div>
            <ProviderDownLinks />
          </div>
        ) : null}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm">{t('emailVerification.success')}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {resendSuccess && step === 'code' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 text-sm">{t('emailVerification.resendSuccess')}</p>
          </div>
        )}

        {showIntro && !success ? (
          <div className="space-y-3">
            <p className="text-sm text-center text-slate-600 leading-relaxed px-1">
              {providerUnavailable || providerDown
                ? t('emailVerification.explainProviderDown')
                : t('emailVerification.explainRequestCode')}
            </p>
            <button
              type="button"
              onClick={handleVerifyNow}
              disabled={isResending}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? t('emailVerification.resending')
                : initialSendOk && !providerUnavailable
                  ? t('emailVerification.continueToCodeCta')
                  : t('emailVerification.requestCodeCta')}
            </button>
            <button
              type="button"
              onClick={handleLater}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              {t('emailVerification.later')}
            </button>
            {providerDown ? <ProviderDownLinks /> : null}
          </div>
        ) : null}

        {!success && !showIntro && (
          <>
            {isRequired && providerDown && onNavigateBack ? (
              <div className="mb-6 space-y-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left">
                  <p className="text-sm text-amber-900">
                    {t('emailVerification.requiredProviderUnavailableBody')}
                  </p>
                </div>
                <ProviderDownLinks />
                <button
                  type="button"
                  onClick={() => onNavigateBack()}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('emailVerification.continueBrowsing')}
                </button>
              </div>
            ) : null}
            {!(isRequired && providerDown && onNavigateBack) ? (
              <div className="mb-4 text-center text-sm px-1">
                {!providerDown ? (
                  <p className="text-slate-600 leading-relaxed">
                    {hasRequestedCode
                      ? t('emailVerification.descriptionAfterSent')
                      : t('emailVerification.explainRequestCode')}
                  </p>
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900 leading-relaxed">
                    {t('emailVerification.explainProviderDown')}
                  </p>
                )}
              </div>
            ) : null}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emailVerification.codeLabel')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isVerifying}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">{t('emailVerification.codeHint')}</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || code.length !== 6}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    {t('emailVerification.verifying')}
                  </>
                ) : (
                  t('emailVerification.verify')
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('emailVerification.resending')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {hasRequestedCode
                      ? t('emailVerification.resendCodeCta')
                      : t('emailVerification.requestCodeCta')}
                  </>
                )}
              </button>
            </div>
            {providerDown && !(isRequired && onNavigateBack) ? <ProviderDownLinks /> : null}
          </>
        )}

        {!showIntro && !success ? (
          <p className="text-xs text-gray-500 text-center mt-6">{t('emailVerification.info')}</p>
        ) : null}
      </div>
    </div>
  );
}
