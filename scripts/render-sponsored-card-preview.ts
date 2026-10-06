/**
 * Local visual harness. Writes HTML under /tmp. Not a production route.
 * Run: npx tsx scripts/render-sponsored-card-preview.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SponsoredRecommendationCard, {
  type SponsoredCardModel,
} from '../components/home/SponsoredRecommendationCard';

const longNl =
  'Handgemaakte verjaardagstaart met verse seizoensvruchten, botercrème en een opschrift voor een grote familiebijeenkomst in de buurt';
const longEn =
  'Handmade birthday cake with seasonal fruit, buttercream and lettering for a large family gathering nearby';
const longBusiness = 'Bakkerij De Lange Straatnaam En Familiebedrijf Uit De Buurt';

function card(partial: Partial<SponsoredCardModel> & Pick<SponsoredCardModel, 'listingId' | 'title'>): string {
  const model: SponsoredCardModel = {
    href: '#listing',
    businessName: 'Bakkerij Noord',
    place: 'Vlaardingen',
    distanceLabel: '1,2 km',
    priceLabel: '€24,00',
    imageUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23c4b8a8"/></svg>',
    disclosure: 'Gesponsord',
    whyLabel: 'Waarom zie ik dit?',
    whyText: 'Je ziet deze aanbeveling omdat dit aanbod aansluit bij je zoekopdracht.',
    cta: 'Bekijk aanbod',
    ...partial,
  };
  return renderToStaticMarkup(React.createElement(SponsoredRecommendationCard, { item: model }));
}

const blocks = [
  ['Basic, korte titel', card({ listingId: 'basic', title: 'Appeltaart' })],
  ['Pro, lange titel', card({ listingId: 'pro', title: longNl, businessName: longBusiness, disclosure: 'Gesponsord', cta: 'Bekijk aanbod' })],
  ['Premium, Engels', card({
    listingId: 'premium',
    title: longEn,
    businessName: longBusiness,
    disclosure: 'Sponsored',
    whyLabel: 'Why am I seeing this?',
    whyText: 'You are seeing this because the offer matches your search.',
    cta: 'View offer',
    priceLabel: '€24.00',
    distanceLabel: '1.2 km',
  })],
  ['Verzending, geen afstand', card({
    listingId: 'ship',
    title: 'Taart per post',
    place: null,
    distanceLabel: null,
    priceLabel: '€32,00',
    whyText: 'Je ziet deze aanbeveling omdat dit aanbod verstuurd kan worden en aansluit bij wat je bekijkt.',
  })],
  ['Online, geen prijs', card({
    listingId: 'online',
    title: 'Online taartles',
    place: null,
    distanceLabel: null,
    priceLabel: null,
    imageUrl: null,
  })],
  ['Zonder foto', card({ listingId: 'nophoto', title: 'Seizoenstaart', imageUrl: null })],
];

const organic = Array.from({ length: 16 }, (_, index) => `<article data-listing-id="org-${index}" style="height:72px;border:1px solid #e7e5e4;border-radius:12px;margin:8px 0;background:#fff">Organisch ${index + 1}</article>`).join('');

const html = `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sponsored card preview</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #F4EFE6; }
    .wrap { box-sizing: border-box; width: 100%; padding: 12px; }
    .grid-2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
    .span { grid-column: 1 / -1; }
    h2 { font-size: 14px; margin: 16px 0 8px; }
  </style>
</head>
<body>
  <div class="wrap" id="one">
    ${blocks.map(([label, markup]) => `<h2>${label}</h2>${markup}`).join('')}
  </div>
  <div class="wrap grid-2" id="two">
    <h2 class="span">Twee kolommen</h2>
    <article style="height:80px;background:#fff">Organisch links</article>
    <article style="height:80px;background:#fff">Organisch rechts</article>
    <div class="span">${card({ listingId: 'span', title: longNl, businessName: longBusiness })}</div>
  </div>
  <div class="wrap" id="feed">
    <h2>Feed met pulse en sponsored</h2>
    ${organic.slice(0, organic.indexOf('Organisch 4'))}
    <aside data-hc-community-pulse="">Nieuw in de buurt</aside>
    ${organic}
    <div id="slot"></div>
  </div>
  <pre id="metrics"></pre>
  <script>
    const metrics = { cls: 0, scrollBefore: 0, scrollAfter: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) metrics.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    const slot = document.getElementById('slot');
    const sample = document.querySelector('[data-hc-sponsored-recommendation]');
    metrics.scrollBefore = window.scrollY;
    slot.appendChild(sample.cloneNode(true));
    metrics.scrollAfter = window.scrollY;
    const card = document.querySelector('[data-hc-sponsored-recommendation]');
    const rect = card.getBoundingClientRect();
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    const label = card.querySelector('[data-hc-sponsored-disclosure]');
    const cta = card.querySelector('a');
    document.getElementById('metrics').textContent = JSON.stringify({
      cls: metrics.cls,
      scrollShift: metrics.scrollAfter - metrics.scrollBefore,
      cardWidth: Math.round(rect.width),
      cardHeight: Math.round(rect.height),
      overflow,
      label: label && label.textContent.trim(),
      cta: cta && cta.textContent.trim(),
      ctaHref: cta && cta.getAttribute('href'),
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    });
  </script>
</body>
</html>`;

mkdirSync('/tmp/hc-sponsored-preview', { recursive: true });
writeFileSync('/tmp/hc-sponsored-preview/index.html', html);
console.log('wrote /tmp/hc-sponsored-preview/index.html');
