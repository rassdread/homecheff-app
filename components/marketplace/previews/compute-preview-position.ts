export type PreviewPosition = {
  top: number;
  left: number;
  maxWidth: number;
};

const PREVIEW_MAX_WIDTH = 420;
const VIEWPORT_MARGIN = 12;
const GAP = 8;

export function computePreviewPosition(anchor: DOMRect): PreviewPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxWidth = Math.min(PREVIEW_MAX_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const estimatedHeight = Math.min(480, vh - VIEWPORT_MARGIN * 2);

  let left = anchor.right + GAP;
  let top = anchor.top;

  if (left + maxWidth > vw - VIEWPORT_MARGIN) {
    left = anchor.left - maxWidth - GAP;
  }
  if (left < VIEWPORT_MARGIN) {
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(anchor.left, vw - maxWidth - VIEWPORT_MARGIN),
    );
  }

  if (top + estimatedHeight > vh - VIEWPORT_MARGIN) {
    top = vh - estimatedHeight - VIEWPORT_MARGIN;
  }
  if (top < VIEWPORT_MARGIN) {
    top = VIEWPORT_MARGIN;
  }

  return { top, left, maxWidth };
}
