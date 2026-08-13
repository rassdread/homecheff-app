/**
 * Desktop / multiCol AW: when the feed column owns vertical scroll
 * (`data-wx-scroll-owner="feed"`), lock the document scrollport so the
 * Adaptive Workspace shell cannot be wheeled off-screen into blank body/html.
 *
 * Portrait mobile (scrollOwner=document) must NOT activate this lock.
 */

export const HC_AW_FEED_OWNS_DOCUMENT_SCROLL_CLASS =
  "hc-aw-feed-owns-document-scroll";

export const HC_AW_DOC_SCROLL_LOCK_ATTR = "data-hc-aw-doc-scroll-lock";

export function shouldLockDocumentScrollForFeedOwner(
  scrollOwner: "feed" | "document" | string | null | undefined,
): boolean {
  return scrollOwner === "feed";
}

/** Apply html class + attribute. Safe to call repeatedly. */
export function applyDocumentFeedScrollLock(): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.add(HC_AW_FEED_OWNS_DOCUMENT_SCROLL_CLASS);
  html.setAttribute(HC_AW_DOC_SCROLL_LOCK_ATTR, "1");
  // Align shell under the sticky header if the user had outer-scrolled.
  if (typeof window !== "undefined" && window.scrollY !== 0) {
    window.scrollTo(0, 0);
  }
}

/** Remove lock. Safe when not applied. */
export function releaseDocumentFeedScrollLock(): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove(HC_AW_FEED_OWNS_DOCUMENT_SCROLL_CLASS);
  html.removeAttribute(HC_AW_DOC_SCROLL_LOCK_ATTR);
}
