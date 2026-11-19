import { parseInternalPathFromUnknownInput } from '@/lib/native/safeRoute';
import { resolveAdminEmailAction } from '@/lib/email/admin-bulk-message-content';
import { uiCopy, type UiLanguage } from '@/lib/admin/notification-copy';

const CAMPAIGN_ID = /^[0-9a-zA-Z_-]{8,80}$/;

/** Shared page for one admin broadcast. Each recipient only sees their own row. */
export function adminNoticePath(campaignId: string): string {
  return `/notifications/admin/${encodeURIComponent(campaignId)}`;
}

export function isAdminNoticeCampaignId(value: string): boolean {
  return CAMPAIGN_ID.test(value);
}

export type AdminNoticeAction = {
  label: string;
  path: string;
  url: string;
};

export type AdminNoticeButton =
  | { ok: true; action: AdminNoticeAction | null }
  | { ok: false; errorKey: 'buttonNeedBoth' | 'buttonUnsafe' };

/**
 * A button needs both a label and a safe internal HomeCheff path.
 * Both empty means the notification opens the message itself.
 */
export function resolveAdminNoticeButton(label: unknown, route: unknown): AdminNoticeButton {
  const text = typeof label === 'string' ? label.trim() : '';
  const raw = typeof route === 'string' ? route.trim() : '';
  if (!text && !raw) return { ok: true, action: null };
  if (!text || !raw) return { ok: false, errorKey: 'buttonNeedBoth' };
  const path = parseInternalPathFromUnknownInput(raw);
  const bare = path ? path.replace(/\/+$/, '') || '/' : '';
  if (!path || bare === '/notifications') return { ok: false, errorKey: 'buttonUnsafe' };
  const resolved = resolveAdminEmailAction(text, `https://homecheff.eu${path}`);
  if (!resolved.ok || !resolved.action) return { ok: false, errorKey: 'buttonUnsafe' };
  return {
    ok: true,
    action: { label: resolved.action.label, path, url: resolved.action.url },
  };
}

/** Each button is complete or empty. One filled button does not require the other. */
export function resolveAdminNoticeButtons(
  firstLabel: unknown,
  firstRoute: unknown,
  secondLabel: unknown,
  secondRoute: unknown,
): { ok: true; primary: AdminNoticeAction | null; secondary: AdminNoticeAction | null } | { ok: false; errorKey: 'buttonNeedBoth' | 'buttonUnsafe' } {
  const first = resolveAdminNoticeButton(firstLabel, firstRoute);
  if (!first.ok) return first;
  const second = resolveAdminNoticeButton(secondLabel, secondRoute);
  if (!second.ok) return second;
  return { ok: true, primary: first.action, secondary: second.action };
}

/** The email button opens this recipient's HomeCheff message under Berichten. */
export function messageEmailAction(conversationPath: string, lang: UiLanguage = 'nl') {
  const label = uiCopy(lang, 'admin.notificationCenter.ui.openNotice');
  const path = conversationPath.startsWith('/') ? conversationPath : '';
  if (!path.startsWith('/messages/')) return null;
  const resolved = resolveAdminEmailAction(label, `https://homecheff.eu${path}`);
  if (!resolved.ok || !resolved.action) return null;
  return resolved.action;
}

/** Older notices keep their original page. New sends use messageEmailAction. */
export function noticeEmailAction(campaignId: string, lang: UiLanguage = 'nl') {
  if (!isAdminNoticeCampaignId(campaignId)) return null;
  const label = uiCopy(lang, 'admin.notificationCenter.ui.openNotice');
  const resolved = resolveAdminEmailAction(label, `https://homecheff.eu${adminNoticePath(campaignId)}`);
  if (!resolved.ok || !resolved.action) return null;
  return resolved.action;
}
