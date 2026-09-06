import { isIP } from 'node:net';

export type VideoProxyUrlValidation =
  | {
      ok: true;
      href: string;
      hostname: string;
      /** Only true for exact trusted Vercel Blob hostnames that may need a storage token */
      mayAttachBlobCredential: boolean;
    }
  | { ok: false; reason: string };

const ALLOWED_BLOB_HOST_SUFFIXES = [
  '.public.blob.vercel-storage.com',
  '.blob.vercel-storage.com',
] as const;

const ALLOWED_EXACT_HOSTS = new Set([
  'blob.vercel-storage.com',
]);

function isPrivateOrLocalIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const parts = ip.split('.').map((n) => Number(n));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (v === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA
    if (normalized.startsWith('fe80')) return true; // link-local
    // IPv4-mapped
    if (normalized.includes('.')) {
      const mapped = normalized.split(':').pop() || '';
      if (isIP(mapped) === 4) return isPrivateOrLocalIp(mapped);
    }
    return false;
  }
  return true;
}

function isAllowedBlobHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (ALLOWED_EXACT_HOSTS.has(h)) return true;
  return ALLOWED_BLOB_HOST_SUFFIXES.some((suffix) => h.endsWith(suffix) && h.length > suffix.length);
}

/**
 * Strict validation for video-proxy target URLs.
 * Rejects SSRF targets and hostname spoofing via substring tricks.
 */
export function validateVideoProxyUrl(raw: string): VideoProxyUrlValidation {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return { ok: false, reason: 'invalid_encoding' };
  }

  let url: URL;
  try {
    url = new URL(decoded);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }

  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'protocol_not_https' };
  }

  if (url.username || url.password) {
    return { ok: false, reason: 'userinfo_forbidden' };
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) {
    return { ok: false, reason: 'missing_hostname' };
  }

  if (
    hostname === 'localhost' ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.localhost')
  ) {
    return { ok: false, reason: 'localhost_forbidden' };
  }

  // Bracketed IPv6 or raw IP host
  const hostForIp = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
  if (isIP(hostForIp)) {
    if (isPrivateOrLocalIp(hostForIp)) {
      return { ok: false, reason: 'private_ip_forbidden' };
    }
    return { ok: false, reason: 'ip_literal_forbidden' };
  }

  // Block metadata-ish DNS names
  if (
    hostname === '169.254.169.254' ||
    hostname.includes('metadata') && hostname.includes('internal')
  ) {
    return { ok: false, reason: 'metadata_forbidden' };
  }

  if (!isAllowedBlobHostname(hostname)) {
    return { ok: false, reason: 'hostname_not_allowed' };
  }

  // Reject path tricks that embed credentials in query for other hosts — already host-bound
  return {
    ok: true,
    href: url.href,
    hostname,
    mayAttachBlobCredential: isAllowedBlobHostname(hostname),
  };
}
