'use client';

import {
  getLegalDocumentVersion,
  type LegalDocumentId,
} from '@/lib/legal/document-versions';
import { formatLegalEffectiveDate } from '@/lib/legal/format-legal-effective-date';

type LegalDocumentVersionStampProps = {
  document: LegalDocumentId;
  versionLabel?: string;
  effectiveFromLabel?: string;
  locale: 'nl' | 'en';
  className?: string;
};

const DEFAULT_LABELS = {
  nl: { version: 'Versie', effectiveFrom: 'Geldig vanaf' },
  en: { version: 'Version', effectiveFrom: 'Effective from' },
} as const;

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
  const defaults = DEFAULT_LABELS[locale];
  const version = (versionLabel && versionLabel.trim()) || defaults.version;
  const effectiveFrom =
    (effectiveFromLabel && effectiveFromLabel.trim()) || defaults.effectiveFrom;

  return (
    <p className={className} data-legal-document={document}>
      {version} {meta.version} · {effectiveFrom} {dateLabel}
    </p>
  );
}
