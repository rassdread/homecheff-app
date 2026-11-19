import { uiCopy, type UiLanguage } from '@/lib/admin/notification-copy';

export function OfficialLetterPreview({
  subject,
  message,
  actions,
  lang = 'nl',
}: {
  subject: string;
  message: string;
  actions: Array<{ label: string; url: string }>;
  lang?: UiLanguage;
}) {
  if (!message.trim()) return null;
  const language: UiLanguage = lang === 'en' ? 'en' : 'nl';
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" data-hc-letter-preview="">
      <h3 className="text-lg font-medium text-gray-900">{uiCopy(language, 'admin.notificationCenter.ui.letterPreview')}</h3>
      <p className="mt-1 text-sm text-gray-600">{uiCopy(language, 'admin.notificationCenter.ui.letterPreviewHelp')}</p>
      <article className="mt-4 max-w-md rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Officieel · Team HomeCheff</p>
        <h4 className="mt-1 text-base font-semibold text-gray-900">{subject.trim() || (language === 'en' ? 'No subject yet' : 'Nog geen onderwerp')}</h4>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">{message}</p>
        {actions.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {actions.map((action) => (
              <span
                key={`${action.label}:${action.url}`}
                data-hc-letter-action=""
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white sm:w-auto"
              >
                {action.label}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
