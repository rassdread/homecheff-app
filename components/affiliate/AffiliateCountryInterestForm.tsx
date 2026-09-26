'use client';

import { useState } from 'react';
import { AFFILIATE_FULLY_ACTIVE_COUNTRY_CODES } from '@/lib/affiliate/affiliate-markets';

const CHOICES = ['NL', 'BE', 'DE', 'FR', 'LU', 'GB', 'IE', 'ES', 'IT', 'PT', 'PL', 'AT', 'CH', 'US', 'SR'] as const;

const COUNTRY_NAMES: Record<string, { nl: string; en: string }> = {
  NL: { nl: 'Nederland', en: 'the Netherlands' },
  BE: { nl: 'België', en: 'Belgium' },
  DE: { nl: 'Duitsland', en: 'Germany' },
  FR: { nl: 'Frankrijk', en: 'France' },
  LU: { nl: 'Luxemburg', en: 'Luxembourg' },
  GB: { nl: 'het Verenigd Koninkrijk', en: 'the United Kingdom' },
  IE: { nl: 'Ierland', en: 'Ireland' },
  ES: { nl: 'Spanje', en: 'Spain' },
  IT: { nl: 'Italië', en: 'Italy' },
  PT: { nl: 'Portugal', en: 'Portugal' },
  PL: { nl: 'Polen', en: 'Poland' },
  AT: { nl: 'Oostenrijk', en: 'Austria' },
  CH: { nl: 'Zwitserland', en: 'Switzerland' },
  US: { nl: 'de Verenigde Staten', en: 'the United States' },
  SR: { nl: 'Suriname', en: 'Suriname' },
};

function countryName(code: string, en: boolean): string {
  const known = COUNTRY_NAMES[code];
  if (known) return en ? known.en : known.nl;
  return code || (en ? 'that country' : 'dat land');
}

export default function AffiliateCountryInterestForm({ lang }: { lang: 'nl' | 'en' }) {
  const en = lang === 'en';
  const [countryCode, setCountryCode] = useState('NL');
  const [otherCode, setOtherCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'duplicate' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const selected = countryCode === 'OTHER' ? otherCode.trim().toUpperCase() : countryCode;
  const supported = (AFFILIATE_FULLY_ACTIVE_COUNTRY_CODES as readonly string[]).includes(selected);
  const place = countryName(selected, en);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (supported) return;
    setStatus('sending');
    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      countryCode: selected,
      region: String(form.get('region') || ''),
      phone: String(form.get('phone') || ''),
      languages: String(form.get('languages') || ''),
      profileUrl: String(form.get('profileUrl') || ''),
      salesExperience: String(form.get('salesExperience') || ''),
      networkReach: String(form.get('networkReach') || ''),
      wantsOwnCustomers: form.get('wantsOwnCustomers') === 'on',
      wantsNetwork: form.get('wantsNetwork') === 'on',
      motivation: String(form.get('motivation') || ''),
      locale: lang,
    };
    try {
      const response = await fetch('/api/affiliate/market-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { ok?: boolean; duplicate?: boolean; error?: string };
      if (data.ok && data.duplicate) {
        setStatus('duplicate');
        setMessage(
          en
            ? 'We already have an open request for this email and country.'
            : 'We hebben al een open aanvraag voor dit e-mailadres en land.',
        );
        return;
      }
      if (!response.ok || !data.ok) {
        setStatus('error');
        setMessage(
          en ? 'The request could not be saved. Try again.' : 'De aanvraag kon niet worden opgeslagen. Probeer het opnieuw.',
        );
        return;
      }
      setStatus('done');
      setMessage(
        en
          ? `Thank you, we have received your interest in ${place}. We will look at what it would take to make HomeCheff possible there. If we see concrete opportunities, we can get in touch about the next steps.`
          : `Bedankt, we hebben je interesse in ${place} ontvangen. We gaan bekijken wat er nodig is om HomeCheff daar mogelijk te maken. Als we daar concrete mogelijkheden zien, kunnen we contact met je opnemen over de volgende stappen.`,
      );
    } catch {
      setStatus('error');
      setMessage(en ? 'The request could not be saved.' : 'De aanvraag kon niet worden opgeslagen.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3" id="land">
      <label className="block text-sm text-slate-700">
        <span className="mb-1 block font-medium">
          {en ? 'In which country do you see an opportunity for HomeCheff?' : 'In welk land zie jij kansen voor HomeCheff?'}
        </span>
        <select
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {CHOICES.map((code) => (
            <option key={code} value={code}>
              {code}
              {(AFFILIATE_FULLY_ACTIVE_COUNTRY_CODES as readonly string[]).includes(code)
                ? en
                  ? ' — active'
                  : ' — actief'
                : ''}
            </option>
          ))}
          <option value="OTHER">{en ? 'Another country code' : 'Andere landcode'}</option>
        </select>
      </label>
      {countryCode === 'OTHER' ? (
        <input
          value={otherCode}
          onChange={(event) => setOtherCode(event.target.value)}
          maxLength={2}
          placeholder="DE"
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 uppercase"
          aria-label={en ? 'Country code' : 'Landcode'}
        />
      ) : null}
      {supported ? (
        <p className="text-sm text-slate-700">
          {en
            ? `HomeCheff is already active in ${place}. You can start as an affiliate right away.`
            : `HomeCheff is al actief in ${place}. Je kunt direct starten als affiliate.`}{' '}
          <a href="#affiliate-signup" className="font-semibold text-emerald-800 underline-offset-2 hover:underline">
            {en ? 'Become an affiliate' : 'Word affiliate'}
          </a>
        </p>
      ) : (
        <>
          <input name="name" required maxLength={120} placeholder={en ? 'Name' : 'Naam'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <input name="email" type="email" required maxLength={180} placeholder={en ? 'Email' : 'E-mail'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <input name="region" maxLength={120} placeholder={en ? 'City or region (optional)' : 'Plaats of regio (optioneel)'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <input name="phone" maxLength={40} placeholder={en ? 'Phone (optional)' : 'Telefoon (optioneel)'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <input name="languages" maxLength={120} placeholder={en ? 'Languages (optional)' : 'Talen (optioneel)'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <input name="profileUrl" maxLength={300} placeholder="LinkedIn (optioneel)" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <textarea name="salesExperience" maxLength={500} placeholder={en ? 'Sales experience (optional)' : 'Saleservaring (optioneel)'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <textarea name="networkReach" maxLength={500} placeholder={en ? 'Network or reach (optional)' : 'Netwerk of bereik (optioneel)'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="wantsOwnCustomers" />
            {en ? 'I want to acquire customers myself' : 'Ik wil zelf klanten werven'}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="wantsNetwork" />
            {en ? 'I am interested in building an affiliate network' : 'Ik wil een affiliate-netwerk bouwen'}
          </label>
          <textarea name="motivation" maxLength={2000} placeholder={en ? 'Short motivation (optional)' : 'Korte motivatie (optioneel)'} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {en ? `Share my interest` : 'Geef mijn interesse door'}
          </button>
        </>
      )}
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </form>
  );
}
