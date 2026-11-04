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
  /** Keeps the feed carousel on the photo the visitor last viewed. */
  onGalleryIndexChange?: (index: number) => void;
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
  onGalleryIndexChange,
}: FeedMediaLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const [zoomed, setZoomed] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const onGalleryIndexChangeRef = useRef(onGalleryIndexChange);
  onGalleryIndexChangeRef.current = onGalleryIndexChange;

  const galleryIndexRef = useRef(0);
  galleryIndexRef.current = galleryIndex;

  const moveGallery = useCallback((next: number) => {
    setGalleryIndex(next);
    onGalleryIndexChangeRef.current?.(next);
  }, []);

  const syncHistoryClose = useCallback(() => {
    onGalleryIndexChangeRef.current?.(galleryIndexRef.current);
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
        return;
      }
      if (payload?.kind !== "image" || !payload.gallery || payload.gallery.sources.length < 2) {
        return;
      }
      const last = payload.gallery.sources.length - 1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveGallery(Math.max(0, galleryIndexRef.current - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveGallery(Math.min(last, galleryIndexRef.current + 1));
      }
    },
    [syncHistoryClose, payload, moveGallery]
  );

  useEffect(() => {
    if (!open || !payload || payload.kind !== "image") return;
    const g = payload.gallery;
    setGalleryIndex(
      g && g.sources.length > 0
        ? Math.max(0, Math.min(g.index, g.sources.length - 1))
        : 0
    );
    scaleRef.current = 1;
    setZoomed(false);
  }, [open, payload]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const y = window.scrollY;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    try {
      window.history.pushState({ [HISTORY_KEY]: true }, "");
    } catch {
      /* ignore */
    }

    const onPop = () => {
      onGalleryIndexChangeRef.current?.(galleryIndexRef.current);
      onClose();
    };
    window.addEventListener("popstate", onPop);
    queueMicrotask(() => closeRef.current?.focus());

    return () => {
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, y);
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

  useEffect(() => {
    const el = stageRef.current;
    if (!open || !el || galleryLen < 2) return;
    let startX = 0;
    let startY = 0;
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startX = event.touches[0]?.clientX ?? 0;
      startY = event.touches[0]?.clientY ?? 0;
    };
    const onEnd = (event: TouchEvent) => {
      if (scaleRef.current > 1.02) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
      const last = galleryLen - 1;
      if (dx < 0) moveGallery(Math.min(last, galleryIndexRef.current + 1));
      else moveGallery(Math.max(0, galleryIndexRef.current - 1));
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [open, galleryLen, moveGallery]);

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
            moveGallery(Math.max(0, galleryIndex - 1));
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
            moveGallery(Math.min(galleryLen - 1, galleryIndex + 1));
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div
        ref={stageRef}
        data-lightbox-swipe="true"
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
              panning={{ disabled: !zoomed, velocityDisabled: true }}
              onTransform={(_ref, state) => {
                scaleRef.current = state.scale;
                const nextZoomed = state.scale > 1.02;
                setZoomed((prev) => (prev === nextZoomed ? prev : nextZoomed));
              }}
            >
              <TransformComponent
                wrapperClass="!h-full !w-full max-h-[calc(100dvh-5rem)]"
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
