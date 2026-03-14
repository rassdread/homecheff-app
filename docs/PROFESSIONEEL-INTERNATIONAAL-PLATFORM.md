# HomeCheff: professioneel internationaal platform – stand van zaken

Overzicht van wat er **al is** en wat er **nog nodig** is voor een professionele, internationale platform-site.

---

## Wat we al hebben

### Juridisch & compliance
- **Privacybeleid** (`/privacy`) – NL/EN, metadata, layout
- **Algemene voorwaarden** (`/terms`) – pagina met bedrijfsgegevens (Arrias Beheer B.V., KvK, BTW, Vlaardingen)
- **Cookiebanner** – PrivacyNotice met accept/decline, i18n (cookieBanner.*)
- **Bedrijfsgegevens** – Over ons: KvK 80532829, BTW NL861704782B01, vestigingsplaats Vlaardingen, contact via formulier
- **Contact** – contactpagina + API, layout met metadata

### Technisch & SEO
- **Twee talen** – NL en EN via i18n (nl.json, en.json), taal-cookie, X-HomeCheff-Language
- **Metadata per pagina** – title, description, openGraph, alternates (canonical + hreflang)
- **Open Graph images** – homepage = logo; product/recept/design/tuin = itemfoto; profiel/verkoper = profielfoto (absolute URLs)
- **Sitemap** – dynamisch (dorpsplein, inspiratie, producten, etc.), beide domeinen
- **robots.txt** – allow/disallow logisch (geen index van /api, /admin, /profile, etc.)
- **Structured data (JSON-LD)** – homepage (Organization), product (Product), verkoper (LocalBusiness), FAQ
- **Redirects** – aviliate → affiliate (301)
- **Domeinen** – homecheff.nl → homecheff.eu (307), taal cookie gezet

### Gebruikerservaring & toegankelijkheid
- **Footer** – links naar Privacy, Voorwaarden, Contact, Over ons, FAQ + bedrijfsregel
- **Skip-link** – “Skip to content” voor toetsenbord/screenreader
- **404 & error** – not-found en error.tsx met i18n en duidelijke acties
- **Favicon/logo** – logo.png als icon en apple-icon in layout
- **Viewport** – zoom toegestaan (accessibility)

### Deel & affiliate
- **ShareButton** – alle socials (WhatsApp, Instagram, TikTok, Facebook, LinkedIn, e-mail, X, Telegram, Pinterest, Reddit), i18n, duidelijke knop
- **Affiliate in share** – bij elk delen wordt ref-parameter meegestuurd (ShareButton + eigen handleShare waar gebruikt)
- **Linkpreviews** – OG-images zodat gedeelde links een foto tonen (item of profiel)

### Beveiliging & performance
- **Rate limiting** – lib/security.ts (o.a. voor API)
- **Security headers** – gedefinieerd in lib/security.ts (X-Frame-Options, CSP, etc.); **niet** in huidige middleware (wel in next.config voor CORS/cache)
- **CORS** – voor /api en /i18n in next.config + middleware
- **Referral/ref** – middleware zet ref in cookie en redirect naar referral API
- **Image optimization** – Next.js Image, remote patterns (Vercel Blob, Google, Facebook)
- **Vercel Analytics** – component aanwezig

### Content & pagina’s
- **Over ons** – bedrijfsinfo, bedrijfsgegevens
- **FAQ** – met i18n en FAQPage schema
- **Werken bij** – layout + content
- **Affiliate** – programma, dashboard, referral links
- **Dorpsplein, Inspiratie, Product, Seller, User profile** – kernflows aanwezig

---

## Wat is bijgewerkt (de 6 punten)

### 1. Security headers in productie ✅
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Content-Security-Policy) worden in `next.config.mjs` onder `async headers()` voor `/:path*` toegepast. Bestaande CORS/cache-regels blijven; security headers zijn toegevoegd aan dezelfde source.

### 2. Volledige EN-versie van Terms ✅
- Alle secties (1 t/m 8 + contact) staan in i18n: `termsPage.s1Title`, `s1P1`, `s2Platform`, … in nl.json en en.json. De terms-pagina gebruikt overal `t('termsPage.xxx')`. EN en NL zijn volledig vertaald.

### 3. Cookiebanner: opt-in/opt-out voor analytics ✅
- Twee knoppen: **“Alleen noodzakelijk”** (zet `privacy-notice-accepted=necessary`) en **“Accepteer alle”** (zet `true`). Bestaande gebruikers met `true` blijven ongewijzigd. Tekst cookieNote vermeldt dat “Accepteer alle” ook analytics toestaat.

### 4. Meertaligheid voorbereid ✅
- In `lib/locale.ts`: type `Language`, constante `SUPPORTED_LOCALES = ['nl', 'en']` en commentaar hoe een nieuwe taal toe te voegen (nieuwe i18n-JSON + taal in SUPPORTED_LOCALES + taalselector). Geen wijziging in bestaand gedrag.

### 5. Monitoring gekoppeld aan cookie consent ✅
- Component `ConsentAwareAnalytics`: laadt Vercel Analytics alleen als `localStorage.getItem('privacy-notice-accepted')` gelijk is aan `'true'` of `'all'`. Bij “Alleen noodzakelijk” wordt geen analytics geladen. In layout wordt `<ConsentAwareAnalytics />` gebruikt in plaats van direct `<VercelAnalytics />`.

### 6. Legal review-disclaimer ✅
- Op de **Terms**-pagina: `termsPage.legalDisclaimer` (NL/EN) onderaan: “Deze teksten zijn niet juridisch getoetst. Laat ze controleren door een jurist.”
- Op de **Privacy**-pagina: `register.privacyPage.legalDisclaimer` (NL/EN) onderaan dezelfde disclaimer.

### 7. Performance & Core Web Vitals
- **Nu:** Next.js Image, lazy loading, standalone build.
- **Doen:** LCP/CLS/FID meten (Vercel Analytics of PageSpeed Insights); grote afbeeldingen en third-party scripts optimaliseren waar nodig.

### 8. Duidelijke “Help” / Support
- **Nu:** FAQ, Contact.
- **Doen:** Centrale “Help” of “Support”-pagina met links naar FAQ, contact, voorwaarden, statuspagina (optioneel).

---

## Samenvatting

| Onderdeel              | Status | Opmerking |
|------------------------|--------|-----------|
| Privacy + Terms        | ✅     | EN Terms-content nog uitbreiden |
| Cookiebanner           | ✅     | Optioneel: granular consent (analytics) |
| i18n (NL/EN)           | ✅     | Breed in gebruik |
| SEO (meta, OG, sitemap)| ✅     | Inclusief OG-foto’s per item/profiel |
| Structured data        | ✅     | Homepage, product, verkoper, FAQ |
| Deel-knoppen + affiliate| ✅    | Alle socials, ref altijd mee |
| Footer, skip-link, 404/500 | ✅ | |
| Security headers       | ✅    | In next.config voor /:path* |
| Juridische review      | ⚠️    | Disclaimer toegevoegd; inhoudelijk laten controleren door jurist |
| Uitgebreide EN legal   | ✅    | Terms volledig in i18n (NL + EN) |
| Cookie consent (granular) | ✅ | Alleen noodzakelijk vs Accepteer alle; analytics alleen bij “alle” |
| Monitoring (consent)   | ✅    | Vercel Analytics via ConsentAwareAnalytics |

Met de bovenstaande punten (vooral security headers, volledige EN Terms en eventueel cookie-granulariteit) voldoet de site goed aan de basis voor een **professioneel internationaal platform**. Juridische controle en duidelijke afspraken over analytics maken het af.
