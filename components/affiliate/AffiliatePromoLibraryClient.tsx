'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import HomecheffVisibleShareSheet from '@/components/share/HomecheffVisibleShareSheet';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { toAbsolutePublicUrl } from '@/lib/share/listing-share';
import { canonicalPromoPath } from '@/lib/affiliate-media/share-url';
import { AFFILIATE_MEDIA_VIDEO_MAX_DURATION_MS } from '@/lib/affiliate-media/constants';

type Asset = {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  posterUrl: string | null;
  title: string | null;
  caption: string | null;
  ctaText: string | null;
  visibility: 'PRIVATE' | 'AFFILIATE_COMMUNITY' | 'OFFICIAL';
  moderationStatus: string;
  shareSlug: string;
  destinationPath: string;
  shareCount: number;
  isOwner: boolean;
  creatorCredit: string;
  builtin?: boolean;
};

type Tab = 'official' | 'community' | 'mine' | 'review';

async function uploadPromoBlob(file: File, kind: 'image' | 'video' | 'poster'): Promise<string> {
  const { upload } = await import('@vercel/blob/client');
  const id = crypto.randomUUID();
  const lower = file.name.toLowerCase();
  const ext =
    kind === 'video'
      ? 'mp4'
      : kind === 'poster'
        ? 'jpg'
        : lower.endsWith('.png')
          ? 'png'
          : lower.endsWith('.webp')
            ? 'webp'
            : 'jpg';
  const blob = await upload(`affiliate-media/${id}/${kind}.${ext}`, file, {
    access: 'public',
    handleUploadUrl: '/api/affiliate/media/blob',
    multipart: file.size > 3 * 1024 * 1024,
    contentType: file.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
  });
  return blob.url;
}

