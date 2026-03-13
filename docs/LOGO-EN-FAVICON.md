# Logo en favicon

## Logo in de navbar

Er staat al een **`public/logo.png`** in het project; die wordt gebruikt voor het logo in de navbar, footer en op pagina’s. Wat je ziet is het **ingebouwde logo** in de code: een SVG (chef-icoon met tekst “HomeCheff”) in het component `components/Logo.tsx`. Als het bestand niet laadt, valt de site terug op een ingebouwde SVG (chef-icoon) in het Logo-component.

---

## Favicon (tabblad in de browser)

Plaats in **`public/`**:

| Bestand               | Formaat / grootte      | Gebruik                |
|-----------------------|------------------------|------------------------|
| `public/favicon.ico`  | ICO, bijv. 32×32       | Favicon in browser-tab |
| `public/icon.png`     | PNG, bijv. 32×32       | Alternatieve icon      |
| `public/apple-icon.png` | PNG, bijv. 180×180   | Apple startscherm      |

**Doe het zo:**  
- **`public/favicon.ico`** → wordt gebruikt als favicon.  
- Optioneel: **`public/icon.png`** en **`public/apple-icon.png`** voor betere ondersteuning op verschillende apparaten.

De layout verwijst al naar `/favicon.ico`, `/icon.png` en `/apple-icon.png`; die paden komen uit de `public/` map.

---

## 3. Open Graph-afbeelding (linkpreview bij delen)

Voor een mooie preview wanneer iemand de site deelt (social media, chat):

Plaats in **`public/`**:

| Bestand                        | Formaat / grootte | Gebruik              |
|--------------------------------|-------------------|----------------------|
| `public/opengraph-image.png`   | PNG, 1200×630     | Linkpreview-afbeelding |

**Doe het zo:**  
Zet je afbeelding in de projectmap als **`public/opengraph-image.png`** (aanbevolen formaat 1200×630 px).

---

## Overzicht: waar plaats je wat?

```
Homecheff-app git/
  public/
    logo.png              ← Logo (navbar, footer, etc.)
    favicon.ico           ← Favicon (browser-tab)
    icon.png              ← Optioneel: extra icon
    apple-icon.png        ← Optioneel: Apple startscherm
    opengraph-image.png   ← Optioneel: linkpreview bij delen
```

Je hoeft niets te uploaden naar een aparte plek: alles staat in **`public/`** en wordt automatisch door de site gebruikt.
