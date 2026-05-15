'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Key, Mail, Eye, EyeOff, Save, AlertCircle, Trash2, BadgeCheck } from 'lucide-react';
import DeleteAccount from './DeleteAccount';
import HelpSettings from '@/components/onboarding/HelpSettings';
import { useTranslation } from '@/hooks/useTranslation';

interface AccountSettingsProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    /** false bij alleen social login: geen huidig wachtwoord nodig om een wachtwoord te koppelen */
    hasPassword?: boolean;
    /** gezet na e-mailverificatie (of social auto-verify) */
    emailVerified?: Date | null;
  };
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onUpdateEmail: (newEmail: string) => Promise<void>;
  onAccountDeleted?: () => void;
  initialTab?: 'password' | 'email' | 'delete';
  deleteInitialStep?: number;
}

export default function AccountSettings({
  user,
  onUpdatePassword,
  onUpdateEmail,
  onAccountDeleted,
  initialTab = 'password',
  deleteInitialStep = 1,
}: AccountSettingsProps) {
  const { t } = useTranslation();
  const hasPassword = user.hasPassword !== false;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Email form
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: ''
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const dangerZone = (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <h3 className="text-base font-semibold text-red-900">{t('accountSettings.dangerZoneTitle')}</h3>
      <p className="text-sm text-red-800">{t('accountSettings.dangerZoneBody')}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('delete')}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          {t('accountSettings.dangerZoneCta')}
        </button>
        <Link
          href="/delete-account"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          {t('accountSettings.publicDeletePageLink')}
        </Link>
      </div>
    </div>
  );

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: t('accountSettings.passwordsDoNotMatch') });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: t('accountSettings.passwordMinLength') });
      return;
    }

    if (hasPassword && !passwordForm.currentPassword) {
      setMessage({ type: 'error', text: t('accountSettings.currentPasswordRequired') });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdatePassword(
        hasPassword ? passwordForm.currentPassword : '',
        passwordForm.newPassword
      );
      setMessage({ type: 'success', text: t('accountSettings.passwordUpdated') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : t('accountSettings.errorUpdatingPassword');
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setMessage({ type: 'error', text: t('accountSettings.emailsDoNotMatch') });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateEmail(emailForm.newEmail);
      setMessage({ type: 'success', text: t('accountSettings.emailUpdated') });
      setEmailForm({ newEmail: '', confirmEmail: '' });
    } catch (error) {
      setMessage({ type: 'error', text: t('accountSettings.errorUpdatingEmail') });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'password', label: t('accountSettings.password'), icon: Key },
    { id: 'email', label: t('accountSettings.email'), icon: Mail },
    { id: 'delete', label: t('accountSettings.deleteAccount'), icon: Trash2 }
  ];

  return (
    <div className="space-y-6">
      {/* Help & Uitleg - BOVENAAN */}
      <HelpSettings />

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Shield className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('accountSettings.title')}</h2>
          <p className="text-sm text-gray-500">{t('accountSettings.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? tab.id === 'delete' 
                      ? 'border-red-500 text-red-600'
                      : 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {hasPassword ? t('accountSettings.changePassword') : t('accountSettings.setPassword')}
            </h3>
            {!hasPassword && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {t('accountSettings.linkPasswordGoogleHint')}
              </div>
            )}
            <div className="space-y-4">
              {hasPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('accountSettings.currentPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('accountSettings.newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('accountSettings.confirmNewPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? t('accountSettings.saving') || t('common.loading') : t('accountSettings.updatePassword')}</span>
          </button>

          {dangerZone}
        </form>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailUpdate} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('accountSettings.changeEmail')}</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                <strong>{t('accountSettings.currentEmail')}</strong>
                <span>{user.email}</span>
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t('accountSettings.emailVerifiedBadge')}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('accountSettings.newEmail')}
                </label>
                <input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('accountSettings.confirmNewEmail')}
                </label>
                <input
                  type="email"
                  value={emailForm.confirmEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, confirmEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? t('accountSettings.saving') || t('common.loading') : t('accountSettings.updateEmail')}</span>
          </button>

          {dangerZone}
        </form>
      )}

      {/* Delete Account Tab */}
      {activeTab === 'delete' && (
        <DeleteAccount
          user={user}
          hasPassword={hasPassword}
          initialStep={deleteInitialStep}
          onAccountDeleted={onAccountDeleted || (() => {})}
        />
      )}
    </div>
  );
}

