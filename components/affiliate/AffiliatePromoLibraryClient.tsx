'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomecheffVisibleShareSheet from '@/components/share/HomecheffVisibleShareSheet';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { useTranslation } from '@/hooks/useTranslation';
import { toAbsolutePublicUrl } from '@/lib/share/listing-share';
import { canonicalPromoPath } from '@/lib/affiliate-media/share-url';
import { promoShareAbsolute, parsePromoPlatform, type PromoPlatform } from '@/lib/affiliate-media/platform';
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
  platform?: PromoPlatform;
  shareCount: number;
  isOwner: boolean;
  creatorCredit: string;
  builtin?: boolean;
};

type Source = 'all' | 'official' | 'community' | 'mine' | 'review';

const PLATFORMS: { id: PromoPlatform | 'ALL'; nl: string; en: string }[] = [
  { id: 'ALL', nl: 'Alles', en: 'All' },
  { id: 'MARKETPLACE', nl: 'Marketplace', en: 'Marketplace' },
  { id: 'GROWTH', nl: 'Growth', en: 'Growth' },
  { id: 'STUDIO', nl: 'Studio', en: 'Studio' },
  { id: 'DELIVERY', nl: 'Bezorging', en: 'Delivery' },
];

const SOURCES: { id: Source; nl: string; en: string }[] = [
  { id: 'all', nl: 'Alles', en: 'All' },
  { id: 'official', nl: 'Officieel', en: 'Official' },
  { id: 'community', nl: 'Community', en: 'Community' },
  { id: 'mine', nl: 'Mijn materiaal', en: 'My material' },
];

const PLATFORM_LABEL: Record<PromoPlatform, string> = {
  ECOSYSTEM: 'HomeCheff',
  MARKETPLACE: 'Marketplace',
  GROWTH: 'Growth',
  STUDIO: 'Studio',
  DELIVERY: 'Bezorging',
};

