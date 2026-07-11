'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Trash2,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Download,
  Lock,
  Database,
  Users,
  MessageSquare,
  Star,
  Heart,
  Camera,
  Settings,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ACCOUNT_DELETION_CONFIRM_EN,
  ACCOUNT_DELETION_CONFIRM_NL,
  isValidDeletionConfirmation,
} from '@/lib/account-deletion';

interface DeleteAccountProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  hasPassword?: boolean;
  initialStep?: number;
  onAccountDeleted: () => void;
}

export default function DeleteAccount({
  user,
  hasPassword = true,
  initialStep = 1,
  onAccountDeleted,
}: DeleteAccountProps) {
  const { t, language } = useTranslation();
  const confirmWord =
    language === 'en' ? ACCOUNT_DELETION_CONFIRM_EN : ACCOUNT_DELETION_CONFIRM_NL;

  const [isDeleting, setIsDeleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(
    initialStep >= 1 && initialStep <= 3 ? initialStep : 1,
  );
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataExportRequested, setDataExportRequested] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentStep === 3) {
      const focusTimer = setTimeout(() => {
        confirmationInputRef.current?.focus();
        confirmationInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, [currentStep]);

  const handleDataExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile/export-data', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage({
          type: 'error',
          text: data.error || t('deleteAccountFlow.exportError'),
        });
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'homecheff-data-export.json';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setDataExportRequested(true);
      setMessage({ type: 'success', text: t('deleteAccountFlow.exportSuccess') });
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({ type: 'error', text: t('deleteAccountFlow.exportError') });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isValidDeletionConfirmation(confirmationText, language)) {
      setMessage({ type: 'error', text: t('deleteAccountFlow.confirmRequired') });
      return;
    }

    if (hasPassword && !password) {
      setMessage({ type: 'error', text: t('deleteAccountFlow.passwordRequired') });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: hasPassword ? password : undefined,
          confirmationText,
          locale: language,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t('deleteAccountFlow.successMessage') });

        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });

        setTimeout(async () => {
          try {
            const { signOut } = await import('next-auth/react');
            await signOut({ callbackUrl: '/', redirect: true });
          } catch {
            window.location.href = '/';
          }
          onAccountDeleted();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: data.error || t('deleteAccountFlow.errorGeneric'),
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: t('deleteAccountFlow.errorGeneric') });
    } finally {
      setIsDeleting(false);
    }
  };

  const canSubmitDelete =
    isValidDeletionConfirmation(confirmationText, language) &&
    (!hasPassword || Boolean(password));

  const renderDataOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('deleteAccountFlow.step1Title')}</h2>
        <p className="text-gray-600">{t('deleteAccountFlow.step1Subtitle')}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t('deleteAccountFlow.exportWhatTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <DataRow icon={Users} color="text-blue-500" title={t('deleteAccountFlow.dataProfile')} desc={t('deleteAccountFlow.dataProfileDesc')} />
            <DataRow icon={Camera} color="text-green-500" title={t('deleteAccountFlow.dataProducts')} desc={t('deleteAccountFlow.dataProductsDesc')} />
            <DataRow icon={MessageSquare} color="text-purple-500" title={t('deleteAccountFlow.dataMessages')} desc={t('deleteAccountFlow.dataMessagesDesc')} />
          </div>
          <div className="space-y-3">
            <DataRow icon={Star} color="text-yellow-500" title={t('deleteAccountFlow.dataReviews')} desc={t('deleteAccountFlow.dataReviewsDesc')} />
            <DataRow icon={Heart} color="text-red-500" title={t('deleteAccountFlow.dataSocial')} desc={t('deleteAccountFlow.dataSocialDesc')} />
            <DataRow icon={Settings} color="text-gray-500" title={t('deleteAccountFlow.dataSettings')} desc={t('deleteAccountFlow.dataSettingsDesc')} />
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-950 mb-1">{t('deleteAccountFlow.warningTitle')}</h4>
            <p className="text-amber-900 text-sm">{t('deleteAccountFlow.warningBody')}</p>
            <p className="text-amber-800 text-xs mt-2">{t('deleteAccountFlow.retentionNote')}</p>
            <Link href="/delete-account" className="text-xs font-medium text-emerald-700 hover:text-emerald-800 mt-1 inline-block">
              {t('deleteAccountFlow.publicPageLink')} →
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('deleteAccountFlow.exportData')}
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t('deleteAccountFlow.continueDelete')}
        </button>
      </div>
    </div>
  );

  const renderDataExport = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Download className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('deleteAccountFlow.step2Title')}</h2>
        <p className="text-gray-600">{t('deleteAccountFlow.step2Subtitle')}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('deleteAccountFlow.exportWhatTitle')}</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              {t(`deleteAccountFlow.exportItem${n}`)}
            </li>
          ))}
        </ul>
      </div>

      {message && <MessageBanner message={message} />}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('deleteAccountFlow.back')}
        </button>
        <button
          type="button"
          onClick={handleDataExport}
          disabled={dataExportRequested || isExporting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting
            ? t('deleteAccountFlow.exportStarted')
            : dataExportRequested
              ? t('deleteAccountFlow.exportComplete')
              : t('deleteAccountFlow.exportButton')}
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {t('deleteAccountFlow.continueDelete')}
        </button>
      </div>
    </div>
  );

  const renderFinalConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('deleteAccountFlow.step3Title')}</h2>
        <p className="text-gray-600">{t('deleteAccountFlow.step3Subtitle')}</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">{t('deleteAccountFlow.finalWarningTitle')}</h3>
            <p className="text-red-800 text-sm mb-4">{t('deleteAccountFlow.finalWarningBody')}</p>
            <div className="bg-red-100 border border-red-300 rounded p-3">
              <p className="text-red-800 font-medium text-sm">
                <strong>{t('deleteAccountFlow.accountLabel')}:</strong> {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && <MessageBanner message={message} />}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('deleteAccountFlow.confirmLabel', { word: confirmWord })}
          </label>
          <input
            type="text"
            ref={confirmationInputRef}
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={confirmWord}
            className="w-full px-3 py-3 border border-red-200 bg-white rounded-lg text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('deleteAccountFlow.confirmHint', { word: confirmWord })}
          </p>
        </div>

        {hasPassword ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('deleteAccountFlow.passwordLabel')}
            </label>
            <input
              type="password"
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 bg-white rounded-lg text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
        ) : (
          <p className="text-sm text-gray-600">{t('deleteAccountFlow.passwordOptionalHint')}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isDeleting}
        >
          {t('deleteAccountFlow.back')}
        </button>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting || !canSubmitDelete}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('deleteAccountFlow.deleting')}
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              {t('deleteAccountFlow.deleteButton')}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 2:
        return renderDataExport();
      case 3:
        return renderFinalConfirmation();
      default:
        return renderDataOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div className={`w-8 h-0.5 ml-2 ${currentStep > step ? 'bg-red-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      {renderStep()}
    </div>
  );
}

function DataRow({
  icon: Icon,
  color,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{desc}</div>
      </div>
    </div>
  );
}

function MessageBanner({ message }: { message: { type: 'success' | 'error'; text: string } }) {
  return (
    <div
      className={`p-4 rounded-lg flex items-center gap-2 ${
        message.type === 'success'
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-red-50 text-red-800 border border-red-200'
      }`}
    >
      {message.type === 'success' ? (
        <CheckCircle className="w-5 h-5 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 shrink-0" />
      )}
      <span>{message.text}</span>
    </div>
  );
}
