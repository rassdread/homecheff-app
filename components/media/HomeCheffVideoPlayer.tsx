"use client";

/**
 * Eén gedeelde videospeler voor feed (compact), productcarousel (detail) en lightbox/fullscreen.
 * Edge-/proxy-fallback blijft in EdgeAwareVideo; hier: preload-varianten, controls, fout-Fallback-UI.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { EdgeAwareVideo } from "@/components/ui/EdgeAwareVideo";
import { formatMediaErrorForDevLog } from "@/lib/videoUtils";

export type HomeCheffVideoVariant = "compact" | "detail" | "lightbox";

export type HomeCheffVideoPlayerProps = Omit<
  ComponentPropsWithoutRef<"video">,
  "src"
> & {
  src?: string;
  fallbackSrc?: string;
  poster?: string | null;
  /** compact = feed-kaart; detail = productcarousel; lightbox = fullscreen viewer */
  variant?: HomeCheffVideoVariant;
  /** Standaard: false bij compact, true bij detail/lightbox */
  nativeControls?: boolean;
  className?: string;
  videoClassName?: string;
  /**
   * none = ouder handelt fout af (b.v. feed → poster);
   * inline = toon bericht i.p.v. kapotte speler
   */
  fallbackUI?: "none" | "inline";
  onFatalPlaybackError?: (info: {
    src?: string;
    detail: string;
  }) => void;
};

const VARIANT_PRELOAD_DEFAULT: Record<
  HomeCheffVideoVariant,
  "none" | "metadata" | "auto"
> = {
  compact: "metadata",
  detail: "auto",
  lightbox: "metadata",
};

export const HomeCheffVideoPlayer = forwardRef<
  HTMLVideoElement,
  HomeCheffVideoPlayerProps
>(function HomeCheffVideoPlayer(
  {
    src,
    fallbackSrc,
    poster,
    variant = "detail",
    nativeControls,
    controls: controlsProp,
    className = "",
    videoClassName = "",
    fallbackUI = "inline",
    onFatalPlaybackError,
    onError,
    preload,
    ...rest
  },
  ref
) {
  const [playbackFailed, setPlaybackFailed] = useState(false);

  useEffect(() => {
    setPlaybackFailed(false);
  }, [src]);

  const controls =
    nativeControls !== undefined
      ? nativeControls
      : controlsProp !== undefined
        ? controlsProp
        : variant !== "compact";

  const effectivePreload = preload ?? VARIANT_PRELOAD_DEFAULT[variant];

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const el = e.currentTarget;
      const detail = formatMediaErrorForDevLog(el.error, src);
      if (process.env.NODE_ENV === "development") {
        console.warn("[HomeCheffVideoPlayer] playback error", {
          src,
          fallbackSrc,
          detail,
        });
      }
      if (fallbackUI === "inline") {
        setPlaybackFailed(true);
      }
      onFatalPlaybackError?.({ src, detail });
      onError?.(e);
    },
    [src, fallbackSrc, fallbackUI, onFatalPlaybackError, onError]
  );

  if (!src) {
    return null;
  }

  if (playbackFailed && fallbackUI === "inline") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-stone-900 text-white p-6 text-center text-sm ${className}`}
        role="alert"
      >
        <p className="font-medium">
          Deze video kan niet goed worden afgespeeld op dit apparaat.
        </p>
        <p className="text-stone-400 text-xs max-w-sm">
          Mogelijk ondersteunt je browser dit formaat niet (bijv. bepaalde codecs).
          Een MP4 met H.264 en AAC werkt het beste op web en Android.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <EdgeAwareVideo
        ref={ref}
        src={src}
        fallbackSrc={fallbackSrc}
        poster={poster ?? undefined}
        controls={controls}
        preload={effectivePreload}
        playsInline
        className={videoClassName}
        onError={handleError}
        {...rest}
      />
    </div>
  );
});
