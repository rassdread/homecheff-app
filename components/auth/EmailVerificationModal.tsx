'use client';

import { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  onVerified: () => void;
  onClose?: () => void;
}

export default function EmailVerificationModal({
  isOpen,
  email,
  onVerified,
  onClose,
}: EmailVerificationModalProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(null);
      setSuccess(false);
      setResendSuccess(false);
    }
  }, [isOpen]);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: code }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; success?: boolean };

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        generic?: boolean;
        code?: string;
        retryAfterSec?: number;
      };

      if (response.status === 429 && data?.code === 'RATE_LIMITED') {
        const sec = typeof data.retryAfterSec === 'number' ? data.retryAfterSec : 60;
        setError(t('emailVerification.resendRateLimited', { seconds: String(sec) }));
        return;
      }

      if (response.status === 409 && data?.code === 'ALREADY_VERIFIED') {
        setError(t('emailVerification.resendAlreadyVerified'));
        return;
      }

      if (response.status === 503 || data?.code === 'EMAIL_UNAVAILABLE') {
        setError(t('emailVerification.resendServiceUnavailable'));
        return;
      }

      if (response.status === 400 || data?.code === 'INVALID_EMAIL') {
        setError(t('emailVerification.resendInvalidEmail'));
        return;
      }

      if (response.ok && data.success) {
        setResendSuccess(true);
        return;
      }

      setError(t('emailVerification.resendGenericError'));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-200">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('common.close')}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('emailVerification.title')}</h2>
          <p className="text-gray-600 text-sm">{t('emailVerification.description')}</p>
          <p className="text-emerald-600 font-medium mt-2">{email}</p>
        </div>

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

        {resendSuccess && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 text-sm">{t('emailVerification.resendSuccess')}</p>
          </div>
        )}

        {!success && (
          <>
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
                    {t('emailVerification.resend')}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">{t('emailVerification.info')}</p>
      </div>
    </div>
  );
}
