/**
 * Maximaal één feed-video tegelijk actief.
 * Desktop: hover start/stopt lokaal; andere kaarten worden via claim gepauzeerd.
 * Mobiel: na release wordt de zichtbaarste kaart (≥ threshold) gekozen.
 *
 * Audio: standaard muted (autoplay). Globale voorkeur `feedAudioUserEnabled`:
 * na één keer “geluid aan” blijven volgende actieve feed-video’s geluid gebruiken
 * tot de gebruiker expliciet mute (zelfde knop op de actieve kaart).
 */

const pauseHandlers = new Map<string, () => void>();

let activeFeedVideoId: string | null = null;

/** Feed-breed: “volgende actieve video mag geluid” (user gesture zet dit aan). */
let feedAudioUserEnabled = false;

const feedAudioStateListeners = new Set<() => void>();

export type FeedAudioSnapshot = {
  audioEnabled: boolean;
  activeId: string | null;
};

let cachedFeedAudioSnapshot: FeedAudioSnapshot = {
  audioEnabled: false,
  activeId: null,
};

function snapshotsEqual(a: FeedAudioSnapshot, b: FeedAudioSnapshot): boolean {
  return a.audioEnabled === b.audioEnabled && a.activeId === b.activeId;
}

function buildFeedAudioSnapshot(): FeedAudioSnapshot {
  return {
    audioEnabled: feedAudioUserEnabled,
    activeId: activeFeedVideoId,
  };
}

function notifyFeedAudioStateListeners() {
  feedAudioStateListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* ignore */
    }
  });
}

/** Voor useSyncExternalStore op feed-kaarten (audio + welke id actief is). */
export function subscribeFeedAudioState(listener: () => void): () => void {
  feedAudioStateListeners.add(listener);
  return () => feedAudioStateListeners.delete(listener);
}

export function getFeedAudioState(): FeedAudioSnapshot {
  const next = buildFeedAudioSnapshot();
  if (snapshotsEqual(next, cachedFeedAudioSnapshot)) {
    return cachedFeedAudioSnapshot;
  }
  cachedFeedAudioSnapshot = next;
  return cachedFeedAudioSnapshot;
}

export function isFeedAudioEnabled(): boolean {
  return feedAudioUserEnabled;
}

export function setFeedAudioEnabled(value: boolean): void {
  if (feedAudioUserEnabled === value) return;
  feedAudioUserEnabled = value;
  notifyFeedAudioStateListeners();
}

/**
 * Zet muted op een video-element volgens actieve id + globale feed-audio voorkeur.
 */
export function maybeApplyFeedAudioPreference(
  vid: HTMLVideoElement | null,
  instanceId: string
): void {
  if (!vid) return;
  const active = activeFeedVideoId === instanceId;
  vid.muted = !(active && feedAudioUserEnabled);
}

type MobileCandidate = {
  id: string;
  getRatio: () => number;
  play: () => void;
};

const mobileCandidates: MobileCandidate[] = [];

function pickBestMobileResume(minRatio: number) {
  if (activeFeedVideoId !== null) return;
  let best: MobileCandidate | null = null;
  let bestR = minRatio - 0.001;
  for (const c of mobileCandidates) {
    let r = 0;
    try {
      r = c.getRatio();
    } catch {
      r = 0;
    }
    if (r >= minRatio && r > bestR) {
      bestR = r;
      best = c;
    }
  }
  if (best) {
    best.play();
  }
}

function scheduleMobileResume(minRatio: number) {
  if (typeof requestAnimationFrame === "undefined") {
    pickBestMobileResume(minRatio);
    return;
  }
  requestAnimationFrame(() => pickBestMobileResume(minRatio));
}

/** Pauzeer huidige actieve (indien ander id), maak id actief. */
export function claimFeedVideoPlayback(id: string): void {
  if (activeFeedVideoId === id) return;
  if (activeFeedVideoId !== null) {
    pauseHandlers.get(activeFeedVideoId)?.();
  }
  activeFeedVideoId = id;
  notifyFeedAudioStateListeners();
}

/**
 * Actieve video vrijgeven (mouse leave / uit viewport).
 * Triggert op mobiel herkeuze van de zichtbaarste kaart.
 */
export function releaseFeedVideoPlayback(
  id: string,
  options?: { minVisibleRatio?: number }
): void {
  if (activeFeedVideoId !== id) return;
  activeFeedVideoId = null;
  notifyFeedAudioStateListeners();
  const minR = options?.minVisibleRatio ?? 0.3;
  scheduleMobileResume(minR);
}

/** Alleen pauzeren (geen seek) wanneer een andere kaart claimt. */
export function registerFeedVideoPauseHandler(
  id: string,
  pauseFn: () => void
): () => void {
  pauseHandlers.set(id, pauseFn);
  return () => {
    pauseHandlers.delete(id);
    if (activeFeedVideoId === id) {
      activeFeedVideoId = null;
      notifyFeedAudioStateListeners();
      scheduleMobileResume(0.3);
    }
  };
}

export function registerMobileFeedVideoCandidate(
  candidate: MobileCandidate
): () => void {
  mobileCandidates.push(candidate);
  return () => {
    const i = mobileCandidates.indexOf(candidate);
    if (i !== -1) mobileCandidates.splice(i, 1);
  };
}

/** Zichtbaarheidsratio 0–1 t.o.v. viewport (intersectie / oppervlak element). */
export function getElementVisibleRatio(el: Element | null): number {
  if (el == null || typeof window === "undefined") return 0;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return 0;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const iw = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
  const ih = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
  const inter = iw * ih;
  const area = r.width * r.height;
  return area > 0 ? inter / area : 0;
}
