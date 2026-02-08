# 🧭 Navigatie Structuur - Hoe Kom Je Bij Bestellingen?

## 📍 Navigatie Routes Overzicht

### 1. **Mijn Aankopen** (Uitgaande Bestellingen - Kopers)

#### Route: `/orders`
**Titel**: "Mijn Aankopen"  
**Beschrijving**: "Overzicht van producten die je hebt besteld"

#### 🎯 Hoe Kom Je Hier?

##### **Via Hoofdmenu (NavBar)**
1. **Desktop**: 
   - Klik op je **profiel avatar** (rechtsboven)
   - Klik op **"Mijn Aankopen"** in dropdown menu
   - Icon: 📦 Package
   - Met notificatie badge (oranje) als er ongelezen updates zijn

2. **Mobile**:
   - Klik op **hamburger menu** (☰)
   - Scroll naar **"Mijn Aankopen"**
   - Icon: 📦 Package
   - Met notificatie badge

##### **Directe Links**
- Payment success pagina: Link "Mijn Aankopen" na betaling
- Notificaties: Klik op order notificatie → gaat naar `/orders`

##### **Code Locatie**
- **Component**: `components/NavBar.tsx` (regel 262-274, 491-501)
- **Pagina**: `app/orders/page.tsx`

---

### 2. **Verkooporders** (Inkomende Bestellingen - Verkopers)

#### Route: `/verkoper/orders`
**Titel**: "Verkooporders"  
**Beschrijving**: "Inkomende bestellingen van klanten die je moet verwerken"

#### 🎯 Hoe Kom Je Hier?

##### **Via Verkoper Dashboard**
1. **Verkoper Dashboard** (`/verkoper/dashboard`):
   - Ga naar **"Verkoper Dashboard"** via:
     - NavBar → Profiel dropdown → "Verkoper Dashboard" (als je seller rol hebt)
     - Directe link: `/verkoper/dashboard`
   - In dashboard: Klik op **"Verkooporders"** knop (Snelle Acties sectie)
   - Of klik op **"Alle verkooporders"** link bij "Recente Verkooporders"

##### **Via Hoofdmenu (NavBar)**
- **Niet direct beschikbaar** in hoofdmenu
- Je moet eerst naar Verkoper Dashboard, dan naar Verkooporders

##### **Directe Link**
- Directe URL: `/verkoper/orders`
- Van dashboard: Knop "Verkooporders" → `/verkoper/orders`

##### **Code Locatie**
- **Dashboard knop**: `app/verkoper/dashboard/page.tsx` (regel 400-412)
- **Pagina**: `app/verkoper/orders/page.tsx`

---

## 🗺️ Volledige Navigatie Flow

### Voor Kopers (Uitgaande Bestellingen)

```
Homepage
  ↓
NavBar → Profiel Avatar → "Mijn Aankopen"
  ↓
/orders (Mijn Aankopen pagina)
```

**Alternatieve routes:**
- Payment success → Link "Mijn Aankopen"
- Notificatie → Order notificatie → `/orders`

### Voor Verkopers (Inkomende Bestellingen)

```
Homepage
  ↓
NavBar → Profiel Avatar → "Verkoper Dashboard"
  ↓
/verkoper/dashboard
  ↓
Klik "Verkooporders" knop (Snelle Acties)
  ↓
/verkoper/orders (Verkooporders pagina)
```

**Alternatieve routes:**
- Direct: `/verkoper/orders`
- Van dashboard: "Alle verkooporders" link bij recente orders

---

## 📱 UI Elementen

### NavBar Menu Items

#### Desktop Dropdown (Profiel Avatar)
```
┌─────────────────────────┐
│ 👤 Mijn Profiel         │
│ 💬 Berichten            │
│ 📦 Mijn Aankopen  [🔔]  │ ← Met notificatie badge
│ ⚙️ Verkoper Dashboard   │ ← Alleen als seller
│ 🛡️ Admin Dashboard      │ ← Alleen als admin
└─────────────────────────┘
```

#### Mobile Menu
```
┌─────────────────────────┐
│ 👤 Mijn Profiel         │
│ 📦 Mijn Aankopen  [🔔]  │ ← Met notificatie badge
│ ⚙️ Verkoper Dashboard   │ ← Alleen als seller
│ 🛡️ Admin Dashboard      │ ← Alleen als admin
└─────────────────────────┘
```

### Verkoper Dashboard Snelle Acties

```
┌─────────────────────────────────┐
│ 📦 Verkooporders                │ ← Klik hier
│    Inkomende bestellingen van   │
│    klanten                       │
├─────────────────────────────────┤
│ 📊 Analytics                    │
│ 💰 Omzet                        │
│ ➕ Nieuw Product                │
└─────────────────────────────────┘
```

---

## 🔍 Zoek & Filter Opties

### Mijn Aankopen (`/orders`)
- **Status filter**: Alle, Wachtend, Bevestigd, In behandeling, Onderweg, Bezorgd, Geannuleerd
- **Geen zoekfunctie** (alleen filter op status)

### Verkooporders (`/verkoper/orders`)
- **Status filter**: Alle, Wachtend, Bevestigd, In behandeling, Onderweg, Bezorgd, Geannuleerd
- **Zoekfunctie**: Zoek op klantnaam, productnaam of ordernummer

---

## 🎯 Samenvatting: Navigatie Routes

| Pagina | Route | Via NavBar | Via Dashboard | Direct |
|--------|-------|------------|---------------|--------|
| **Mijn Aankopen** | `/orders` | ✅ Profiel → "Mijn Aankopen" | ❌ | ✅ |
| **Verkooporders** | `/verkoper/orders` | ❌ | ✅ Dashboard → "Verkooporders" | ✅ |
| **Verkoper Dashboard** | `/verkoper/dashboard` | ✅ Profiel → "Verkoper Dashboard" | ❌ | ✅ |

---

## 💡 Verbeter Suggesties

### Mogelijke Toevoegingen:
1. **Directe link naar Verkooporders** in NavBar (voor verkopers)
2. **Breadcrumbs** op pagina's voor duidelijkheid
3. **Quick access** widget op homepage voor recente orders

### Huidige Structuur is:
- ✅ **Logisch**: Kopers zien "Aankopen", Verkopers zien "Verkooporders"
- ✅ **Georganiseerd**: Verkooporders via dashboard (logische flow)
- ✅ **Toegankelijk**: Mijn Aankopen direct via NavBar
























