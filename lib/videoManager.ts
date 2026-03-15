const STORAGE_KEY = 'homecheff-video-muted';

function readStoredMuted(): boolean | null {
  const read = (store: Storage | undefined): boolean | null => {
    if (!store) return null;
    try {
      const v = store.getItem(STORAGE_KEY);
      if (v === 'false') return false;
      if (v === 'true') return true;
      return null;
    } catch {
      return null;
    }
  };
  return read(typeof localStorage !== 'undefined' ? localStorage : undefined)
    ?? read(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined);
}

function writeStoredMuted(muted: boolean) {
  const str = muted ? 'true' : 'false';
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, str);
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(STORAGE_KEY, str);
  } catch {}
}

/**
 * Global Video Manager
 * - Maximaal 1 video tegelijk met geluid.
 * - Regel: eenmalig play + unmute → volgende filmpjes ook met geluid (play + unmute).
 *   Tot de gebruiker weer op mute zet → dan starten volgende video's weer gemuted.
 * Voorkeur wordt opgeslagen in localStorage + sessionStorage (blijft gelden tot regel wordt uitgezet).
 */
let userPrefersMuted: boolean | null = readStoredMuted();

class VideoManager {
  private allVideos: Set<HTMLVideoElement> = new Set();
  private currentlyPlayingVideo: HTMLVideoElement | null = null;
  /** Listeners voor 'play' om te garanderen dat nooit 2+ video's tegelijk spelen */
  private playListeners = new Map<HTMLVideoElement, () => void>();

  /** Gebruiker heeft mute/unmute geklikt: onthoud voor alle volgende video's (en persist in localStorage) */
  setUserPrefersMuted(muted: boolean) {
    userPrefersMuted = muted;
    writeStoredMuted(muted);
  }

  /** Voorkeur voor volgende video's. null = nog niet gezet (standaard muted voor autoplay). true = gemuted, false = unmuted. */
  getUserPrefersMuted(): boolean | null {
    return userPrefersMuted;
  }

  /** Of de video gemuted moet starten: true als voorkeur muted of nog niet gezet (autoplay-veilig). */
  /** Leest altijd even localStorage (Chrome mobiel: in-memory kan anders zijn dan opslag). */
  shouldStartMuted(): boolean {
    const stored = readStoredMuted();
    if (stored !== null) userPrefersMuted = stored;
    return userPrefersMuted !== false;
  }

  /**
   * Register a video element.
   * Bij 'play' wordt automatisch stopAllExcept(this) aangeroepen zodat nooit 2+ video's tegelijk spelen.
   */
  register(video: HTMLVideoElement) {
    this.allVideos.add(video);
    const onPlay = () => {
      this.stopAllExcept(video);
    };
    this.playListeners.set(video, onPlay);
    video.addEventListener('play', onPlay);
  }

  /**
   * Unregister a video element
   */
  unregister(video: HTMLVideoElement) {
    const onPlay = this.playListeners.get(video);
    if (onPlay) {
      video.removeEventListener('play', onPlay);
      this.playListeners.delete(video);
    }
    this.allVideos.delete(video);
    if (this.currentlyPlayingVideo === video) {
      this.currentlyPlayingVideo = null;
    }
  }

  /**
   * Stop all videos except the specified one.
   * Altijd maar 1 video tegelijk: alle andere pauzeren en resetten.
   * Eerst muten zodat er nooit geluid op de achtergrond blijft (tab niet zichtbaar).
   */
  stopAllExcept(exceptVideo: HTMLVideoElement | null) {
    const list = Array.from(this.allVideos);
    for (const video of list) {
      if (video && video !== exceptVideo) {
        try {
          video.muted = true;
          video.pause();
          video.currentTime = 0;
        } catch {
          // Element mogelijk al weg
        }
      }
    }
    this.currentlyPlayingVideo = exceptVideo;
  }

  /**
   * Start playing a video (stops all others first).
   * Probeer direct play() voor snellere start; bij niet-bereid wacht op canplay en retry.
   */
  playVideo(video: HTMLVideoElement) {
    this.stopAllExcept(video);

    if (!video || !video.paused) return;

    const tryPlay = (retryCount = 0) => {
      try {
        const p = video.play();
        if (p != null && typeof p.catch === 'function') {
          p.catch(() => {
            if (retryCount >= 2) return;
            const delay = retryCount === 0 ? 200 : 400;
            setTimeout(() => {
              if (video.paused && video.readyState >= 1) tryPlay(retryCount + 1);
            }, delay);
          });
        }
      } catch {
        if (retryCount < 2) {
          setTimeout(() => { try { if (video.paused) video.play(); } catch { /* noop */ } }, 200);
        }
      }
    };

    // Direct proberen voor snellere start; alleen wachten als nog geen metadata
    if (video.readyState >= 1) {
      tryPlay();
    } else {
      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadeddata', onCanPlay);
        tryPlay();
      };
      video.addEventListener('canplay', onCanPlay, { once: true });
      video.addEventListener('loadeddata', onCanPlay, { once: true });
      tryPlay();
    }
  }

  /**
   * Get the currently playing video
   */
  getCurrentlyPlaying(): HTMLVideoElement | null {
    return this.currentlyPlayingVideo;
  }

  /**
   * Check if a video is currently playing
   */
  isPlaying(video: HTMLVideoElement): boolean {
    return this.currentlyPlayingVideo === video && !video.paused;
  }

  /**
   * Stop alle video's (o.a. wanneer tab op achtergrond).
   */
  stopAll() {
    this.stopAllExcept(null);
  }
}

// Singleton instance
export const videoManager = new VideoManager();

// Geen afspelen op de achtergrond: bij tab/window niet zichtbaar alle video's muten en pauzeren
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videoManager.stopAll();
    }
  });
  // Extra: bij blur (ander programma actief) ook stoppen zodat geen geluid in achtergrond
  if (typeof window !== 'undefined') {
    window.addEventListener('blur', () => {
      videoManager.stopAll();
    });
  }
}







