# ✅ Terminologie Wijzigingen - Overzicht

## 🎯 Doel

Duidelijk onderscheid maken tussen:
- **Uitgaande bestellingen** (kopers) - "Mijn Aankopen"
- **Inkomende bestellingen** (verkopers) - "Verkooporders"

## 📝 Aangepaste Bestanden

### 1. ✅ Koper Dashboard (`app/orders/page.tsx`)
**Wijziging:**
- ❌ Oud: "Mijn bestellingen" - "Overzicht van al je bestellingen"
- ✅ Nieuw: **"Mijn Aankopen"** - **"Overzicht van producten die je hebt besteld"**

### 2. ✅ Verkoper Dashboard (`app/verkoper/dashboard/page.tsx`)
**Wijzigingen:**
- ❌ Oud: "Bestellingen" - "Beheer bestellingen"
- ✅ Nieuw: **"Verkooporders"** - **"Inkomende bestellingen van klanten"**

- ❌ Oud: "Recente Bestellingen" - "Alle bestellingen"
- ✅ Nieuw: **"Recente Verkooporders"** - **"Alle verkooporders"**

- ❌ Oud: "Nog geen bestellingen"
- ✅ Nieuw: **"Nog geen verkooporders"**

### 3. ✅ Verkoper Orders Pagina (`app/verkoper/orders/page.tsx`)
**Wijzigingen:**
- ❌ Oud: "Bestellingen" - "Overzicht van al je bestellingen"
- ✅ Nieuw: **"Verkooporders"** - **"Inkomende bestellingen van klanten die je moet verwerken"**

- ❌ Oud: "Geen bestellingen gevonden" - "Je hebt nog geen bestellingen ontvangen"
- ✅ Nieuw: **"Geen verkooporders gevonden"** - **"Je hebt nog geen inkomende bestellingen ontvangen"**

### 4. ✅ Payment Success (`app/payment/success/page.tsx`)
**Wijziging:**
- ❌ Oud: "Mijn bestellingen"
- ✅ Nieuw: **"Mijn Aankopen"**

### 5. ✅ Seller Orders (`app/seller/orders/page.tsx`)
**Wijziging:**
- ❌ Oud: "Mijn Bestellingen"
- ✅ Nieuw: **"Verkooporders"**

## 📊 Nieuwe Terminologie Overzicht

| Context | Oude Terminologie | Nieuwe Terminologie |
|---------|------------------|---------------------|
| **Koper** | "Mijn bestellingen" | **"Mijn Aankopen"** |
| **Verkoper** | "Bestellingen" | **"Verkooporders"** |
| **Verkoper Dashboard** | "Recente Bestellingen" | **"Recente Verkooporders"** |
| **Empty State (Verkoper)** | "Nog geen bestellingen" | **"Nog geen verkooporders"** |

## ✅ Voordelen

1. **Geen verwarring meer** - duidelijk onderscheid tussen inkomend en uitgaand
2. **Betere UX** - gebruikers weten direct wat ze zien
3. **Professioneel** - duidelijke, consistente terminologie
4. **Schaalbaar** - werkt ook als iemand zowel koper als verkoper is

## 🔄 API Endpoints (Ongewijzigd)

API endpoints blijven hetzelfde voor backward compatibility:
- `/api/orders` - Uitgaande bestellingen (kopers)
- `/api/seller/orders` - Inkomende bestellingen (verkopers)
- `/api/seller/dashboard/orders` - Dashboard orders (verkopers)

## 📝 Communicatie Guidelines

**Bij communicatie over bestellingen, gebruik:**

### Voor Kopers:
- ✅ "Mijn Aankopen"
- ✅ "Wat ik heb besteld"
- ✅ "Mijn bestellingen" (nog acceptabel, maar "Aankopen" is duidelijker)

### Voor Verkopers:
- ✅ "Verkooporders"
- ✅ "Inkomende bestellingen"
- ✅ "Bestellingen van klanten"
- ❌ "Mijn bestellingen" (verwarrend - kan beide betekenen)

## 🎯 Resultaat

Nu is er duidelijk onderscheid:
- **Kopers** zien: "Mijn Aankopen" (wat ze hebben gekocht)
- **Verkopers** zien: "Verkooporders" (wat klanten bij hen hebben besteld)

**Geen verwarring meer!** 🎉
























