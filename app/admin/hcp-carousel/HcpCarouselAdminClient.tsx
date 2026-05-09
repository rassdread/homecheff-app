'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  HcpCarouselPlacement,
  HcpCarouselSlide,
  HcpCarouselSlideType,
  HcpCarouselTargetType,
} from '@prisma/client';

const SLIDE_TYPES: HcpCarouselSlideType[] = ['RANKING', 'PROMO', 'SPOTLIGHT', 'SPONSORED', 'INFO'];
const PLACEMENTS: HcpCarouselPlacement[] = ['HOME', 'RANKINGS', 'BOTH'];
const TARGET_TYPES: HcpCarouselTargetType[] = ['GLOBAL', 'COUNTRY', 'RADIUS'];

export default function HcpCarouselAdminClient() {
  const [slides, setSlides] = useState<HcpCarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaLabel: '',
    ctaUrl: '',
    backgroundStyle: 'amber',
    slideType: 'PROMO' as HcpCarouselSlideType,
    sortOrder: 100,
    isActive: true,
    localeFilter: '' as '' | 'nl' | 'en',
    countryFilter: '',
    placement: 'BOTH' as HcpCarouselPlacement,
    targetType: 'GLOBAL' as HcpCarouselTargetType,
    targetCountry: '',
    targetLat: '',
    targetLng: '',
    targetRadiusKm: '',
    startsAt: '',
    endsAt: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/hcp-carousel', { credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { slides?: HcpCarouselSlide[] };
      setSlides(Array.isArray(json.slides) ? json.slides : []);
    } catch {
      setError('Kon slides niet laden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createSlide(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/hcp-carousel', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          ctaLabel: form.ctaLabel.trim() || null,
          ctaUrl: form.ctaUrl.trim() || null,
          backgroundStyle: form.backgroundStyle.trim() || null,
          slideType: form.slideType,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
          localeFilter: form.localeFilter || null,
          countryFilter: form.countryFilter.trim() || null,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          placement: form.placement,
          targetType: form.targetType,
          targetCountry: form.targetCountry.trim() || null,
          targetLat: form.targetLat.trim() !== '' ? Number(form.targetLat) : null,
          targetLng: form.targetLng.trim() !== '' ? Number(form.targetLng) : null,
          targetRadiusKm:
            form.targetRadiusKm.trim() !== '' ? Math.floor(Number(form.targetRadiusKm)) : null,
        }),
      });
      if (!res.ok) throw new Error('create failed');
      setForm({
        title: '',
        subtitle: '',
        imageUrl: '',
        ctaLabel: '',
        ctaUrl: '',
        backgroundStyle: 'amber',
        slideType: 'PROMO',
        sortOrder: 100,
        isActive: true,
        localeFilter: '',
        countryFilter: '',
        placement: 'BOTH',
        targetType: 'GLOBAL',
        targetCountry: '',
        targetLat: '',
        targetLng: '',
        targetRadiusKm: '',
        startsAt: '',
        endsAt: '',
      });
      await load();
    } catch {
      setError('Aanmaken mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function patchSlide(id: string, partial: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hcp-carousel/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (!res.ok) throw new Error('patch failed');
      await load();
    } catch {
      setError('Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function removeSlide(id: string) {
    if (!confirm('Slide verwijderen?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hcp-carousel/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('delete failed');
      await load();
    } catch {
      setError('Verwijderen mislukt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HCP-carousel &amp; ranglijsten-promo&apos;s</h1>
          <p className="text-sm text-gray-600 mt-1">
            Beheer slides voor de homepage-carousel én het promo-paneel op /hcp-ranglijsten (plaatsing &amp;
            targeting). Automatische ranglijst-slides blijven door de server toegevoegd.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Admin
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Nieuwe slide</h2>
        <form onSubmit={createSlide} className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm">
            <span className="block font-medium text-gray-700 mb-1">Titel *</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </label>
          <label className="sm:col-span-2 text-sm">
            <span className="block font-medium text-gray-700 mb-1">Subtitel</span>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[72px]"
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Type</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.slideType}
              onChange={(e) => setForm((f) => ({ ...f, slideType: e.target.value as HcpCarouselSlideType }))}
            >
              {SLIDE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Sort order</span>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Plaatsing</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.placement}
              onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value as HcpCarouselPlacement }))}
            >
              {PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Targeting</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.targetType}
              onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value as HcpCarouselTargetType }))}
            >
              {TARGET_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Target land (ISO)</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
              value={form.targetCountry}
              onChange={(e) => setForm((f) => ({ ...f, targetCountry: e.target.value }))}
              placeholder="NL"
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Target lat (radius-modus)</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.targetLat}
              onChange={(e) => setForm((f) => ({ ...f, targetLat: e.target.value }))}
              placeholder="bv. 51.92"
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Target lng</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.targetLng}
              onChange={(e) => setForm((f) => ({ ...f, targetLng: e.target.value }))}
              placeholder="bv. 4.48"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="block font-medium text-gray-700 mb-1">Target straal km (RADIUS)</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.targetRadiusKm}
              onChange={(e) => setForm((f) => ({ ...f, targetRadiusKm: e.target.value }))}
              placeholder="25 / 50 / 100"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="block font-medium text-gray-700 mb-1">Afbeelding-URL</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Achtergrond (preset)</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.backgroundStyle}
              onChange={(e) => setForm((f) => ({ ...f, backgroundStyle: e.target.value }))}
            >
              {['amber', 'emerald', 'violet', 'rose', 'slate'].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Actief
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">CTA-label</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.ctaLabel}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">CTA-URL</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.ctaUrl}
              onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
              placeholder="/mijn-hcp"
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Taal-filter</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.localeFilter}
              onChange={(e) => setForm((f) => ({ ...f, localeFilter: e.target.value as '' | 'nl' | 'en' }))}
            >
              <option value="">Alle</option>
              <option value="nl">nl</option>
              <option value="en">en</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Land-filter</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
              value={form.countryFilter}
              onChange={(e) => setForm((f) => ({ ...f, countryFilter: e.target.value }))}
              placeholder="NL"
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Start</span>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Einde</span>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Slide toevoegen
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Slides ({slides.length})</h2>
          <Link
            href="/admin/hcp"
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            HCP overzicht →
          </Link>
          <button
            type="button"
            onClick={() => load()}
            className="text-sm text-emerald-700 hover:underline"
            disabled={loading}
          >
            Vernieuwen
          </button>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-gray-600">Laden…</p>
        ) : slides.length === 0 ? (
          <p className="p-4 text-sm text-gray-600">Nog geen handmatige slides.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {slides.map((s) => (
              <li
                key={s.id}
                id={`hcp-slide-${s.id}`}
                className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between scroll-mt-24"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                  {s.subtitle ? <p className="text-sm text-gray-600 line-clamp-2">{s.subtitle}</p> : null}
                  <p className="text-xs text-gray-500">
                    {s.slideType} · {s.placement ?? 'BOTH'} · {s.targetType ?? 'GLOBAL'} · order {s.sortOrder}
                    {s.localeFilter ? ` · taal ${s.localeFilter}` : ''}
                    {s.countryFilter ? ` · filter ${s.countryFilter}` : ''}
                    {s.targetCountry ? ` · target ${s.targetCountry}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                    disabled={saving}
                    onClick={() =>
                      alert(`${s.title}\n\n${s.subtitle ?? ''}\n\nCTA: ${s.ctaLabel ?? '—'} → ${s.ctaUrl ?? '—'}`)
                    }
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                    disabled={saving}
                    onClick={() => {
                      const title = prompt('Titel', s.title);
                      if (title === null || !title.trim()) return;
                      const subtitle = prompt('Subtitel (leeg = wissen)', s.subtitle ?? '');
                      if (subtitle === null) return;
                      const ctaLabel = prompt('CTA-label (leeg = wissen)', s.ctaLabel ?? '');
                      if (ctaLabel === null) return;
                      const ctaUrl = prompt('CTA-URL (leeg = wissen)', s.ctaUrl ?? '');
                      if (ctaUrl === null) return;
                      void patchSlide(s.id, {
                        title: title.trim(),
                        subtitle: subtitle.trim() || null,
                        ctaLabel: ctaLabel.trim() || null,
                        ctaUrl: ctaUrl.trim() || null,
                      });
                    }}
                  >
                    Velden
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                    disabled={saving}
                    onClick={() => patchSlide(s.id, { isActive: !s.isActive })}
                  >
                    {s.isActive ? 'Deactiveer' : 'Activeer'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                    disabled={saving}
                    onClick={() => {
                      const delta = prompt('Sort order (integer)', String(s.sortOrder));
                      if (delta == null) return;
                      const n = Number(delta);
                      if (!Number.isFinite(n)) return;
                      patchSlide(s.id, { sortOrder: n });
                    }}
                  >
                    Volgorde
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 text-red-700 px-3 py-1.5 text-xs font-medium hover:bg-red-50"
                    disabled={saving}
                    onClick={() => removeSlide(s.id)}
                  >
                    Verwijder
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
