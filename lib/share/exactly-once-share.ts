/**
 * Canonical exactly-once share payload helpers.
 *
 * Android Chrome concatenates `text` + `url` into one EXTRA_TEXT, and WhatsApp
 * unfurls every HTTP(S) URL occurrence — including a dedicated `url` field.
 * Putting the same HomeCheff URL in both `text` and `url` therefore produces
 * 2–3 identical link previews from one user action.
 */

const HTTP_URL_RE = /https?:\/\/[^\s<>"'')\]]+/gi;

export function countHttpUrls(text: string): number {
  if (!text) return 0;
  return text.match(HTTP_URL_RE)?.length ?? 0;
}

export function isShareAbortError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'name' in err &&
      String((err as { name: string }).name) === 'AbortError',
  );
}

function urlVariants(url: string): string[] {
  const target = url.trim();
  if (!target) return [];
  const out = new Set<string>([target]);
  try {
    const u = new URL(target);
    out.add(u.href);
    out.add(u.toString());
    out.add(u.href.replace(/\/$/, ''));
    out.add(`${u.origin}${u.pathname}${u.search}`);
    out.add(`${u.origin}${u.pathname}`);
    out.add(`${u.hostname}${u.pathname}`);
    out.add(`${u.host}${u.pathname}`);
  } catch {
    /* keep raw */
  }
  return [...out].filter(Boolean).sort((a, b) => b.length - a.length);
}

/** Remove the destination URL from share copy so it is not sent twice. */
export function stripUrlFromShareText(text: string, url: string): string {
  let out = (text || '').trim();
  if (!out) return '';
  for (const variant of urlVariants(url)) {
    out = out.split(variant).join('');
  }
  return out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

export type ExactlyOnceShareInput = {
  title: string;
  text?: string;
  url: string;
  files?: File[];
};

/**
 * Web Share data with the destination URL in `url` only — never also in `text`.
 * Title is never set to the URL.
 */
export function buildExactlyOnceWebShareData(input: ExactlyOnceShareInput): ShareData {
  const url = input.url.trim();
  const cleanedTitle = stripUrlFromShareText(input.title.trim() || 'HomeCheff', url);
  const title = cleanedTitle || 'HomeCheff';
  const text = stripUrlFromShareText((input.text || '').trim(), url);
  const data: ShareData = { title };
  if (text && text !== title) data.text = text;
  if (url) data.url = url;
  if (input.files?.length) data.files = input.files;
  return data;
}

/**
 * Chromium Android Web Share packs EXTRA_TEXT as `text + " " + url` when both exist.
 * WhatsApp then unfurls each URL in that string (and may also unfurl `url` again
 * if it was already inside `text`).
 */
export function simulateAndroidChromeShareText(data: ShareData): string {
  const text = String(data.text || '').trim();
  const url = String(data.url || '').trim();
  if (text && url) return `${text} ${url}`;
  return text || url;
}

export function countDestinationUrlsInNativePayload(data: ShareData): number {
  return countHttpUrls(simulateAndroidChromeShareText(data));
}

/** wa.me / mailto / tweet: URL belongs in the body exactly once (no separate url field). */
export function composeSingleUrlShareBody(
  text: string | undefined,
  url: string,
  title?: string,
): string {
  const dest = url.trim();
  const cleaned = stripUrlFromShareText((text || title || '').trim(), dest);
  return [cleaned, dest].filter(Boolean).join('\n\n').trim();
}

export function buildSingleUrlWhatsAppHref(
  url: string,
  title: string,
  text?: string,
): string {
  const body = composeSingleUrlShareBody(text, url, title);
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}

type ShareGate = {
  tryEnter: () => boolean;
  exit: () => void;
  isPending: () => boolean;
};

/** In-flight lock so one user action cannot invoke navigator.share twice. */
export function createShareGate(): ShareGate {
  let pending = false;
  return {
    tryEnter() {
      if (pending) return false;
      pending = true;
      return true;
    },
    exit() {
      pending = false;
    },
    isPending() {
      return pending;
    },
  };
}

const nativeShareGate = createShareGate();

export type NativeShareOnceResult =
  | { ok: true; method: 'native' }
  | { ok: false; method: 'cancelled' | 'busy' | 'failed' | 'unsupported'; error?: string };

/**
 * One navigator.share() invocation. AbortError / cancel must not run a fallback.
 * Re-entry while a share sheet is open is ignored.
 */
export async function invokeNativeShareOnce(
  input: ExactlyOnceShareInput,
): Promise<NativeShareOnceResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return { ok: false, method: 'unsupported' };
  }
  if (!nativeShareGate.tryEnter()) {
    return { ok: false, method: 'busy' };
  }
  try {
    const data = buildExactlyOnceWebShareData(input);
    if (!data.url && !data.text) {
      return { ok: false, method: 'failed', error: 'missing_url' };
    }
    if (typeof navigator.canShare === 'function') {
      try {
        if (!navigator.canShare(data)) {
          if (input.files?.length) {
            return { ok: false, method: 'failed', error: 'files_unsupported' };
          }
        } else {
          await navigator.share(data);
          return { ok: true, method: 'native' };
        }
      } catch (err) {
        if (isShareAbortError(err)) return { ok: false, method: 'cancelled' };
        if (input.files?.length) {
          return { ok: false, method: 'failed', error: 'files_unsupported' };
        }
        throw err;
      }
    }
    await navigator.share(data);
    return { ok: true, method: 'native' };
  } catch (err) {
    if (isShareAbortError(err)) return { ok: false, method: 'cancelled' };
    return { ok: false, method: 'failed', error: 'share_failed' };
  } finally {
    nativeShareGate.exit();
  }
}
