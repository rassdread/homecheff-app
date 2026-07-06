/**
 * Centralized marketplace preview state — Phase 5A.
 * Ensures one preview at a time, scroll cooldown, and open/close attribution.
 */

import {
  PREVIEW_SCROLL_COOLDOWN_MS,
} from './preview-constants';

export type PreviewOpenSource = 'hover' | 'info_click' | 'long_press';

export type PreviewCloseReason =
  | 'leave'
  | 'escape'
  | 'info_click'
  | 'backdrop'
  | 'swipe'
  | 'scroll'
  | 'external'
  | 'replaced';

type PreviewState = {
  activeListingId: string | null;
  openSource: PreviewOpenSource | null;
  openedAt: number | null;
  lastCloseReason: PreviewCloseReason | null;
};

type Listener = () => void;

export type PreviewCloseEvent = {
  listingId: string;
  reason: PreviewCloseReason;
  duration: number;
  source: PreviewOpenSource | null;
};

type CloseListener = (event: PreviewCloseEvent) => void;

class PreviewStateManager {
  private state: PreviewState = {
    activeListingId: null,
    openSource: null,
    openedAt: null,
    lastCloseReason: null,
  };

  private listeners = new Set<Listener>();
  private closeListeners = new Set<CloseListener>();
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private isScrolling = false;
  private scrollListenerAttached = false;

  private ensureScrollListener(): void {
    if (this.scrollListenerAttached || typeof window === 'undefined') return;
    this.scrollListenerAttached = true;
    window.addEventListener('scroll', this.handleScroll, {
      passive: true,
      capture: true,
    });
  }

  private handleScroll = (): void => {
    this.isScrolling = true;
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      this.isScrolling = false;
      this.notify();
    }, PREVIEW_SCROLL_COOLDOWN_MS);

    if (this.state.activeListingId) {
      this.close(this.state.activeListingId, 'scroll');
    }
    this.notify();
  };

  subscribe(listener: Listener): () => void {
    this.ensureScrollListener();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onClose(listener: CloseListener): () => void {
    this.closeListeners.add(listener);
    return () => this.closeListeners.delete(listener);
  }

  private emitClose(event: PreviewCloseEvent): void {
    for (const listener of this.closeListeners) {
      listener(event);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getState(): Readonly<PreviewState> {
    return this.state;
  }

  isActive(listingId: string): boolean {
    return this.state.activeListingId === listingId;
  }

  canHoverOpen(): boolean {
    return !this.isScrolling;
  }

  isScrollingNow(): boolean {
    return this.isScrolling;
  }

  open(listingId: string, source: PreviewOpenSource): void {
    if (
      this.state.activeListingId &&
      this.state.activeListingId !== listingId
    ) {
      this.close(this.state.activeListingId, 'replaced');
    }
    this.state = {
      activeListingId: listingId,
      openSource: source,
      openedAt: Date.now(),
      lastCloseReason: null,
    };
    this.notify();
  }

  close(listingId: string, reason: PreviewCloseReason): number | null {
    if (this.state.activeListingId !== listingId) return null;
    const duration =
      this.state.openedAt != null ? Date.now() - this.state.openedAt : 0;
    const source = this.state.openSource;
    this.state = {
      activeListingId: null,
      openSource: null,
      openedAt: null,
      lastCloseReason: reason,
    };
    this.emitClose({ listingId, reason, duration, source });
    this.notify();
    return source ? duration : null;
  }

  getOpenDuration(listingId: string): number {
    if (this.state.activeListingId !== listingId || !this.state.openedAt) {
      return 0;
    }
    return Date.now() - this.state.openedAt;
  }

  getOpenSource(listingId: string): PreviewOpenSource | null {
    return this.state.activeListingId === listingId
      ? this.state.openSource
      : null;
  }

  /** Test helper */
  resetForTests(): void {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.isScrolling = false;
    this.state = {
      activeListingId: null,
      openSource: null,
      openedAt: null,
      lastCloseReason: null,
    };
    this.notify();
  }
}

export const previewStateManager = new PreviewStateManager();