function sourceFromQuery(raw: string | null): Source {
  if (raw === 'official' || raw === 'community' || raw === 'mine' || raw === 'review') return raw;
  return 'all';
}

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
  const { tOr } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolveShareUrl } = useMarketplaceShareContext();
  const source = sourceFromQuery(searchParams.get('source'));
  const platform = parsePromoPlatform(searchParams.get('platform'));
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState('HomeCheff');
  const [sheetText, setSheetText] = useState('');
  const [sheetImage, setSheetImage] = useState<string | null>(null);
  const inFlight = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadPlatform, setUploadPlatform] = useState<PromoPlatform>(platform || 'ECOSYSTEM');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'AFFILIATE_COMMUNITY' | 'OFFICIAL'>('PRIVATE');
  const [consent, setConsent] = useState(false);
  const [official, setOfficial] = useState(false);

  const go = (nextPlatform: PromoPlatform | null, nextSource: Source) => {
    const params = new URLSearchParams();
    if (nextPlatform) params.set('platform', nextPlatform.toLowerCase());
    if (nextSource !== 'all') params.set('source', nextSource);
    const query = params.toString();
    router.push(query ? `/affiliate/promotiemateriaal?${query}` : '/affiliate/promotiemateriaal');
  };

  const load = useCallback(async (nextSource: Source, nextPlatform: PromoPlatform | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('tab', nextSource);
      if (nextPlatform) params.set('platform', nextPlatform);
      const res = await fetch(`/api/affiliate/media?${params.toString()}`, { credentials: 'include' });
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
    void load(source, platform);
  }, [load, source, platform]);

  const shareTarget = (asset: Asset) => {
    if (asset.builtin) return toAbsolutePublicUrl(asset.destinationPath);
    if (asset.platform === 'GROWTH' || asset.platform === 'STUDIO') {
      return promoShareAbsolute({ platform: asset.platform, shareSlug: asset.shareSlug });
    }
    return toAbsolutePublicUrl(canonicalPromoPath(asset.shareSlug));
  };

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
      const path = shareTarget(asset);
      const resolved = await resolveShareUrl({
        listingAbsoluteUrl: path,
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
    const path = shareTarget(asset);
    const resolved = await resolveShareUrl({
      listingAbsoluteUrl: path,
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
      form.set('visibility', vis);
      form.set('platform', uploadPlatform);
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
      setConsent(false);
      setComposerOpen(false);
      if (fileRef.current) fileRef.current.value = '';
      await load(source, platform);
    } catch (err) {
      setError(err instanceof Error && err.message === 'video_too_long' ? 'Video mag maximaal 60 seconden duren.' : 'Upload mislukt.');
    } finally {
      setBusy(false);
    }
  };

  const emptyCopy = (() => {
    const place =
      platform === 'MARKETPLACE'
        ? 'Marketplace'
        : platform === 'GROWTH'
          ? 'Growth'
          : platform === 'STUDIO'
            ? 'Studio'
            : platform === 'DELIVERY'
              ? 'Bezorging'
              : 'dit overzicht';
    if (source === 'community') {
      return tOr(
        'affiliate.promoLibrary.emptyCommunity',
        `No community material for ${place === 'Bezorging' ? 'Delivery' : place === 'dit overzicht' ? 'this view' : place} yet.`,
        `Nog geen communitymateriaal voor ${place}.`,
      );
    }
    if (source === 'official') {
      return tOr(
        'affiliate.promoLibrary.emptyOfficial',
        `No official material for ${place === 'Bezorging' ? 'Delivery' : place === 'dit overzicht' ? 'this view' : place} yet.`,
        `Nog geen officieel materiaal voor ${place}.`,
      );
    }
    if (source === 'mine') {
      return tOr('affiliate.promoLibrary.emptyMine', 'You have no material of your own yet.', 'Je hebt nog geen eigen materiaal.');
    }
    return tOr(
      'affiliate.promoLibrary.emptyAll',
      `No material for ${place === 'Bezorging' ? 'Delivery' : place === 'dit overzicht' ? 'this view' : place} yet.`,
      `Nog geen materiaal voor ${place}.`,
    );
  })();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tOr('affiliate.nav.promotiemateriaal', 'Promotional material', 'Promotiemateriaal')}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {tOr(
            'affiliate.promoLibrary.lead',
            'One library for Marketplace, Growth, Studio and Delivery. Sharing uses your own link.',
            'Eén bibliotheek voor Marketplace, Growth, Studio en Bezorging. Delen gebruikt jouw eigen link.',
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((item) => {
          const active = item.id === 'ALL' ? !platform : platform === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id === 'ALL' ? null : item.id, source === 'review' ? 'review' : source)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                active ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-900'
              }`}
            >
              {tOr(`affiliate.promoLibrary.platform.${item.id}`, item.en, item.nl)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(platform, item.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              source === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {tOr(`affiliate.promoLibrary.source.${item.id}`, item.en, item.nl)}
          </button>
        ))}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => go(platform, 'review')}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              source === 'review' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {tOr('affiliate.promoLibrary.review', 'Review', 'Beoordelen')}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setComposerOpen((open) => !open)}
        className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
      >
        {tOr('affiliate.promoLibrary.add', 'Add material', '+ Materiaal toevoegen')}
      </button>
      <p className="text-xs text-slate-500">
        {tOr(
          'affiliate.promoLibrary.downloadNote',
          'Using the image does not track sign-ups. Share with my link does.',
          'Een afbeelding gebruiken volgt geen aanmeldingen. Deel met mijn link wel.',
        )}
      </p>

      {composerOpen ? (
      <form onSubmit={(e) => void onUpload(e)} className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          {tOr('affiliate.promoLibrary.add', 'Add material', 'Materiaal toevoegen')}
        </h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          required
          className="block w-full text-sm"
        />
        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium text-slate-800">
            {tOr('affiliate.promoLibrary.forWhat', 'What is this material for?', 'Waarvoor is dit materiaal?')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['MARKETPLACE', 'Marketplace'],
                ['GROWTH', 'Growth'],
                ['STUDIO', 'Studio'],
                ['DELIVERY', 'Bezorging'],
                ['ECOSYSTEM', 'Algemeen / HomeCheff'],
              ] as const
            ).map(([id, label]) => (
              <label key={id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1">
                <input
                  type="radio"
                  name="upload-platform"
                  checked={uploadPlatform === id}
                  onChange={() => setUploadPlatform(id)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel (optioneel)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Korte tekst (optioneel)"
          rows={2}
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
            <legend className="font-medium text-slate-800">
              {tOr('affiliate.promoLibrary.who', 'Who may use this?', 'Wie mag dit gebruiken?')}
            </legend>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="vis"
                checked={visibility === 'PRIVATE'}
                onChange={() => setVisibility('PRIVATE')}
              />
              <span>{tOr('affiliate.promoLibrary.onlyMe', 'Only me', 'Alleen ik')}</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="vis"
                checked={visibility === 'AFFILIATE_COMMUNITY'}
                onChange={() => setVisibility('AFFILIATE_COMMUNITY')}
              />
              <span>{tOr('affiliate.promoLibrary.shareCommunity', 'Share with the community', 'Delen met de community')}</span>
            </label>
            {visibility === 'AFFILIATE_COMMUNITY' ? (
              <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-amber-950">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  Andere affiliates mogen dit beeld gebruiken. Zij delen het met hun eigen link.
                </span>
              </label>
            ) : null}
          </fieldset>
        ) : null}
        <p className="text-xs text-slate-500">
          Foto: JPG, PNG of WebP. Video: MP4, maximaal 60 seconden.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Uploaden…' : 'Opslaan'}
        </button>
      </form>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Laden…</p> : null}
      {!loading && assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-700">{emptyCopy}</p>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800"
          >
            {tOr('affiliate.promoLibrary.addShort', 'Add material', 'Voeg materiaal toe')}
          </button>
        </div>
      ) : null}

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
            <p className="text-xs font-semibold text-emerald-800">
              {PLATFORM_LABEL[asset.platform || 'ECOSYSTEM']}
            </p>
            <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{asset.title || 'Zonder titel'}</p>
            <span className="text-[11px] font-semibold uppercase text-slate-500">
              {asset.visibility === 'OFFICIAL'
                ? tOr('affiliate.promoLibrary.source.official', 'Official', 'Officieel')
                : asset.isOwner
                  ? tOr('affiliate.promoLibrary.mineBadge', 'Mine', 'Van mij')
                  : tOr('affiliate.promoLibrary.source.community', 'Community', 'Community')}
            </span>
            </div>
            <p className="text-xs text-slate-600">Gemaakt door {asset.creatorCredit}</p>
            {asset.moderationStatus === 'UNDER_REVIEW' ? (
              <p className="text-xs text-amber-800">Wacht op controle voordat andere affiliates het zien.</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onShare(asset)}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              >
                {tOr('affiliate.promoLibrary.share', 'Share', 'Delen')}
              </button>
              <a
                href={asset.builtin ? asset.destinationPath : `/p/${asset.shareSlug}`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                {tOr('affiliate.promoLibrary.view', 'View', 'Bekijken')}
              </a>
              <button
                type="button"
                onClick={() => void onCopy(asset)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                {tOr('affiliate.promoLibrary.shareMine', 'Share with my link', 'Deel met mijn link')}
              </button>
              <a
                href={asset.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                {asset.kind === 'VIDEO'
                  ? tOr('affiliate.promoLibrary.useVideo', 'Use video', 'Video gebruiken')
                  : tOr('affiliate.promoLibrary.useImage', 'Use image', 'Afbeelding gebruiken')}
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
                    }).then(() => load(source, platform));
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
                    }).then(() => load(source, platform));
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
                      () => load(source, platform),
                    );
                  }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  Verwijderen
                </button>
              ) : null}
              {source === 'review' && isAdmin ? (
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
                      }).then(() => load(source, platform))
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
                      }).then(() => load(source, platform))
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
