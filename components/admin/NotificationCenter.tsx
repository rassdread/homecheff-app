'use client';

import { useRef, useState } from 'react';
import { Send, Users, Mail, Bell, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { COURIER_EMAIL_TEMPLATES } from '@/lib/admin/courier-notification-templates';

type CourierPreview = {
  recipientSnapshot: string;
  targetCount: number;
  excludedCount: number;
  excluded: { reason: string; count: number }[];
  recipients: { name: string | null; email: string | null; readiness: string; missing: string[] }[];
  page: number;
  pageCount: number;
};

export default function NotificationCenter() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [pushTitle, setPushTitle] = useState('');
  const [linkPreset, setLinkPreset] = useState('/notifications');
  const [subject, setSubject] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [confirmEmailBlast, setConfirmEmailBlast] = useState(false);
  const [emailPreviewCount, setEmailPreviewCount] = useState<number | null>(null);
  const [courierSegment, setCourierSegment] = useState('ALL_EXISTING_COURIERS');
  const [courierVehicle, setCourierVehicle] = useState('');
  const [courierArea, setCourierArea] = useState('');
  const [courierActivity, setCourierActivity] = useState('');
  const [courierTemplate, setCourierTemplate] = useState('');
  const [courierPreview, setCourierPreview] = useState<CourierPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  const courierFilters = {
    segment: courierSegment,
    vehicle: courierVehicle || null,
    area: courierArea,
    activeWithinDays: courierActivity || null,
    templateId: courierTemplate || null,
  };

  const clearCourierPreview = () => setCourierPreview(null);

  const loadCourierPreview = async (page = 1) => {
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'delivery',
          dryRun: true,
          sendNotification: false,
          sendEmail: false,
          courierFilters,
          page,
          pageSize: 20,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || t('errors.sendMessageError2'));
        return;
      }
      setCourierPreview({
        recipientSnapshot: data.recipientSnapshot,
        targetCount: data.targetCount ?? 0,
        excludedCount: data.excludedCount ?? 0,
        excluded: Array.isArray(data.excluded) ? data.excluded : [],
        recipients: Array.isArray(data.recipients) ? data.recipients : [],
        page: data.page ?? page,
        pageCount: data.pageCount ?? 1,
      });
      setEmailPreviewCount(typeof data.emailRecipientCount === 'number' ? data.emailRecipientCount : null);
    } catch (error) {
      console.error('Error previewing courier recipients:', error);
      alert(t('errors.sendMessageError2'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitLockRef.current || isLoading) return;

    if (targetType === 'delivery' && !courierPreview?.recipientSnapshot) {
      alert('Bekijk eerst de ontvangers. Er wordt niets verstuurd voordat je die lijst bevestigt.');
      return;
    }

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
    submitLockRef.current = true;
    let confirmedBlast = confirmEmailBlast;

    try {
      if (sendEmail) {
        const previewRes = await fetch('/api/admin/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message.trim(),
            subject: subject.trim(),
            title: pushTitle.trim() || undefined,
            route: linkPreset,
            targetType,
            sendNotification: false,
            sendEmail: true,
            dryRun: true,
            courierFilters: targetType === 'delivery' ? courierFilters : undefined,
          }),
        });
        const preview = await previewRes.json().catch(() => ({}));
        const count =
          typeof preview.emailRecipientCount === 'number'
            ? preview.emailRecipientCount
            : null;
        setEmailPreviewCount(count);

        const needsConfirm =
          targetType === 'all' ||
          preview.requiresConfirm === true ||
          (typeof count === 'number' && count > 50);

        if (needsConfirm) {
          const ok = window.confirm(
            `Waarschuwing: deze actie stuurt ongeveer ${count ?? '?'} e-mails.\n\n` +
              `Dit verbruikt transactionele e-mailcapaciteit (P2) en kan P0/P1 berichten verdringen.\n\n` +
              `Typische marketing/bulk hoort op een aparte stream. Doorgaan?`
          );
          if (!ok) return;
          confirmedBlast = true;
          setConfirmEmailBlast(true);
        } else {
          confirmedBlast = confirmEmailBlast;
        }
      }

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `admin-blast-${Date.now()}`;
      }

      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          message: message.trim(),
          subject: subject.trim(),
          title: pushTitle.trim() || undefined,
          route: linkPreset,
          targetType,
          sendNotification,
          sendEmail,
          confirmEmailBlast: sendEmail ? confirmedBlast : false,
          idempotencyKey: idempotencyKeyRef.current,
          courierFilters: targetType === 'delivery' ? courierFilters : undefined,
          recipientSnapshot: targetType === 'delivery' ? courierPreview?.recipientSnapshot : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert(data.message || t('errors.messageSentSuccess'));
        setMessage('');
        setPushTitle('');
        setSubject('');
        setConfirmEmailBlast(false);
        setEmailPreviewCount(null);
        idempotencyKeyRef.current = null;
      } else if (data.code === 'CONFIRM_REQUIRED') {
        const ok = window.confirm(
          `${data.error || 'Bevestiging vereist'}\n\nGeschatte e-mails: ${data.emailRecipientCount ?? '?'}`
        );
        if (ok) {
          setConfirmEmailBlast(true);
          const retry = await fetch('/api/admin/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKeyRef.current!,
            },
            body: JSON.stringify({
              message: message.trim(),
              subject: subject.trim(),
              title: pushTitle.trim() || undefined,
              route: linkPreset,
              targetType,
              sendNotification,
              sendEmail,
              confirmEmailBlast: true,
              idempotencyKey: idempotencyKeyRef.current,
              courierFilters: targetType === 'delivery' ? courierFilters : undefined,
              recipientSnapshot: targetType === 'delivery' ? courierPreview?.recipientSnapshot : undefined,
            }),
          });
          const retryData = await retry.json().catch(() => ({}));
          if (retry.ok) {
            alert(retryData.message || t('errors.messageSentSuccess'));
            setMessage('');
            setPushTitle('');
            setSubject('');
            setConfirmEmailBlast(false);
            idempotencyKeyRef.current = null;
          } else {
            alert(retryData.error || t('errors.sendMessageError2'));
          }
        }
      } else {
        alert(data.error || t('errors.sendMessageError2'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('errors.sendMessageError2'));
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('admin.notificationCenter.title')}</h2>
        <p className="text-gray-600">{t('admin.notificationCenter.subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSendMessage} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.notificationCenter.targetGroup')}
            </label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setConfirmEmailBlast(false);
                setEmailPreviewCount(null);
                clearCourierPreview();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">{t('admin.notificationCenter.allUsers')}</option>
              <option value="sellers">{t('admin.notificationCenter.sellersOnly')}</option>
              <option value="buyers">{t('admin.notificationCenter.buyersOnly')}</option>
              {/* value "delivery" selects every user with a DeliveryProfile. */}
              <option value="delivery">{t('admin.notificationCenter.activeOnly')}</option>
            </select>
          </div>

          {targetType === 'delivery' && (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.notificationCenter.courierStatus')}
                </label>
                <select
                  value={courierSegment}
                  onChange={(e) => {
                    setCourierSegment(e.target.value);
                    clearCourierPreview();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="ALL_EXISTING_COURIERS">{t('admin.notificationCenter.courierAll')}</option>
                  <option value="ACTIVE_COURIERS">{t('admin.notificationCenter.courierActive')}</option>
                  <option value="READY_COURIERS">{t('admin.notificationCenter.courierReady')}</option>
                  <option value="AGREEMENT_MISSING">{t('admin.notificationCenter.courierAgreement')}</option>
                  <option value="STRIPE_CONNECT_MISSING">{t('admin.notificationCenter.courierConnectMissing')}</option>
                  <option value="STRIPE_ONBOARDING_INCOMPLETE">{t('admin.notificationCenter.courierOnboarding')}</option>
                  <option value="STRIPE_IDENTITY_UNVERIFIED">{t('admin.notificationCenter.courierIdentity')}</option>
                  <option value="PROFILE_INCOMPLETE">{t('admin.notificationCenter.courierProfile')}</option>
                  <option value="INACTIVE_COURIERS">{t('admin.notificationCenter.courierInactive')}</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block text-sm text-gray-700">
                  {t('admin.notificationCenter.vehicle')}
                  <select
                    value={courierVehicle}
                    onChange={(e) => {
                      setCourierVehicle(e.target.value);
                      clearCourierPreview();
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{t('admin.notificationCenter.vehicleAny')}</option>
                    <option value="BIKE">{t('admin.notificationCenter.vehicleBike')}</option>
                    <option value="EBIKE">{t('admin.notificationCenter.vehicleEbike')}</option>
                    <option value="SCOOTER">{t('admin.notificationCenter.vehicleScooter')}</option>
                    <option value="CAR">{t('admin.notificationCenter.vehicleCar')}</option>
                  </select>
                </label>
                <label className="block text-sm text-gray-700">
                  {t('admin.notificationCenter.area')}
                  <input
                    type="text"
                    value={courierArea}
                    onChange={(e) => {
                      setCourierArea(e.target.value);
                      clearCourierPreview();
                    }}
                    placeholder={t('admin.notificationCenter.areaPlaceholder')}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    maxLength={80}
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  {t('admin.notificationCenter.lastActivity')}
                  <select
                    value={courierActivity}
                    onChange={(e) => {
                      setCourierActivity(e.target.value);
                      clearCourierPreview();
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{t('admin.notificationCenter.lastActivityAny')}</option>
                    <option value="7">{t('admin.notificationCenter.lastActivity7')}</option>
                    <option value="30">{t('admin.notificationCenter.lastActivity30')}</option>
                    <option value="90">{t('admin.notificationCenter.lastActivity90')}</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm text-gray-700">
                {t('admin.notificationCenter.template')}
                <select
                  value={courierTemplate}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCourierTemplate(next);
                    clearCourierPreview();
                    const template = COURIER_EMAIL_TEMPLATES.find((item) => item.id === next);
                    if (template) {
                      setSubject(template.subject);
                      setMessage(template.message);
                    }
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{t('admin.notificationCenter.templateNone')}</option>
                  <option value="COURIER_AGREEMENT_REMINDER">{t('admin.notificationCenter.templateAgreement')}</option>
                  <option value="COURIER_STRIPE_ONBOARDING">{t('admin.notificationCenter.templateStripe')}</option>
                  <option value="COURIER_PROFILE_COMPLETION">{t('admin.notificationCenter.templateProfile')}</option>
                  <option value="COURIER_PILOT_INVITATION">{t('admin.notificationCenter.templatePilot')}</option>
                  <option value="COURIER_REACTIVATION">{t('admin.notificationCenter.templateReactivation')}</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void loadCourierPreview(1)}
                disabled={previewLoading}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-emerald-700 text-emerald-800 text-sm font-medium"
              >
                {previewLoading ? t('admin.notificationCenter.sending') : t('admin.notificationCenter.previewRecipients')}
              </button>
              {courierPreview && (
                <div className="space-y-3 text-sm text-gray-800">
                  <p>
                    {courierPreview.targetCount} ontvangers. Uitgesloten: {courierPreview.excludedCount}.
                  </p>
                  {courierPreview.excluded.length > 0 && (
                    <ul className="list-disc pl-5 text-gray-600">
                      {courierPreview.excluded.map((row) => (
                        <li key={row.reason}>{row.reason}: {row.count}</li>
                      ))}
                    </ul>
                  )}
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    {courierPreview.recipients.map((recipient) => (
                      <li key={`${recipient.email}-${recipient.name}`} className="px-3 py-2">
                        <p className="font-medium">{recipient.name || 'Bezorger'}</p>
                        <p>{recipient.email}</p>
                        <p>{recipient.readiness}</p>
                        {recipient.missing.length > 0 && (
                          <p className="text-gray-600">{recipient.missing.join(' ')}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {courierPreview.pageCount > 1 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={courierPreview.page <= 1}
                        onClick={() => void loadCourierPreview(courierPreview.page - 1)}
                        className="px-3 py-1 border rounded"
                      >
                        Vorige
                      </button>
                      <button
                        type="button"
                        disabled={courierPreview.page >= courierPreview.pageCount}
                        onClick={() => void loadCourierPreview(courierPreview.page + 1)}
                        className="px-3 py-1 border rounded"
                      >
                        Volgende
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                  onChange={(e) => {
                    setSendEmail(e.target.checked);
                    setConfirmEmailBlast(false);
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 ml-2 mr-2 text-gray-600" />
                <span className="text-sm text-gray-700">{t('admin.notificationCenter.sendEmail')}</span>
              </label>
            </div>
          </div>

          {sendEmail && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-medium">E-mailcapaciteit</p>
              <p className="mt-1">
                Admin-e-mail deelt de transactionele Resend-quota met betalingen en auth (P0/P1).
                Grote doelgroepen vereisen expliciete bevestiging. Max per actie: 500 (configureerbaar).
                {emailPreviewCount != null ? ` Geschatte ontvangers: ${emailPreviewCount}.` : ''}
              </p>
              {(targetType === 'all' || (emailPreviewCount ?? 0) > 50) && (
                <label className="mt-3 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={confirmEmailBlast}
                    onChange={(e) => setConfirmEmailBlast(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    Ik bevestig dat ik bewust e-mail naar deze doelgroep stuur en de capaciteitsimpact accepteer.
                  </span>
                </label>
              )}
            </div>
          )}

          {sendNotification && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.notificationCenter.pushTitle')}
                </label>
                <input
                  type="text"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('admin.notificationCenter.pushTitlePlaceholder')}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.notificationCenter.linkPreset')}
                </label>
                <select
                  value={linkPreset}
                  onChange={(e) => setLinkPreset(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="/notifications">{t('admin.notificationCenter.routeInbox')}</option>
                  <option value="/settings/app">{t('admin.notificationCenter.routeAppSettings')}</option>
                  <option value="/app">{t('admin.notificationCenter.routeBetaApp')}</option>
                  <option value="/mijn-hcp">{t('admin.notificationCenter.routeMijnHcp')}</option>
                  <option value="/profile">{t('admin.notificationCenter.routeProfile')}</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {t('admin.notificationCenter.linkHelp')}
                </p>
              </div>
            </div>
          )}

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
maxLength={2000}
              />
            <div className="mt-1 text-sm text-gray-500">
              {message.length}/2000 {t('common.characters')}
            </div>
          </div>

          {sendEmail && subject.trim() && message.trim() && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900">{t('admin.notificationCenter.emailPreview')}</h3>
              <p className="mt-2 text-sm font-medium text-gray-800">{subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{message}</p>
            </div>
          )}

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
