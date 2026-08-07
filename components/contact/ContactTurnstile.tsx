'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: Record<string, unknown>,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      execute: (widgetId?: string, opts?: Record<string, unknown>) => void;
      getResponse: (widgetId?: string) => string;
    };
    onTurnstileLoad?: () => void;
  }
}

export type ContactTurnstileHandle = {
  /** Resolve with token, or null if Turnstile disabled / failed. */
  getToken: () => Promise<string | null>;
  reset: () => void;
};

type Props = {
  siteKey: string | null;
};

/**
 * Invisible Cloudflare Turnstile.
 * Call getToken() on submit — executes challenge only if needed.
 */
const ContactTurnstile = forwardRef<ContactTurnstileHandle, Props>(
  function ContactTurnstile({ siteKey }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const ready = useRef(false);

    useEffect(() => {
      if (!siteKey || !containerRef.current) return;

      let cancelled = false;

      const render = () => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetId.current) {
          try {
            window.turnstile.remove(widgetId.current);
          } catch {
            /* ignore */
          }
          widgetId.current = null;
        }
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: 'invisible',
          appearance: 'interaction-only',
          callback: () => {
            /* token stored in widget; read via getResponse */
          },
        });
        ready.current = true;
      };

      const existing = document.querySelector(
        'script[data-homecheff-turnstile="1"]',
      );

      if (window.turnstile) {
        render();
      } else {
        window.onTurnstileLoad = () => {
          if (!cancelled) render();
        };
        if (!existing) {
          const script = document.createElement('script');
          script.src =
            'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
          script.async = true;
          script.defer = true;
          script.dataset.homecheffTurnstile = '1';
          document.head.appendChild(script);
        }
      }

      return () => {
        cancelled = true;
        ready.current = false;
        if (widgetId.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetId.current);
          } catch {
            /* ignore */
          }
        }
      };
    }, [siteKey]);

    useImperativeHandle(ref, () => ({
      getToken: () =>
        new Promise((resolve) => {
          if (!siteKey) {
            resolve(null);
            return;
          }
          if (!window.turnstile || !widgetId.current) {
            resolve(null);
            return;
          }
          const existing = window.turnstile.getResponse(widgetId.current);
          if (existing) {
            resolve(existing);
            return;
          }
          const timeout = setTimeout(() => resolve(null), 12_000);
          try {
            window.turnstile.execute(widgetId.current, {
              callback: (token: string) => {
                clearTimeout(timeout);
                resolve(token || null);
              },
              'error-callback': () => {
                clearTimeout(timeout);
                resolve(null);
              },
            });
          } catch {
            clearTimeout(timeout);
            resolve(null);
          }
        }),
      reset: () => {
        if (widgetId.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetId.current);
          } catch {
            /* ignore */
          }
        }
      },
    }));

    if (!siteKey) return null;

    return (
      <div
        ref={containerRef}
        className="cf-turnstile"
        data-testid="contact-turnstile"
      />
    );
  },
);

export default ContactTurnstile;
