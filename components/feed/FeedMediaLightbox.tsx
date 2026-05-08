"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
} from "react-zoom-pan-pinch";
import { HomeCheffVideoPlayer } from "@/components/media/HomeCheffVideoPlayer";

const HISTORY_KEY = "hcMediaLb";

export type FeedMediaLightboxPayload =
  | {
      kind: "image";
      src: string;
      alt: string;
      /** Optioneel: pijlen + pinch op dezelfde set URL's */
      gallery?: { sources: string[]; index: number };
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
 * Fullscreen media (feed + profiel): portal, scroll lock, Escape, swipe-down dismiss,
 * pinch + double-tap zoom op foto's, optionele gallery. Video: contain, native controls.
 */
export function FeedMediaLightbox({
  open,
  onClose,
  payload,
  closeLabel,
}: FeedMediaLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const syncHistoryClose = useCallback(() => {
    try {
      if (
        typeof window !== "undefined" &&
        window.history.state &&
        (window.history.state as { [k: string]: unknown })[HISTORY_KEY]
      ) {
        window.history.back();
        return;
      }
    } catch {
      /* ignore */
    }
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        syncHistoryClose();
      }
    },
    [syncHistoryClose]
  );

  useEffect(() => {
    if (!open || !payload || payload.kind !== "image") return;
    const g = payload.gallery;
    setGalleryIndex(
      g && g.sources.length > 0
        ? Math.max(0, Math.min(g.index, g.sources.length - 1))
        : 0
    );
  }, [open, payload]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    try {
      window.history.pushState({ [HISTORY_KEY]: true }, "");
    } catch {
      /* ignore */
    }

    const onPop = () => {
      onClose();
    };
    window.addEventListener("popstate", onPop);
    queueMicrotask(() => closeRef.current?.focus());

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", onPop);
    };
  }, [open, handleKeyDown, onClose]);

  const imageSrc =
    payload?.kind === "image"
      ? payload.gallery?.sources?.length
        ? payload.gallery.sources[
            Math.max(
              0,
              Math.min(galleryIndex, payload.gallery.sources.length - 1)
            )
          ]
        : payload.src
      : "";

  const galleryLen =
    payload?.kind === "image" && payload.gallery?.sources?.length
      ? payload.gallery.sources.length
      : 0;

  if (!open || !payload || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      onClick={() => syncHistoryClose()}
    >
      <button
        ref={closeRef}
        type="button"
        className="absolute right-3 top-3 z-[210] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onClick={(e) => {
          e.stopPropagation();
          syncHistoryClose();
        }}
        aria-label={closeLabel}
      >
        <X className="h-6 w-6" aria-hidden />
      </button>

      {payload.kind === "image" && galleryLen > 1 && galleryIndex > 0 && (
        <button
          type="button"
          className="absolute left-2 top-1/2 z-[210] -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm hover:bg-white/25 md:left-4 md:p-3"
          aria-label="Vorige"
          onClick={(e) => {
            e.stopPropagation();
            setGalleryIndex((i) => Math.max(0, i - 1));
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {payload.kind === "image" && galleryLen > 1 && galleryIndex < galleryLen - 1 && (
        <button
          type="button"
          className="absolute right-2 top-1/2 z-[210] -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm hover:bg-white/25 md:right-4 md:p-3"
          aria-label="Volgende"
          onClick={(e) => {
            e.stopPropagation();
            setGalleryIndex((i) => Math.min(galleryLen - 1, i + 1));
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div
        className="flex flex-1 items-center justify-center overflow-hidden pt-14 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full max-h-[100dvh] w-full max-w-[100vw] items-center justify-center px-2">
          {payload.kind === "image" ? (
            <TransformWrapper
              key={imageSrc}
              initialScale={1}
              minScale={1}
              maxScale={5}
              centerOnInit
              doubleClick={{ mode: "toggle", step: 2 }}
              wheel={{ step: 0.12 }}
              pinch={{ step: 5 }}
              panning={{ velocityDisabled: true }}
            >
              <TransformComponent
                wrapperClass="!w-full !h-full max-h-[calc(100dvh-5rem)] flex items-center justify-center"
                contentClass="flex max-h-[calc(100dvh-5rem)] max-w-full items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={payload.alt}
                  className="max-h-[calc(100dvh-5rem)] max-w-[100vw] object-contain shadow-2xl"
                  draggable={false}
                />
              </TransformComponent>
            </TransformWrapper>
          ) : (
            <HomeCheffVideoPlayer
              variant="lightbox"
              fallbackUI="inline"
              src={payload.src}
              fallbackSrc={payload.fallbackSrc}
              poster={payload.poster ?? undefined}
              className="relative flex max-h-[calc(100dvh-4rem)] w-full max-w-[100vw] items-center justify-center"
              videoClassName="max-h-[calc(100dvh-4rem)] max-w-[100vw] rounded-lg bg-black object-contain"
              playsInline
              preload="metadata"
              autoPlay
              muted
              nativeControls
            />
          )}
        </div>
      </div>

      {payload.kind === "image" && galleryLen > 1 ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[210] -translate-x-1/2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
          {galleryIndex + 1} / {galleryLen}
        </div>
      ) : null}
    </div>,
    document.body
  );
}
