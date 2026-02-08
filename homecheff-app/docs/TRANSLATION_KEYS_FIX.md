# Translation Keys Fix - Geen Keys Meer Zichtbaar

## 🚨 Probleem
Vertaling keys zoals "title", "subtitle", "emailPlaceholder", etc. werden getoond door de hele app heen, zelfs tijdens het laden.

## ✅ Oplossingen Geïmplementeerd

### 1. **Login Vertalingen Toegevoegd aan nl.json**
- Volledige `login` sectie toegevoegd met alle Nederlandse vertalingen
- Alle keys zoals `title`, `subtitle`, `emailPlaceholder`, `passwordPlaceholder`, `loginButton`, etc.

### 2. **t() Functie Aangepast**
- **Voor:** Retourneerde de key als fallback (bijv. "title", "subtitle")
- **Na:** Retourneert een lege string (`''`) tijdens het laden en bij ontbrekende vertalingen
- Dit voorkomt dat keys zichtbaar zijn in de UI

### 3. **Login Pagina Aangepast**
- Toegevoegd: Loading state die wacht tot vertalingen geladen zijn
- Toont een loading spinner in plaats van de pagina tijdens het laden
- Voorkomt dat keys worden getoond tijdens initial load

### 4. **Cache Versie Verhoogd**
- Cache versie verhoogd van `2.2` naar `2.3`
- Dit zorgt ervoor dat oude caches worden gewist en nieuwe vertalingen worden geladen

---

## 📋 Wat is Aangepast

### `hooks/useTranslation.ts`
```typescript
// VOOR:
if (isLoading && Object.keys(translations).length === 0) {
  return key.split('.').pop() || key; // Toonde "title", "subtitle", etc.
}

// NA:
if (isLoading && Object.keys(translations).length === 0) {
  return ''; // Lege string, geen keys zichtbaar
}
```

### `app/login/page.tsx`
```typescript
// Toegevoegd:
const { t, isReady, isLoading } = useTranslation();

// Loading state:
if (!isReady || isLoading) {
  return <LoadingSpinner />;
}
```

### `public/i18n/nl.json`
- Volledige `login` sectie toegevoegd met alle Nederlandse vertalingen

---

## 🔄 Voor Andere Pagina's

Als andere pagina's ook keys tonen, voeg dan een loading check toe:

```typescript
const { t, isReady, isLoading } = useTranslation();

// Wacht tot vertalingen geladen zijn
if (!isReady || isLoading) {
  return <LoadingSpinner />; // of return null;
}
```

---

## ✅ Resultaat

- ✅ Geen keys meer zichtbaar tijdens het laden
- ✅ Geen keys meer zichtbaar bij ontbrekende vertalingen
- ✅ Schone UI zonder "title", "subtitle", etc.
- ✅ Login pagina wacht op vertalingen voordat UI wordt getoond

---

## 🧪 Testen

1. **Clear browser cache** (of gebruik incognito)
2. **Ga naar** `/login`
3. **Verwacht:** Loading spinner, daarna volledige pagina met Nederlandse teksten
4. **Geen keys zichtbaar** zoals "title", "subtitle", etc.

---

## 📝 Volgende Stappen (Optioneel)

Voor andere pagina's die keys tonen:
1. Voeg loading check toe zoals in login pagina
2. Of gebruik een globale wrapper component die wacht op vertalingen
3. Zorg dat alle vertalingen aanwezig zijn in `nl.json` en `en.json`





