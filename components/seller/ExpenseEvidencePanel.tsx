'use client';

/**
 * PHASE 8D — attach, view and remove private evidence for one expense.
 *
 * Deliberately small. This is a receipt drawer inside an expense row, not a
 * document manager: add, look at, remove.
 *
 * No storage url ever reaches this component. Bytes are requested from
 * `/api/seller/evidence/{id}/content`, an authenticated HomeCheff route that
 * checks ownership and streams the object, so there is no address here that
 * would still work for a signed-out browser or a different account.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FileText, ImageIcon, Loader2, Paperclip, Trash2, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_PER_EXPENSE,
} from '@/lib/finance/evidence/evidence-policy';

type Evidence = {
  id: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string | null;
  uploadedAt: string;
  duplicateOfExisting?: boolean;
};

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

const KNOWN_ERROR_CODES = new Set([
  'EMPTY_FILE',
  'FILE_TOO_SMALL',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_TYPE',
  'DECLARED_TYPE_MISMATCH',
  'ACTIVE_CONTENT',
  'MALFORMED_FILE',
  'EXPENSE_NOT_FOUND',
  'TOO_MANY_FILES',
  'STORAGE_FAILED',
]);

const MAX_LABEL = `${Math.round(MAX_EVIDENCE_BYTES / (1024 * 1024))} MB`;

const contentUrl = (id: string) => `/api/seller/evidence/${id}/content`;

/**
 * Keeps the fixed bottom navigation clear when the browser scrolls one of these
 * elements into view — on focus, or when the expense row expands. Without it the
 * upload control lands underneath the nav on a 390px screen, which is the trap
 * Phase 8C hit with the expense dialog. `--hc-bottom-nav-offset` is the app
 * chrome's own measurement of the nav, so this follows it rather than guessing.
 */
const NAV_CLEARANCE = { scrollMarginBottom: 'calc(var(--hc-bottom-nav-offset, 0px) + 1rem)' } as const;

export default function ExpenseEvidencePanel({
  expenseId,
  onCountChange,
}: {
  expenseId: string;
  onCountChange?: (count: number) => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Evidence | null>(null);

  // `t` from useTranslation is a fresh function on every render, and reporting
  // the count back to the parent re-renders this component. Neither may end up
  // in `load`'s identity, or the effect below refetches forever.
  const onCountChangeRef = useRef(onCountChange);
  onCountChangeRef.current = onCountChange;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/seller/evidence?expenseId=${encodeURIComponent(expenseId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      const list: Evidence[] = data.evidence ?? [];
      setItems(list);
      onCountChangeRef.current?.(list.length);
    } catch {
      setErrorCode('GENERIC');
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setErrorCode(null);
    setNotice(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('expenseId', expenseId);
      const res = await fetch('/api/seller/evidence', { method: 'POST', body });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // Only codes we have copy for; anything else falls back rather than
        // rendering a raw translation key at the seller.
        setErrorCode(KNOWN_ERROR_CODES.has(data?.code) ? data.code : 'GENERIC');
        return;
      }

      setNotice(
        data?.evidence?.duplicateOfExisting
          ? t('sellerExpenses.evidenceDuplicate')
          : t('sellerExpenses.evidenceAdded'),
      );
      await load();
    } catch {
      setErrorCode('GENERIC');
    } finally {
      setBusy(false);
      // Allow re-picking the same file after a failure.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (item: Evidence) => {
    if (!window.confirm(t('sellerExpenses.evidenceDeleteConfirm'))) return;
    setErrorCode(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/seller/evidence/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      if (viewing?.id === item.id) setViewing(null);
      setNotice(t('sellerExpenses.evidenceDeleted'));
      await load();
    } catch {
      setErrorCode('GENERIC');
    } finally {
      setBusy(false);
    }
  };

  const atLimit = items.length >= MAX_EVIDENCE_PER_EXPENSE;
  const error = errorCode
    ? t(`sellerExpenses.evidenceError${errorCode}`, {
        size: MAX_LABEL,
        max: String(MAX_EVIDENCE_PER_EXPENSE),
      })
    : null;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3" style={NAV_CLEARANCE}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900">
          {items.length > 0
            ? t('sellerExpenses.evidenceCount', { count: String(items.length) })
            : t('sellerExpenses.evidenceHeading')}
        </h4>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
        ) : null}
      </div>

      {loading ? (
        <p className="mt-2 text-sm text-gray-500" aria-busy="true">
          …
        </p>
      ) : items.length === 0 ? (
        <p className="mt-1 text-sm text-gray-600">{t('sellerExpenses.evidenceNone')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {items.map((item) => {
            const isPdf = item.mimeType === 'application/pdf';
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
                {isPdf ? (
                  <FileText className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                ) : (
                  <ImageIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                  {item.originalFilename || t('sellerExpenses.evidenceHeading')}
                </span>
                <span className="text-xs tabular-nums text-gray-500">
                  {Math.max(1, Math.round(item.sizeBytes / 1024))} kB
                </span>
                {isPdf ? (
                  // A PDF is served as a download, never rendered inside
                  // HomeCheff's origin.
                  <a
                    href={contentUrl(item.id)}
                    className="rounded px-2 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    {t('sellerExpenses.evidenceDownload')}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewing(item)}
                    className="rounded px-2 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    {t('sellerExpenses.evidenceView')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  disabled={busy}
                  aria-label={`${t('sellerExpenses.evidenceDelete')} ${item.originalFilename ?? ''}`.trim()}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="mt-3" style={NAV_CLEARANCE}>
        <label
          htmlFor={inputId}
          style={NAV_CLEARANCE}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-700 ${
            atLimit || busy ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          {busy ? t('sellerExpenses.evidenceAdding') : t('sellerExpenses.evidenceAdd')}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            disabled={atLimit || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
            className="sr-only"
          />
        </label>
        <p className="mt-1.5 text-xs text-gray-500">
          {t('sellerExpenses.evidenceHint', { size: MAX_LABEL })}
        </p>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-gray-500">
        <p>{t('sellerExpenses.evidencePrivacy')}</p>
        <p>{t('sellerExpenses.evidenceNotProof')}</p>
        <p>{t('sellerExpenses.evidenceStripped')}</p>
        <p>{t('sellerExpenses.evidenceRetention')}</p>
      </div>

      {viewing ? <EvidenceViewer item={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}

function EvidenceViewer({ item, onClose }: { item: Evidence; onClose: () => void }) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      // z-[110] sits above the expense dialog at z-[100], which in turn clears
      // the bottom navigation at z-[65].
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        // Falls back to a literal name: translations load asynchronously, and a
        // modal that briefly has no accessible name is a real a11y defect.
        aria-label={t('sellerExpenses.evidenceViewerTitle') || 'Bewijsstuk bekijken'}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white pb-[max(0px,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <p className="min-w-0 truncate text-sm font-semibold text-gray-900">
            {item.originalFilename || t('sellerExpenses.evidenceViewerTitle')}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('sellerExpenses.evidenceViewerClose') || 'Sluiten'}
            className="rounded p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={contentUrl(item.id)}
            alt={item.originalFilename || t('sellerExpenses.evidenceViewerTitle')}
            className="mx-auto h-auto max-w-full"
          />
        </div>
      </div>
    </div>
  );
}
