# Vertaalsysteem - Compleet en Sluitend

## ✅ Systeem Overzicht

Het vertaalsysteem is nu volledig geïmplementeerd en sluitend gemaakt. Alle edge cases zijn afgehandeld en race conditions zijn voorkomen.

## 🏗️ Architectuur

### 1. **Globale State Management**
- `translations`: Huidige vertalingen (gedeeld tussen alle componenten)
- `previousTranslations`: Vorige vertalingen (voor smooth taalwisseling)
- `translationListeners`: Set van component listeners voor re-rendering
- `isChangingLanguage`: Flag om race conditions te voorkomen

### 2. **Prioriteit Systeem**

#### Client-side (hooks/useTranslation.ts):
1. **User Database Preference** (hoogste prioriteit voor ingelogde gebruikers)
2. **localStorage** (gebruikerskeuze, blijft behouden)
3. **URL Path** (`/en/` prefix)
4. **Cookie** (`homecheff-language`)
5. **Domain** (homecheff.eu → en, homecheff.nl → nl)
6. **Default** (nl)

#### Server-side (middleware.ts):
1. **URL Path** (`/en/` prefix) - hoogste prioriteit voor routing
2. **Cookie** (`homecheff-language`) - behoudt gebruikersvoorkeur
3. **Domain** (homecheff.eu → en, homecheff.nl → nl)
4. **Default** (nl)

## 🔒 Race Condition Preventie

### 1. **Multiple Initializations**
- `hasInitialized` ref voorkomt meerdere initialisaties
- `lastDetectedLanguage` ref voorkomt onnodige re-initialisaties
- Alleen re-initialiseren als taal daadwerkelijk verandert

### 2. **Language Change Protection**
- `isChangingLanguage` flag voorkomt simultane taalwisselingen
- Check aan het begin van `changeLanguage` om duplicaten te voorkomen
- Flag wordt gereset na navigatie (2 seconden delay)

### 3. **Translation Loading**
- Check of vertalingen al worden geladen voordat nieuwe load start
- Previous translations blijven beschikbaar tijdens switch
- Fallback naar vorige vertalingen als nieuwe nog niet geladen zijn

## 🛡️ Error Handling

### 1. **Translation Loading Errors**
- **Tijdens taalwisseling**: Geen fallback (behoud gebruikerskeuze)
- **Initial load (Engels)**: Fallback naar Nederlands
- **Initial load (Nederlands)**: Critical error, toon lege state

### 2. **Network Errors**
- Retry logica via fallback naar Nederlands
- Console logging voor debugging
- User feedback via `isLoading` en `isReady` states

### 3. **Invalid JSON**
- Validatie van geladen vertalingen
- Error logging met details
- Graceful degradation

## 🔄 Synchronisatie

### 1. **localStorage ↔ Cookie ↔ Database**
- Alle drie worden gesynchroniseerd bij taalwisseling
- localStorage is de source of truth op client-side
- Database is de source of truth voor ingelogde gebruikers
- Cookie wordt gebruikt door middleware

### 2. **Middleware ↔ Client**
- Middleware respecteert cookie (behoudt voorkeur)
- Client respecteert URL path (voor routing)
- Beide synchroniseren bij taalwisseling

## 📝 Component Lifecycle

### 1. **Mount**
1. Register als listener
2. Fetch user preference (als ingelogd)
3. Wait for session en preference
4. Detect language (volgens prioriteit)
5. Load translations
6. Notify listeners

### 2. **Language Change**
1. Check of al bezig (prevent duplicate)
2. Set `isChangingLanguage` flag
3. Save to localStorage, cookie, database
4. Update state
5. Load new translations
6. Navigate to correct path
7. Reset flag na navigatie

### 3. **Unmount**
1. Unregister listener
2. Cleanup (automatisch via React)

## 🧪 Edge Cases Afgehandeld

### ✅ 1. **User logs in met preference**
- User preference wordt geladen
- localStorage en cookie worden gesynchroniseerd
- Taal wordt automatisch aangepast

### ✅ 2. **User switches language tijdens load**
- `isChangingLanguage` flag voorkomt conflicten
- Vorige vertalingen blijven beschikbaar
- Smooth transition zonder flickering

### ✅ 3. **Multiple components mount simultaneously**
- Globale state wordt gedeeld
- Alleen eerste component initialiseert
- Andere componenten krijgen updates via listeners

### ✅ 4. **Translation file fails to load**
- Fallback naar Nederlands (behalve tijdens taalwisseling)
- Error logging voor debugging
- Graceful degradation

### ✅ 5. **Cookie out of sync with localStorage**
- Client-side prioriteit: localStorage > cookie
- Synchronisatie bij initialisatie
- Synchronisatie bij taalwisseling

### ✅ 6. **URL path doesn't match language**
- Middleware respecteert cookie (behoudt voorkeur)
- Client-side navigeert naar correcte path
- Synchronisatie na navigatie

### ✅ 7. **User preference changes in database**
- useEffect reageert op `userLanguagePreference` change
- Taal wordt automatisch aangepast
- localStorage en cookie worden gesynchroniseerd

## 🎯 Best Practices

### 1. **Gebruik altijd `t()` functie**
```typescript
const { t } = useTranslation();
return <h1>{t('inspiratie.title')}</h1>;
```

### 2. **Gebruik `getTranslationObject` voor objecten**
```typescript
const { getTranslationObject } = useTranslation();
const subcategories = getTranslationObject('inspiratie.subcategories.CHEFF');
```

### 3. **Check `isReady` voor kritieke componenten**
```typescript
const { t, isReady } = useTranslation();
if (!isReady) return <Loading />;
```

### 4. **Gebruik `changeLanguage` voor taalwisseling**
```typescript
const { changeLanguage } = useTranslation();
await changeLanguage('en'); // Automatische navigatie en sync
```

## 📊 Performance

### 1. **Lazy Loading**
- Vertalingen worden alleen geladen wanneer nodig
- Cache busting voorkomt stale data
- Previous translations blijven in memory voor smooth transitions

### 2. **Minimal Re-renders**
- Listeners systeem voorkomt onnodige re-renders
- `updateKey` forceert alleen re-render wanneer nodig
- Globale state wordt gedeeld (geen duplicatie)

### 3. **Network Optimization**
- Cache busting alleen bij taalwisseling
- Previous translations als fallback
- Geen onnodige fetches

## 🔍 Debugging

### Console Logs
- `[i18n] Loaded {lang} translations: X keys` - Succesvol geladen
- `[i18n] ✓ bottomNav found` - Validatie van keys
- `[i18n] Changing language from X to Y` - Taalwisseling
- `[i18n] Translation key not found: {key}` - Missing key warning

### States
- `isLoading`: Vertalingen worden geladen
- `isReady`: Vertalingen zijn klaar voor gebruik
- `language`: Huidige taal

## ✅ Compleetheid Checklist

- [x] Single source of truth (globale state)
- [x] Race condition preventie
- [x] Error handling en fallbacks
- [x] Synchronisatie tussen storage layers
- [x] Middleware en client-side alignment
- [x] Edge cases afgehandeld
- [x] Performance optimalisatie
- [x] Debugging tools
- [x] Documentatie

## 🚀 Status

**Het vertaalsysteem is nu volledig compleet en sluitend gemaakt.**

Alle edge cases zijn afgehandeld, race conditions zijn voorkomen, en het systeem is robuust en performant.





