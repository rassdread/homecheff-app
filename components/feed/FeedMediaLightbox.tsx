"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { HomeCheffVideoPlayer } from "@/components/media/HomeCheffVideoPlayer";

export type FeedMediaLightboxPayload =
  | {
      kind: "image";
      src: string;
      alt: string;
    }
  | {
      kind: "video";
      src: string;
      fallbackSrc?: string;
      poster?: string | null;
    };

type FeedMediaLightboxProps = {
  open: boolean;
  onClose: () => void;
  payload: FeedMediaLightboxPayload | null;
  closeLabel: string;
};

/**
 * Fullscreen-style media viewer for feed cards (portal, body scroll lock).
 * In-overlay video uses native controls (separate from in-card autoplay coordinator).
 */
export function FeedMediaLightbox({
  open,
  onClose,
  payload,
  closeLabel,
}: FeedMediaLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    queueMicrotask(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open || !payload || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={closeLabel}
      >
        <X className="h-6 w-6" aria-hidden />
      </button>
      <div className="flex flex-1 items-center justify-center p-4 pt-14">
        <div
          className="max-h-[85dvh] max-w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {payload.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payload.src}
              alt={payload.alt}
              className="max-h-[85dvh] max-w-full object-contain shadow-2xl"
            />
          ) : (
            <HomeCheffVideoPlayer
              variant="lightbox"
              fallbackUI="inline"
              src={payload.src}
              fallbackSrc={payload.fallbackSrc}
              poster={payload.poster ?? undefined}
              className="relative max-h-[85dvh] max-w-full"
              videoClassName="max-h-[85dvh] max-w-full rounded-lg bg-black object-contain"
              playsInline
              preload="metadata"
              autoPlay
              muted
              nativeControls
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
