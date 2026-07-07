'use client';

import { Clock, MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { AgreementAgendaInfo } from '@/lib/agreements/agreements-hub-types';

function formatDate(iso: string, language: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(language === 'en' ? 'en-GB' : 'nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Compact planning meta (date · time-window · location) for hub / agenda items. */
export default function AgreementAgendaMeta({
  agenda,
}: {
  agenda: AgreementAgendaInfo;
}) {
  const { language } = useTranslation();

  const dateLabel = agenda.scheduledAt
    ? formatDate(agenda.scheduledAt, language)
    : null;
  const timeParts = [dateLabel, agenda.timeLabel].filter(Boolean).join(' \u00b7 ');

  if (!timeParts && !agenda.locationLabel) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
      {timeParts ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          {timeParts}
        </span>
      ) : null}
      {agenda.locationLabel ? (
        <span className="inline-flex min-w-0 items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{agenda.locationLabel}</span>
        </span>
      ) : null}
    </div>
  );
}
