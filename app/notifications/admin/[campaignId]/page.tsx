import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { adminNoticePath, isAdminNoticeCampaignId } from '@/lib/admin/admin-notice';
import { uiCopy, type UiLanguage } from '@/lib/admin/notification-copy';
import { ECOSYSTEM_LOCALE_COOKIE } from '@/lib/ecosystem-locale';

export const dynamic = 'force-dynamic';

async function languageFromCookie(): Promise<UiLanguage> {
  const jar = await cookies();
  const value = jar.get(ECOSYSTEM_LOCALE_COOKIE)?.value;
  return value === 'en' ? 'en' : 'nl';
}

function textFrom(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value.trim() : '';
}

export default async function AdminNoticePage({
  params,
}: {
  params: { campaignId: string };
}) {
  const campaignId = decodeURIComponent(params.campaignId || '');
  const path = adminNoticePath(campaignId);
  if (!isAdminNoticeCampaignId(campaignId)) notFound();

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user?.email || !userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }

  const notice = await prisma.notification.findFirst({
    where: {
      userId,
      type: 'ADMIN_NOTICE',
      payload: { path: ['broadcastId'], equals: campaignId },
    },
    select: { id: true, payload: true, readAt: true },
  });
  if (!notice) notFound();

  if (!notice.readAt) {
    await prisma.notification.update({
      where: { id: notice.id },
      data: { readAt: new Date() },
    }).catch(() => undefined);
  }

  const payload =
    notice.payload && typeof notice.payload === 'object' && !Array.isArray(notice.payload)
      ? (notice.payload as Record<string, unknown>)
      : {};
  const lang = await languageFromCookie();
  const title = textFrom(payload, 'title') || 'HomeCheff';
  const message = textFrom(payload, 'message') || textFrom(payload, 'body');
  const actionLabel = textFrom(payload, 'actionLabel');
  const actionRoute = textFrom(payload, 'actionRoute');
  const actionSafe = actionRoute.startsWith('/') && !actionRoute.startsWith('//');

  return (
    <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-8">
      <p className="mb-6">
        <Link href="/notifications" className="text-sm font-medium text-emerald-800">
          {uiCopy(lang, 'admin.notificationCenter.ui.noticeBack')}
        </Link>
      </p>
      <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {message ? (
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-gray-800">{message}</p>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            {uiCopy(lang, 'admin.notificationCenter.ui.noticeMissing')}
          </p>
        )}
        {actionLabel && actionSafe ? (
          <p className="mt-6">
            <Link
              href={actionRoute}
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
            >
              {actionLabel}
            </Link>
          </p>
        ) : null}
      </article>
    </main>
  );
}
