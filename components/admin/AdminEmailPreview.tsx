'use client';

import {
  renderAdminBulkMessage,
  type AdminEmailAction,
} from '@/lib/email/admin-bulk-message-content';

export function AdminEmailPreview({
  subject,
  message,
  action = null,
}: {
  subject: string;
  message: string;
  action?: AdminEmailAction | null;
}) {
  if (!message.trim()) return null;
  const letter = renderAdminBulkMessage({
    recipientName: 'Sanne',
    message,
    action,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900">E-mailvoorbeeld</h3>
      <p className="mt-1 text-sm text-gray-600">
        Onderwerp: {subject.trim() || 'Nog geen onderwerp'}. Dit is dezelfde opmaak als de verzending. De voorbeeldnaam Sanne wordt de naam van de ontvanger, tenzij de tekst zelf al met een begroeting begint.
      </p>
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
