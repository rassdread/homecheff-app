'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import OperationsSidepanelContent from '@/components/operations/OperationsSidepanelContent';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  /** tablet = side drawer; mobile = bottom sheet */
  variant?: 'drawer' | 'sheet';
};

export default function OperationsOverviewDrawer({
  open,
  onClose,
  variant = 'drawer',
}: Props) {
  const { tOr } = useTranslation();

  const title = tOr(
    'operations.sidepanel.overview',
    'Overview',
    'Overzicht',
  );
  const closeLabel = tOr('common.close', 'Close', 'Sluiten');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isSheet = variant === 'sheet';

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label={closeLabel}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute flex flex-col bg-[#faf8f4] shadow-2xl',
          isSheet
            ? 'inset-x-0 bottom-0 max-h-[min(88dvh,720px)] rounded-t-2xl border-t border-gray-200'
            : 'right-0 top-0 h-full w-full max-w-[360px] border-l border-gray-200',
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200/80 px-4 py-3">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <OperationsSidepanelContent
            surface={isSheet ? 'inline' : 'drawer'}
            layout={isSheet ? 'sheet' : 'drawer'}
            showProfileLink={!isSheet}
          />
        </div>
      </div>
    </div>
  );
}
