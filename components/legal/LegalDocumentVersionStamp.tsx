'use client';

import {
  getLegalDocumentVersion,
  type LegalDocumentId,
} from '@/lib/legal/document-versions';
import { formatLegalEffectiveDate } from '@/lib/legal/format-legal-effective-date';

type LegalDocumentVersionStampProps = {
  document: LegalDocumentId;
  versionLabel: string;
  effectiveFromLabel: string;
  locale: 'nl' | 'en';
  className?: string;
};

/**
 * Renders immutable legal version + effective date.
 * The ISO date comes from `lib/legal/document-versions.ts`, never `new Date()`.
 */
export function LegalDocumentVersionStamp({
  document,
  versionLabel,
  effectiveFromLabel,
  locale,
  className,
}: LegalDocumentVersionStampProps) {
  const meta = getLegalDocumentVersion(document);
  const dateLabel = formatLegalEffectiveDate(meta.effectiveDate, locale);

  return (
    <p className={className} data-legal-document={document}>
      {versionLabel} {meta.version} · {effectiveFromLabel} {dateLabel}
    </p>
  );
}
