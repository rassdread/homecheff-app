'use client';

import { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  verificationCode?: string;
  onVerified: () => void;
  onClose?: () => void;
}

export default function EmailVerificationModal({
  isOpen,
  email,
  verificationCode,
  onVerified,
  onClose
}: EmailVerificationModalProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Auto-fill code if provided
  useEffect(() => {
    if (verificationCode && isOpen) {
      setCode(verificationCode);
    }
  }, [verificationCode, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode(verificationCode || '');
      setError(null);
      setSuccess(false);
      setResendSuccess(false);
    }
  }, [isOpen, verificationCode]);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Voer een geldige 6-cijferige code in');
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

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Refresh session to update emailVerified status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        onVerified();
      } else {
        setError(data.error || 'Ongeldige verificatiecode. Probeer opnieuw.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Er is een fout opgetreden. Probeer het later opnieuw.');
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

      const data = await response.json();

      if (response.ok && data.success) {
        setResendSuccess(true);
        // Update code if provided in response
        if (data.verificationCode) {
          setCode(data.verificationCode);
        }
      } else {
        setError(data.error || 'Kon verificatie-e-mail niet opnieuw verzenden.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Er is een fout opgetreden bij het opnieuw verzenden.');
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
        {/* Close button - only show if onClose is provided */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('emailVerification.title') || 'Verifieer je e-mailadres'}
          </h2>
          <p className="text-gray-600 text-sm">
            {t('emailVerification.description') || 'We hebben een verificatiecode naar je e-mailadres gestuurd'}
          </p>
          <p className="text-emerald-600 font-medium mt-2">{email}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm">
              {t('emailVerification.success') || 'E-mailadres succesvol geverifieerd! Je wordt doorgestuurd...'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Resend Success Message */}
        {resendSuccess && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 text-sm">
              {t('emailVerification.resendSuccess') || 'Verificatie-e-mail is opnieuw verzonden. Controleer je inbox (en spam folder).'}
            </p>
          </div>
        )}

        {/* Code Input */}
        {!success && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emailVerification.codeLabel') || 'Verificatiecode'}
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isVerifying}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {t('emailVerification.codeHint') || 'Voer de 6-cijferige code in die je per e-mail hebt ontvangen'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleVerify}
                disabled={isVerifying || code.length !== 6}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('emailVerification.verifying') || 'Verifiëren...'}
                  </>
                ) : (
                  t('emailVerification.verify') || 'Verifiëren'
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={isResending}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('emailVerification.resending') || 'Verzenden...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {t('emailVerification.resend') || 'Code opnieuw verzenden'}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-6">
          {t('emailVerification.info') || 'Geen code ontvangen? Controleer je spam folder of klik op "Code opnieuw verzenden".'}
        </p>
      </div>
    </div>
  );
}


