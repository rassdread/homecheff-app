"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { PlayCircle, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { navDebug } from "@/lib/nav-debug";
import { inspirationMediaClass } from "@/lib/inspiratie/media-fit";
import { useSmartMediaFit } from "@/hooks/useSmartMediaFit";
import { FeedMediaLightbox } from "@/components/feed/FeedMediaLightbox";
import type { FeedMediaLightboxPayload } from "@/components/feed/FeedMediaLightbox";
import { HomeCheffVideoPlayer } from "@/components/media/HomeCheffVideoPlayer";
import {
  getVideoUrlWithCors,
  isEdgeAndroid,
  isSamsungBrowser,
} from "@/lib/videoUtils";
import {
  claimFeedVideoPlayback,
  releaseFeedVideoPlayback,
  registerFeedVideoPauseHandler,
  registerMobileFeedVideoCandidate,
  getElementVisibleRatio,
  subscribeFeedAudioState,
  getFeedAudioState,
  setFeedAudioEnabled,
  maybeApplyFeedAudioPreference,
} from "@/components/feed/feedVideoPlaybackCoordinator";

export const FEED_MEDIA_PLACEHOLDER = "/placeholder.webp";

const SERVER_FEED_AUDIO_SNAPSHOT = {
  audioEnabled: false,
  activeId: null as string | null,
};

const COARSE_POINTER_MQ = "(any-pointer: coarse)";

function subscribeCoarsePointer(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(COARSE_POINTER_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getCoarsePointerSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COARSE_POINTER_MQ).matches;
}

/** Voorkomt broken <img src=""> in Safari en bij lege strings. */
export function hasUsableMediaUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const u = url.trim();
  if (u.length < 4) return false;
  if (u === "undefined" || u === "null") return false;
  return (
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("/") ||
    u.startsWith("data:")
  );
}

export function pickPrimaryImageUrl(raw: Record<string, unknown>): string | null {
  const tryOne = (u: unknown) => (hasUsableMediaUrl(u) ? u : null);
  const images = raw.images as unknown;
  const listingMedia = raw.ListingMedia as Array<{ url?: string }> | undefined;

  let fromImages: string | null = null;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") fromImages = tryOne(first);
    else if (first && typeof first === "object" && "url" in first) {
      fromImages = tryOne((first as { url?: string }).url);
    }
  }

  return (
    tryOne(raw.photo) ||
    tryOne(raw.image) ||
    fromImages ||
    tryOne(listingMedia?.[0]?.url) ||
    null
  );
}

/** Eerste bruikbare video-URL + optionele thumbnail uit feed-/listing-raw (geen API-wijziging nodig). */
export function pickPrimaryVideoUrl(
  raw: Record<string, unknown>
): { url: string | null; thumbnail: string | null } {
  const tryUrl = (u: unknown): string | null =>
    hasUsableMediaUrl(u) ? String(u).trim() : null;

  const Video = raw.Video as
    | { url?: string; thumbnail?: string | null }
    | undefined;
  const video = raw.video as
    | { url?: string; thumbnail?: string | null }
    | undefined;
  const videos = raw.videos as
    | Array<{ url?: string; thumbnail?: string | null }>
    | undefined;
  const primaryVideo = raw.primaryVideo as { url?: string } | undefined;

  const url =
    tryUrl(Video?.url) ||
    tryUrl(video?.url) ||
    tryUrl(videos?.[0]?.url) ||
    tryUrl(primaryVideo?.url) ||
    tryUrl(raw.videoUrl) ||
    tryUrl(raw.primaryVideoUrl);

  const thumbnail =
    tryUrl(Video?.thumbnail) ||
    tryUrl(video?.thumbnail) ||
    tryUrl(videos?.[0]?.thumbnail) ||
    null;

  return { url, thumbnail };
}

/** Resultaat van resolvePrimaryMedia: video eerst, dan image, dan placeholder. */
export type ResolvedPrimaryMedia =
  | { type: "video"; src: string; poster: string | null }
  | { type: "image"; src: string }
  | { type: "placeholder" };

/** Volgorde: video → image → placeholder (geen image als primary als video bruikbaar is). */
export function resolvePrimaryMedia(
  raw: Record<string, unknown>
): ResolvedPrimaryMedia {
  const { url: vUrl, thumbnail: vThumb } = pickPrimaryVideoUrl(raw);
  const img = pickPrimaryImageUrl(raw);
  if (hasUsableMediaUrl(vUrl)) {
    return {
      type: "video",
      src: vUrl!.trim(),
      poster: hasUsableMediaUrl(vThumb) ? vThumb!.trim() : null,
    };
  }
  if (hasUsableMediaUrl(img)) {
    return { type: "image", src: img! };
  }
  return { type: "placeholder" };
}

