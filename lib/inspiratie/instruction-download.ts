import type { InspirationCategory } from './instruction-content';
import { getInspiratiePrintUrl } from './instruction-content';

export type InstructionDownloadState = {
  available: boolean;
  requiresCredits: boolean;
  creditPrice: number | null;
  printUrl: string;
  downloadUrl: string | null;
  previewAllowed: boolean;
  pdfReady: boolean;
};

/**
 * Download/print action model — prepared for future credits system.
 * PDF download currently routes to print view (browser print-to-PDF).
 */
export function buildInstructionDownloadState(
  category: InspirationCategory,
  itemId: string,
  opts?: { isOwner?: boolean },
): InstructionDownloadState {
  const printUrl = getInspiratiePrintUrl(category, itemId);
  const isOwner = opts?.isOwner ?? false;

  return {
    available: true,
    requiresCredits: false,
    creditPrice: null,
    printUrl,
    downloadUrl: null,
    previewAllowed: true,
    pdfReady: false,
  };
}
