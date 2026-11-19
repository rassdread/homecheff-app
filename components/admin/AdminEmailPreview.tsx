'use client';

import {
  renderAdminBulkMessage,
  type AdminEmailAction,
  type AdminLetterLanguage,
} from '@/lib/email/admin-bulk-message-content';

export function AdminEmailPreview({
  subject,
  message,
  action = null,
  recipientName,
  recipientCount = 0,
  lang = 'nl',
}: {
  subject: string;
  message: string;
  action?: AdminEmailAction | null;
  recipientName?: string | null;
  recipientCount?: number;
  lang?: AdminLetterLanguage;
}) {
  if (!message.trim()) return null;
  const language: AdminLetterLanguage = lang === 'en' ? 'en' : 'nl';
  const fictional = recipientCount < 1;
  const letter = renderAdminBulkMessage({
    recipientName: fictional ? 'Sanne' : (recipientName || ''),
    message,
    action,
    lang: language,
  });
  const subjectLine = subject.trim() || (language === 'en' ? 'No subject yet' : 'Nog geen onderwerp');
  const caption = fictional
    ? (language === 'en'
      ? `Subject: ${subjectLine}. This is the same layout as the send. Sanne is a fictional sample because nobody is selected.`
      : `Onderwerp: ${subjectLine}. Dit is dezelfde opmaak als de verzending. Sanne is een fictieve voorbeeldnaam omdat er niemand is geselecteerd.`)
    : recipientCount > 1
      ? (language === 'en'
        ? `Subject: ${subjectLine}. Sample for ${recipientName || 'the first selected person'}. Each recipient gets a greeting with their own first name. The button opens that person's own HomeCheff message.`
        : `Onderwerp: ${subjectLine}. Voorbeeld voor ${recipientName || 'de eerste geselecteerde persoon'}. Iedere ontvanger krijgt een begroeting met de eigen voornaam. De knop opent het eigen HomeCheff-bericht van die persoon.`)
      : (language === 'en'
        ? `Subject: ${subjectLine}. Preview for ${recipientName || 'the selected person'}. This is the same greeting as the send. The button opens that person's own HomeCheff message.`
        : `Onderwerp: ${subjectLine}. Voorbeeld voor ${recipientName || 'de geselecteerde persoon'}. Dit is dezelfde begroeting als de verzending. De knop opent het eigen HomeCheff-bericht van die persoon.`);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900">{language === 'en' ? 'Email preview' : 'E-mailvoorbeeld'}</h3>
      <p className="mt-1 text-sm text-gray-600">{caption}</p>
      <div className="mx-auto mt-4 w-full max-w-[390px] overflow-hidden rounded-[28px] border border-gray-300 bg-gray-100 shadow-inner">
        <iframe
          title="E-mailvoorbeeld"
          sandbox=""
          srcDoc={letter.html}
          className="h-[560px] w-full bg-white"
        />
      </div>
    </div>
  );
}