/** Foto-URL voor poster-supplement of video-fout (los van resolvePrimaryMedia). */
export function primaryImageFallbackUrl(
  raw: Record<string, unknown>
): string | null {
  return pickPrimaryImageUrl(raw);
}

/** Zelfde prioriteit als resolvePrimaryMedia voor /api/inspiratie-items. */
export function pickPrimaryPhotoUrlFromPhotos(
  photos: Array<{ url?: string; isMain?: boolean }> | undefined
): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const main = photos.find((p) => p.isMain && hasUsableMediaUrl(p.url));
  if (main?.url) return main.url.trim();
  const first = photos[0];
  return hasUsableMediaUrl(first?.url) ? first.url.trim() : null;
}

export function resolvePrimaryMediaForInspirationApi(item: {
  photos?: Array<{ url?: string; isMain?: boolean }>;
  videos?: Array<{ url?: string; thumbnail?: string | null }>;
}): ResolvedPrimaryMedia {
  const img = pickPrimaryPhotoUrlFromPhotos(item.photos);
  const vid = item.videos?.[0];
  const vUrl = hasUsableMediaUrl(vid?.url) ? vid!.url!.trim() : null;
  if (vUrl) {
    const poster =
      (hasUsableMediaUrl(vid?.thumbnail) ? vid!.thumbnail!.trim() : null) ||
      img;
    return {
      type: "video",
      src: vUrl,
      poster,
    };
  }
  if (hasUsableMediaUrl(img)) {
    return { type: "image", src: img! };
  }
  return { type: "placeholder" };
}

export type FeedCardPrimaryMediaProps = {
  href: string;
  alt: string;
  videoUrl?: string | null;
  videoPoster?: string | null;
  imageUrl?: string | null;
  objectFit?: "cover" | "contain" | "smart";
  /** Extra classes op de inner media-wrapper (niet op aspect-box). */
  className?: string;
  badgeOverlay?: ReactNode;
};

/**
 * Eén gedeelde bron voor hover vs viewport (geen N× matchMedia per kaart — veel minder listeners bij volle feed).
 */
let feedInteractionListeners = new Set<() => void>();
let feedInteractionMediaBound = false;

