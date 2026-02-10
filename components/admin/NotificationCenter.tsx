'use client';

import { useState } from 'react';
import { Send, Users, Mail, Bell, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotificationCenter() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      alert(t('errors.enterMessage'));
      return;
    }

    if (!sendNotification && !sendEmail) {
      alert(t('admin.notificationCenter.selectDeliveryMethod'));
      return;
    }

    if (sendEmail && !subject.trim()) {
      alert(t('admin.notificationCenter.enterEmailSubject'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          subject: subject.trim(),
          targetType,
          sendNotification,
          sendEmail,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || t('errors.messageSentSuccess'));
        setMessage('');
        setSubject('');
      } else {
        const error = await response.json();
        alert(error.error || t('errors.sendMessageError2'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('errors.sendMessageError2'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('admin.notificationCenter.title')}</h2>
        <p className="text-gray-600">{t('admin.notificationCenter.subtitle')}</p>
      </div>

      {/* Send Message Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSendMessage} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.notificationCenter.targetGroup')}
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">{t('admin.notificationCenter.allUsers')}</option>
              <option value="sellers">{t('admin.notificationCenter.sellersOnly')}</option>
              <option value="buyers">{t('admin.notificationCenter.buyersOnly')}</option>
              <option value="delivery">{t('admin.notificationCenter.activeOnly')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.notificationCenter.deliveryMethod')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Bell className="w-4 h-4 ml-2 mr-2 text-gray-600" />
                <span className="text-sm text-gray-700">{t('admin.notificationCenter.sendNotification')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 ml-2 mr-2 text-gray-600" />
                <span className="text-sm text-gray-700">{t('admin.notificationCenter.sendEmail')}</span>
              </label>
            </div>
          </div>

          {sendEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.notificationCenter.emailSubject')} *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('admin.notificationCenter.emailSubjectPlaceholder')}
                maxLength={100}
              />
              <div className="mt-1 text-sm text-gray-500">
                {subject.length}/100 {t('common.characters')}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.notificationCenter.message')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t('common.typeMessageHere')}
              maxLength={500}
            />
            <div className="mt-1 text-sm text-gray-500">
              {message.length}/500 {t('common.characters')}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {sendNotification && (
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  <span>{t('common.notifications')}</span>
                </div>
              )}
              {sendEmail && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{t('common.email')}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !message.trim() || (sendEmail && !subject.trim())}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('admin.notificationCenter.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('admin.notificationCenter.sendMessage')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Gebruikers</h3>
              <p className="text-sm text-gray-500">Bekijk alle gebruikers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">E-mail</h3>
              <p className="text-sm text-gray-500">Stuur e-mail naar gebruikers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Alerts</h3>
              <p className="text-sm text-gray-500">Beheer platform alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">{t('admin.notificationCenter.info')}</h4>
            <p className="text-sm text-blue-800 mt-1">
              {t('admin.notificationCenter.infoText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


