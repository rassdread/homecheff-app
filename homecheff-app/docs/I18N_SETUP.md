# Internationalisatie (i18n) Setup - HomeCheff

## Overzicht

De app ondersteunt nu tweetaligheid (Nederlands en Engels) met domain-based routing:
- **homecheff.nl** → Nederlands (NL)
- **homecheff.eu** → Engels (EN)

## Hoe het werkt

### 1. Domain-based Language Detection

De middleware detecteert automatisch de taal op basis van het domein:
- `homecheff.nl` → Nederlands
- `homecheff.eu` → Engels

### 2. Language Switcher

Er is een Language Switcher component toegevoegd aan de NavBar die gebruikers toelaat om handmatig van taal te wisselen. De taal wordt opgeslagen in:
1. Cookie (`homecheff-language`) - heeft prioriteit
2. localStorage - fallback
3. Domain detection - laatste fallback

### 3. Vertaalbestanden

Vertaalbestanden staan in `public/i18n/`:
- `nl.json` - Nederlandse vertalingen
- `en.json` - Engelse vertalingen

## Vercel Configuratie

### Stap 1: Domeinen toevoegen in Vercel

1. Ga naar je Vercel project dashboard
2. Ga naar **Settings** → **Domains**
3. Voeg beide domeinen toe:
   - `homecheff.nl`
   - `homecheff.eu`

### Stap 2: DNS Configuratie

Voor beide domeinen moet je DNS records instellen:

**Voor homecheff.nl:**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP - check Vercel dashboard voor actuele IP)
```

**Voor homecheff.eu:**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP - check Vercel dashboard voor actuele IP)
```

**Of gebruik CNAME (aanbevolen):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### Stap 3: Environment Variables

Zorg ervoor dat je environment variables correct zijn ingesteld voor beide domeinen:

```env
NEXTAUTH_URL=https://homecheff.nl  # of https://homecheff.eu afhankelijk van waar je inlogt
```

**Belangrijk:** Voor OAuth providers (Google, Facebook) moet je beide domeinen toevoegen aan:
- **Google OAuth**: Authorized JavaScript origins en Redirect URIs
- **Facebook OAuth**: Valid OAuth Redirect URIs en App Domains

### Stap 4: Middleware Configuratie

De middleware is al geconfigureerd in `middleware.ts`:

```typescript
const DOMAIN_LANGUAGE_MAP = {
  'homecheff.nl': 'nl',
  'homecheff.eu': 'en',
  'www.homecheff.nl': 'nl',
  'www.homecheff.eu': 'en',
} as const;
```

## Gebruik in Componenten

### useTranslation Hook

```typescript
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t, language, changeLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('inspiratie.title')}</h1>
      <p>{t('inspiratie.greeting', { firstName: 'John' })}</p>
    </div>
  );
}
```

### Vertalingen Toevoegen

1. Voeg de Nederlandse vertaling toe aan `public/i18n/nl.json`
2. Voeg de Engelse vertaling toe aan `public/i18n/en.json`
3. Gebruik de `t()` functie in je componenten

## Best Practices

1. **Gebruik altijd de `t()` functie** voor alle gebruikersgerichte teksten
2. **Gebruik parameters** voor dynamische content: `t('key', { param: value })`
3. **Houd vertaalbestanden gesynchroniseerd** - zorg dat alle keys in beide talen bestaan
4. **Test beide talen** na elke wijziging

## Troubleshooting

### Taal wordt niet correct gedetecteerd

1. Check of de cookie `homecheff-language` is ingesteld
2. Check of het domein correct is geconfigureerd in Vercel
3. Check de browser console voor errors bij het laden van vertaalbestanden

### Vertalingen worden niet geladen

1. Check of `public/i18n/nl.json` en `public/i18n/en.json` bestaan
2. Check of de bestanden correct JSON zijn
3. Check de Network tab in browser DevTools voor 404 errors

### Domain routing werkt niet

1. Check DNS configuratie
2. Check Vercel domain settings
3. Wacht tot DNS propagatie compleet is (kan tot 48 uur duren)

## Toekomstige Uitbreidingen

- [ ] Meer talen toevoegen (bijv. Duits, Frans)
- [ ] SEO optimalisatie met `hreflang` tags
- [ ] Automatische taal detectie op basis van browser settings
- [ ] Vertaalbeheer systeem voor content managers