async function posterFromVideo(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('video_load_failed'));
    });
    const durationMs = (video.duration || 0) * 1000;
    if (durationMs > AFFILIATE_MEDIA_VIDEO_MAX_DURATION_MS + 1500) {
      throw new Error('video_too_long');
    }
    video.currentTime = Math.min(0.25, Math.max(0, (video.duration || 1) * 0.1));
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth || 1280, 1280);
    canvas.height = Math.min(video.videoHeight || 720, 720);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('poster_failed');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('poster_failed'))), 'image/jpeg', 0.82);
    });
    return new File([blob], 'poster.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AffiliatePromoLibraryClient() {
  const { resolveShareUrl } = useMarketplaceShareContext();
  const [tab, setTab] = useState<Tab>('official');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState('HomeCheff');
  const [sheetText, setSheetText] = useState('');
  const [sheetImage, setSheetImage] = useState<string | null>(null);
  const inFlight = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'AFFILIATE_COMMUNITY' | 'OFFICIAL'>('PRIVATE');
  const [consent, setConsent] = useState(false);
  const [official, setOfficial] = useState(false);

  const load = useCallback(async (next: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/affiliate/media?tab=${next}`, { credentials: 'include' });
      const json = (await res.json()) as { assets?: Asset[]; actor?: { isAdmin?: boolean }; error?: string };
      if (!res.ok) throw new Error(json.error || 'load_failed');
      setAssets(json.assets || []);
      setIsAdmin(Boolean(json.actor?.isAdmin));
    } catch {
      setError('Materiaal laden lukt nu niet.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [load, tab]);

  const recordShare = (assetId: string, channel: string) => {
    void fetch(`/api/affiliate/media/${assetId}/share-event`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channel }),
    });
  };

  const onShare = async (asset: Asset) => {
    if (inFlight.current || sheetOpen) return;
    inFlight.current = true;
    try {
      const path = asset.builtin ? asset.destinationPath : canonicalPromoPath(asset.shareSlug);
      const absolute = toAbsolutePublicUrl(path);
      const resolved = await resolveShareUrl({
        listingAbsoluteUrl: absolute,
        surface: 'affiliate_promo',
      });
      setSheetUrl(resolved.url);
      setSheetTitle(asset.title || 'HomeCheff');
      setSheetText(asset.caption || asset.title || 'HomeCheff');
      setSheetImage(asset.posterUrl || (asset.kind === 'IMAGE' ? asset.mediaUrl : null));
      setSheetOpen(true);
      if (!asset.builtin) recordShare(asset.id, 'panel');
    } catch {
      inFlight.current = false;
    }
  };

  const onCopy = async (asset: Asset) => {
    const path = asset.builtin ? asset.destinationPath : canonicalPromoPath(asset.shareSlug);
    const absolute = toAbsolutePublicUrl(path);
    const resolved = await resolveShareUrl({
      listingAbsoluteUrl: absolute,
      surface: 'affiliate_promo_copy',
    });
    await navigator.clipboard.writeText(resolved.url);
    if (!asset.builtin) {
      void fetch(`/api/affiliate/media/${asset.id}/share-event`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: 'copy' }),
      });
    }
  };

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const vis = official && isAdmin ? 'OFFICIAL' : visibility;
      if (vis === 'AFFILIATE_COMMUNITY' && !consent) {
        setError('Geef toestemming voor hergebruik door andere affiliates.');
        return;
      }
      const form = new FormData();
      form.set('title', title);
      form.set('caption', caption);
      form.set('ctaText', ctaText);
      form.set('visibility', vis);
      form.set('destinationPath', '/');
      form.set('fileName', file.name);
      form.set('mimeType', file.type || '');
      if (vis === 'AFFILIATE_COMMUNITY') form.set('reuseConsent', '1');
      const lower = file.name.toLowerCase();
      const videoLike = file.type.startsWith('video/') || lower.endsWith('.mp4');
      if (videoLike) {
        if (lower.endsWith('.mov') || lower.endsWith('.webm') || file.type.includes('quicktime') || file.type.includes('webm')) {
          setError('Alleen MP4 (H.264) video is toegestaan.');
          return;
        }
        const poster = await posterFromVideo(file);
        try {
          const mediaUrl = await uploadPromoBlob(file, 'video');
          const posterUrl = await uploadPromoBlob(poster, 'poster');
          form.set('mediaUrl', mediaUrl);
          form.set('posterUrl', posterUrl);
          form.set('mimeType', 'video/mp4');
        } catch {
          if (file.size > 4 * 1024 * 1024) throw new Error('upload_failed');
          form.set('file', file);
          form.set('poster', poster);
        }
      } else {
        try {
          const mediaUrl = await uploadPromoBlob(file, 'image');
          form.set('mediaUrl', mediaUrl);
        } catch {
          if (file.size > 4 * 1024 * 1024) throw new Error('upload_failed');
          form.set('file', file);
        }
      }
      const res = await fetch('/api/affiliate/media', { method: 'POST', credentials: 'include', body: form });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error === 'video_too_long' ? 'Video mag maximaal 60 seconden duren.' : json.error || 'Upload mislukt.');
        return;
      }
      setTitle('');
      setCaption('');
      setCtaText('');
      setConsent(false);
      if (fileRef.current) fileRef.current.value = '';
      await load(official && isAdmin ? 'official' : vis === 'AFFILIATE_COMMUNITY' ? 'mine' : 'mine');
    } catch (err) {
      setError(err instanceof Error && err.message === 'video_too_long' ? 'Video mag maximaal 60 seconden duren.' : 'Upload mislukt.');
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; hidden?: boolean }[] = [
    { id: 'official', label: 'Voor iedereen' },
    { id: 'community', label: 'Community' },
    { id: 'mine', label: 'Mijn materiaal' },
    { id: 'review', label: 'Beoordelen', hidden: !isAdmin },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void onUpload(e)} className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Materiaal uploaden</h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          required
          className="block w-full text-sm"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel (optioneel)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Beschrijving / caption (optioneel)"
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
          placeholder="CTA-tekst (optioneel)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        {isAdmin ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={official} onChange={(e) => setOfficial(e.target.checked)} />
            Publiceer als officieel HomeCheff-materiaal
          </label>
        ) : null}
        {!official ? (
          <fieldset className="space-y-2 text-sm">
            <legend className="font-medium text-slate-800">Zichtbaarheid</legend>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="vis"
                checked={visibility === 'PRIVATE'}
                onChange={() => setVisibility('PRIVATE')}
              />
              <span>Alleen voor mij — anderen zien dit niet in de communitybibliotheek.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="vis"
                checked={visibility === 'AFFILIATE_COMMUNITY'}
                onChange={() => setVisibility('AFFILIATE_COMMUNITY')}
              />
              <span>Beschikbaar voor andere HomeCheff-affiliates</span>
            </label>
            {visibility === 'AFFILIATE_COMMUNITY' ? (
              <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-amber-950">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  Ik geef andere HomeCheff-affiliates toestemming om dit materiaal te gebruiken en te delen
                  voor promotie van HomeCheff. Al verstuurde berichten kan ik later niet intrekken.
                </span>
              </label>
            ) : null}
          </fieldset>
        ) : null}
        <p className="text-xs text-slate-500">
          Foto: JPG/PNG/WebP tot 8 MB. Video: alleen MP4 (H.264), max 60 seconden en 20 MB.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Uploaden…' : 'Opslaan'}
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
                tab === t.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-900'
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Laden…</p> : null}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {assets.map((asset) => (
            <li key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2" data-official-verdiencheck={asset.builtin ? 'true' : undefined}>
            <div className="overflow-hidden rounded-xl bg-slate-100">
              {asset.kind === 'VIDEO' ? (
                <video
                  className="aspect-video w-full object-cover"
                  src={asset.mediaUrl}
                  poster={asset.posterUrl || undefined}
                  controls
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.mediaUrl} alt="" className="aspect-video w-full object-cover" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{asset.title || 'Zonder titel'}</p>
            {asset.builtin ? (
              <span className="text-[11px] font-semibold uppercase text-emerald-700">VerdienCheck</span>
            ) : (
              <span className="text-[11px] font-semibold uppercase text-slate-500">{asset.kind === 'VIDEO' ? 'Video' : 'Foto'}</span>
            )}
            </div>
            <p className="text-xs text-slate-600">Gemaakt door {asset.creatorCredit}</p>
            {asset.moderationStatus !== 'ACTIVE' ? (
              <p className="text-xs text-amber-800">Status: {asset.moderationStatus}</p>
            ) : null}
            <p className="text-xs text-slate-500">{asset.shareCount} keer gedeeld</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onShare(asset)}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              >
                {asset.ctaText || 'Delen'}
              </button>
              <button
                type="button"
                onClick={() => void onCopy(asset)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                Kopieer link
              </button>
              <a
                href={asset.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                Opslaan
              </a>
              {asset.isOwner ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                  onClick={() => {
                    const next = window.prompt('Titel', asset.title || '');
                    if (next === null) return;
                    void fetch(`/api/affiliate/media/${asset.id}`, {
                      method: 'PATCH',
                      credentials: 'include',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ title: next }),
                    }).then(() => load(tab));
                  }}
                >
                  Bewerken
                </button>
              ) : null}
              {asset.isOwner && asset.visibility === 'AFFILIATE_COMMUNITY' ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                  onClick={() => {
                    if (
                      !confirm(
                        'Dit materiaal verdwijnt uit Community. Bestaande gedeelde berichten blijven bestaan.',
                      )
                    )
                      return;
                    void fetch(`/api/affiliate/media/${asset.id}`, {
                      method: 'PATCH',
                      credentials: 'include',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ visibility: 'PRIVATE' }),
                    }).then(() => load(tab));
                  }}
                >
                  Maak privé
                </button>
              ) : null}
              {asset.isOwner ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('Dit materiaal verwijderen? Al verstuurde berichten blijven bestaan.')) return;
                    void fetch(`/api/affiliate/media/${asset.id}`, { method: 'DELETE', credentials: 'include' }).then(
                      () => load(tab),
                    );
                  }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  Verwijderen
                </button>
              ) : null}
              {tab === 'review' && isAdmin ? (
                <>
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800"
                    onClick={() =>
                      void fetch(`/api/affiliate/media/${asset.id}`, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ action: 'APPROVE' }),
                      }).then(() => load('review'))
                    }
                  >
                    Goedkeuren
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                    onClick={() =>
                      void fetch(`/api/affiliate/media/${asset.id}`, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ action: 'REJECT' }),
                      }).then(() => load('review'))
                    }
                  >
                    Afwijzen
                  </button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <HomecheffVisibleShareSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          inFlight.current = false;
        }}
        url={sheetUrl}
        shareTitle={sheetTitle}
        shareText={sheetText}
        itemImageUrl={sheetImage}
      />
    </div>
  );
}