function readFeedVideoInteractionMode(): "hover" | "viewport" {
  if (typeof window === "undefined") return "viewport";
  const coarse = window.matchMedia("(any-pointer: coarse)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  return !coarse && fine && canHover ? "hover" : "viewport";
}

function notifyFeedInteractionListeners() {
  feedInteractionListeners.forEach((l) => l());
}

function subscribeFeedVideoInteractionMode(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  if (!feedInteractionMediaBound) {
    feedInteractionMediaBound = true;
    const sync = () => notifyFeedInteractionListeners();
    ["(any-pointer: coarse)", "(pointer: fine)", "(hover: hover)"].forEach(
      (q) => window.matchMedia(q).addEventListener("change", sync)
    );
  }
  feedInteractionListeners.add(onStoreChange);
  return () => {
    feedInteractionListeners.delete(onStoreChange);
  };
}

function getFeedVideoInteractionSnapshot(): "hover" | "viewport" {
  return readFeedVideoInteractionMode();
}

/**
 * Alleen echte desktop-muis: geen coarse pointer (tablet/touch), anders viewport-gestuurde playback.
 */
function useFeedVideoInteractionMode(): "hover" | "viewport" {
  return useSyncExternalStore(
    subscribeFeedVideoInteractionMode,
    getFeedVideoInteractionSnapshot,
    () => "viewport"
  );
}

/** Typische homepage-feed grid: helpt browser bij schalen (ook bij enkele src-URL). */
const FEED_CARD_IMG_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/** Iets lager dan 0.6 zodat kaartvideo’s in de feed weer betrouwbaar starten. */
const VIEWPORT_PLAY_THRESHOLD = 0.3;

/**
 * Gedeelde feed-media: vaste aspect-ratio, video voorrang, standaard muted (autoplay).
 * Globale feed-audio voorkeur: één keer “geluid aan” → volgende actieve video’s ook met geluid
 * tot gebruiker mute (coordinator: feedAudioUserEnabled).
 * Desktop: hover; mobiel: viewport-threshold. Max. één actieve speler.
 */
export function FeedCardPrimaryMedia({
  href,
  alt,
  videoUrl,
  videoPoster,
  imageUrl,
  objectFit = "smart",
  className = "",
  badgeOverlay,
}: FeedCardPrimaryMediaProps) {
  const reactId = useId().replace(/:/g, "");
  const instanceId = `feed-vid-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wantPlayRef = useRef(false);
  const smartFit = useSmartMediaFit(imageUrl ?? null, {
    mode: "card",
    forceFit: objectFit === "smart" ? undefined : objectFit,
  });
  const fitClass = inspirationMediaClass(
    objectFit === "smart" ? smartFit : objectFit,
  );
  const interactionMode = useFeedVideoInteractionMode();
  const useHoverPlayback = interactionMode === "hover";
  const { t } = useTranslation();
  const nativeMounted = useIsNativeAppMounted();
  const coarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    () => false
  );
  /** Touch mobile web opens lightbox; native app navigates to listing detail on media tap. */
  const lightboxEligible = coarsePointer && !nativeMounted;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPayload, setLightboxPayload] =
    useState<FeedMediaLightboxPayload | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  const feedAudio = useSyncExternalStore(
    subscribeFeedAudioState,
    getFeedAudioState,
    () => SERVER_FEED_AUDIO_SNAPSHOT
  );
  const isAudible =
    feedAudio.activeId === instanceId && feedAudio.audioEnabled;

  const applyMutedForFeedPolicy = useCallback(() => {
    maybeApplyFeedAudioPreference(videoRef.current, instanceId);
  }, [instanceId]);

  const rawVideo = (videoUrl ?? "").trim();
  const hasVideoCandidate =
    hasUsableMediaUrl(videoUrl) && !videoFailed && rawVideo.length > 0;
  const corsSrc = hasVideoCandidate ? getVideoUrlWithCors(rawVideo) : undefined;
  const proxyFallback =
    hasVideoCandidate &&
    (rawVideo.includes("vercel-storage.com") ||
      rawVideo.includes("blob.vercel"))
      ? `/api/video-proxy?url=${encodeURIComponent(rawVideo)}`
      : undefined;
  const useEdgeStyleFallback =
    hasVideoCandidate &&
    (isEdgeAndroid() || isSamsungBrowser()) &&
    Boolean(proxyFallback);
  const fallbackVideoSrc = useEdgeStyleFallback
    ? proxyFallback!
    : rawVideo;

  const showVideo = Boolean(corsSrc);
  /** Viewport/touch: mount <video> pas nabij viewport; desktop-hover: meteen (play op hover). */
  const shouldDeferVideoMount = showVideo && !useHoverPlayback;
  const [videoDomMounted, setVideoDomMounted] = useState(!shouldDeferVideoMount);
  const renderVideoElement = showVideo && videoDomMounted;

  useEffect(() => {
    if (useHoverPlayback && showVideo) setVideoDomMounted(true);
  }, [useHoverPlayback, showVideo]);

  useEffect(() => {
    setVideoFailed(false);
    setImgBroken(false);
    wantPlayRef.current = false;
    if (showVideo && !useHoverPlayback) setVideoDomMounted(false);
    else if (showVideo && useHoverPlayback) setVideoDomMounted(true);
  }, [videoUrl, imageUrl, showVideo, useHoverPlayback]);

  useEffect(() => {
    if (!shouldDeferVideoMount || videoDomMounted) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVideoDomMounted(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: "260px 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldDeferVideoMount, videoDomMounted]);

  const posterEffective =
    (hasUsableMediaUrl(videoPoster) ? videoPoster!.trim() : null) ||
    (hasUsableMediaUrl(imageUrl) ? imageUrl!.trim() : undefined);
  const staticPosterSrc =
    posterEffective ||
    (hasUsableMediaUrl(imageUrl) ? imageUrl!.trim() : FEED_MEDIA_PLACEHOLDER);

  const showImage =
    (!showVideo || videoFailed) &&
    hasUsableMediaUrl(imageUrl) &&
    !imgBroken;

  const onVideoError = useCallback(() => setVideoFailed(true), []);
  const onImgError = useCallback(() => setImgBroken(true), []);

  const tryPlayIfWanted = useCallback(() => {
    if (!wantPlayRef.current) return;
    const vid = videoRef.current;
    if (!vid) return;
    claimFeedVideoPlayback(instanceId);
    applyMutedForFeedPolicy();
    void vid.play().catch(() => {});
  }, [instanceId, applyMutedForFeedPolicy]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !renderVideoElement) return;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
  }, [renderVideoElement, corsSrc]);

  useEffect(() => {
    if (!renderVideoElement) return;
    return registerFeedVideoPauseHandler(instanceId, () => {
      videoRef.current?.pause();
    });
  }, [renderVideoElement, instanceId]);

  const onDesktopMouseEnter = useCallback(() => {
    if (!useHoverPlayback || !renderVideoElement) return;
    wantPlayRef.current = true;
    const vid = videoRef.current;
    if (!vid) return;
    claimFeedVideoPlayback(instanceId);
    applyMutedForFeedPolicy();
    void vid.play().catch(() => {});
  }, [useHoverPlayback, renderVideoElement, instanceId, applyMutedForFeedPolicy]);

  const onDesktopMouseLeave = useCallback(() => {
    if (!useHoverPlayback || !renderVideoElement) return;
    wantPlayRef.current = false;
    const vid = videoRef.current;
    if (vid) {
      vid.pause();
      vid.currentTime = 0;
    }
    releaseFeedVideoPlayback(instanceId, {
      minVisibleRatio: VIEWPORT_PLAY_THRESHOLD,
    });
  }, [useHoverPlayback, renderVideoElement, instanceId]);

  useEffect(() => {
    if (!renderVideoElement || !corsSrc || useHoverPlayback) return;
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const vid = videoRef.current;
        if (!e || !vid) return;
        const ratio = e.intersectionRatio;
        const shouldPlay = ratio >= VIEWPORT_PLAY_THRESHOLD;
        wantPlayRef.current = shouldPlay;
        if (shouldPlay) {
          claimFeedVideoPlayback(instanceId);
          maybeApplyFeedAudioPreference(vid, instanceId);
          void vid.play().catch(() => {});
        } else {
          vid.pause();
          releaseFeedVideoPlayback(instanceId, {
            minVisibleRatio: VIEWPORT_PLAY_THRESHOLD,
          });
        }
      },
      {
        root: null,
        rootMargin: "48px 0px",
        threshold: [0, 0.15, 0.25, 0.3, 0.45, 0.6, 0.75, 1],
      }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      wantPlayRef.current = false;
      videoRef.current?.pause();
      releaseFeedVideoPlayback(instanceId, {
        minVisibleRatio: VIEWPORT_PLAY_THRESHOLD,
      });
    };
  }, [renderVideoElement, corsSrc, useHoverPlayback, instanceId]);

  useEffect(() => {
    if (!renderVideoElement || !corsSrc || useHoverPlayback) return;
    return registerMobileFeedVideoCandidate({
      id: instanceId,
      getRatio: () => getElementVisibleRatio(containerRef.current),
      play: () => {
        const vid = videoRef.current;
        if (!vid) return;
        wantPlayRef.current = true;
        claimFeedVideoPlayback(instanceId);
        maybeApplyFeedAudioPreference(vid, instanceId);
        void vid.play().catch(() => {});
      },
    });
  }, [renderVideoElement, corsSrc, useHoverPlayback, instanceId]);

  const label = alt?.trim() || "Bekijk";

  const hasOpenableLightboxMedia =
    (Boolean(corsSrc) && !videoFailed) ||
    (showImage && hasUsableMediaUrl(imageUrl));

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxPayload(null);
  }, []);

  const openLightbox = useCallback(() => {
    if (!lightboxEligible || !hasOpenableLightboxMedia) return;
    if (hasVideoCandidate && corsSrc && !videoFailed) {
      wantPlayRef.current = false;
      videoRef.current?.pause();
      releaseFeedVideoPlayback(instanceId, {
        minVisibleRatio: VIEWPORT_PLAY_THRESHOLD,
      });
      setLightboxPayload({
        kind: "video",
        src: corsSrc,
        fallbackSrc:
          fallbackVideoSrc && fallbackVideoSrc !== corsSrc
            ? fallbackVideoSrc
            : undefined,
        poster: posterEffective,
      });
      setLightboxOpen(true);
      return;
    }
    if (showImage && hasUsableMediaUrl(imageUrl)) {
      setLightboxPayload({
        kind: "image",
        src: imageUrl!.trim(),
        alt: label,
      });
      setLightboxOpen(true);
    }
  }, [
    lightboxEligible,
    hasOpenableLightboxMedia,
    hasVideoCandidate,
    corsSrc,
    videoFailed,
    showImage,
    imageUrl,
    instanceId,
    fallbackVideoSrc,
    posterEffective,
    label,
  ]);

  const hoverMediaHandlers =
    useHoverPlayback && renderVideoElement
      ? {
          onMouseEnter: onDesktopMouseEnter,
          onMouseLeave: onDesktopMouseLeave,
        }
      : {};

  return (
    <>
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 feed-card-primary-media"
      {...(lightboxEligible ? hoverMediaHandlers : {})}
    >
      <div className={`absolute inset-0 z-0 ${className}`}>
        {renderVideoElement ? (
          <HomeCheffVideoPlayer
            ref={videoRef}
            variant="compact"
            fallbackUI="none"
            src={corsSrc}
            fallbackSrc={
              fallbackVideoSrc && fallbackVideoSrc !== corsSrc
                ? fallbackVideoSrc
                : undefined
            }
            poster={posterEffective}
            videoClassName={`pointer-events-none absolute inset-0 h-full w-full ${fitClass}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            muted={!isAudible}
            loop
            playsInline
            preload="metadata"
            nativeControls={false}
            disablePictureInPicture
            onLoadedData={tryPlayIfWanted}
            onError={onVideoError}
          />
        ) : showVideo && shouldDeferVideoMount ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staticPosterSrc}
            alt={label}
            className={`absolute inset-0 h-full w-full ${fitClass}`}
            loading="lazy"
            decoding="async"
            sizes={FEED_CARD_IMG_SIZES}
          />
        ) : showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl!.trim()}
            alt={label}
            className={`absolute inset-0 h-full w-full ${fitClass}`}
            loading="lazy"
            decoding="async"
            sizes={FEED_CARD_IMG_SIZES}
            onError={onImgError}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={FEED_MEDIA_PLACEHOLDER}
            alt=""
            className={`absolute inset-0 h-full w-full ${fitClass}`}
            loading="lazy"
            decoding="async"
            sizes={FEED_CARD_IMG_SIZES}
          />
        )}
      </div>

      {lightboxEligible ? (
        <button
          type="button"
          className={`absolute inset-0 z-10 border-0 bg-transparent p-0 ${
            hasOpenableLightboxMedia
              ? "cursor-pointer"
              : "cursor-default pointer-events-none"
          }`}
          aria-label={t("feed.openMediaFullscreen")}
          disabled={!hasOpenableLightboxMedia}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox();
          }}
        >
          <span className="sr-only">{t("feed.openMediaFullscreen")}</span>
        </button>
      ) : (
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={label}
          onClick={() => navDebug('feed-tile:media-link', { href })}
          onMouseEnter={
            useHoverPlayback && renderVideoElement
              ? onDesktopMouseEnter
              : undefined
          }
          onMouseLeave={
            useHoverPlayback && renderVideoElement
              ? onDesktopMouseLeave
              : undefined
          }
        >
          <span className="sr-only">{label}</span>
        </Link>
      )}

      {renderVideoElement ? (
        <button
          type="button"
          className="absolute bottom-2 right-2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label={isAudible ? "Geluid uit" : "Geluid aan"}
          aria-pressed={isAudible}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const vid = videoRef.current;
            if (!vid) return;
            const st = getFeedAudioState();
            const isThisActive = st.activeId === instanceId;
            if (isThisActive && st.audioEnabled) {
              setFeedAudioEnabled(false);
              vid.muted = true;
              void vid.play().catch(() => {});
            } else {
              claimFeedVideoPlayback(instanceId);
              wantPlayRef.current = true;
              setFeedAudioEnabled(true);
              maybeApplyFeedAudioPreference(vid, instanceId);
              void vid.play().catch(() => {});
            }
          }}
        >
          {isAudible ? (
            <Volume2 className="h-5 w-5" aria-hidden />
          ) : (
            <VolumeX className="h-5 w-5" aria-hidden />
          )}
        </button>
      ) : null}

      {badgeOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          {badgeOverlay}
        </div>
      ) : null}
    </div>
    <FeedMediaLightbox
      open={lightboxOpen}
      onClose={closeLightbox}
      payload={lightboxPayload}
      closeLabel={t("feed.closeMediaViewer")}
    />
    </>
  );
}

type FeedCardImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  showVideoHint?: boolean;
};

export function FeedCardImage({
  src,
  alt,
  className = "",
  showVideoHint,
}: FeedCardImageProps) {
  const [broken, setBroken] = useState(false);
  const resolved =
    !broken && hasUsableMediaUrl(src) ? src.trim() : FEED_MEDIA_PLACEHOLDER;
  const onError = useCallback(() => setBroken(true), []);

  return (
    <div className={`relative bg-stone-100 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt}
        className="w-full h-full object-cover"
        onError={onError}
        loading="lazy"
        decoding="async"
        sizes={FEED_CARD_IMG_SIZES}
      />
      {showVideoHint ? (
        <div
          className="absolute bottom-2 right-2 rounded-full bg-black/55 text-white p-1 pointer-events-none"
          aria-hidden
        >
          <PlayCircle className="w-5 h-5" />
        </div>
      ) : null}
    </div>
  );
}
