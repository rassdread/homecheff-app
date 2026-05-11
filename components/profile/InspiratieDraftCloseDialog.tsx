"use client";

import { useTranslation } from "@/hooks/useTranslation";

export type InspiratieDraftCloseDialogProps = {
  open: boolean;
  onCancel: () => void;
  onSaveAndClose: () => void;
  onDiscard: () => void;
};

/**
 * Bevestiging bij sluiten inspiratie-formulieren met onopgeslagen inhoud.
 */
export function InspiratieDraftCloseDialog({
  open,
  onCancel,
  onSaveAndClose,
  onDiscard,
}: InspiratieDraftCloseDialogProps) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      data-create-flow-dialog
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspiratie-draft-close-title"
    >
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
        <p id="inspiratie-draft-close-title" className="text-lg font-semibold text-gray-900">
          {t("createFlow.draftCloseTitle")}
        </p>
        <p className="text-sm text-gray-600">
          {t("createFlow.draftCloseBody")}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSaveAndClose}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
          >
            {t("createFlow.draftSaveAndClose")}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-800 bg-red-50 font-medium hover:bg-red-100 transition-colors min-h-[44px]"
          >
            {t("createFlow.draftDiscard")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-800 bg-white font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            {t("buttons.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
