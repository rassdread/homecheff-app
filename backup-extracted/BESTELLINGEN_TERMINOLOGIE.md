# 📦 Bestellingen Terminologie - Duidelijk Onderscheid

## 🎯 Probleem

Momenteel is er verwarring tussen:
- **Inkomende bestellingen** (voor verkopers) - iemand bestelt bij jou
- **Uitgaande bestellingen** (voor kopers) - jij bestelt bij iemand

Beide worden "bestellingen" genoemd, wat verwarring veroorzaakt.

## ✅ Voorgestelde Terminologie

### Voor Kopers (Uitgaande Bestellingen)
**Terminologie:**
- **"Mijn Aankopen"** of **"Mijn Bestellingen"** (jij bestelt bij anderen)
- **"Wat ik heb besteld"**
- **"Mijn Aankopen"** (duidelijkste optie)

**Context:**
- Jij bent de koper
- Jij hebt iets besteld bij een verkoper
- Jij wacht op levering/afhaling

### Voor Verkopers (Inkomende Bestellingen)
**Terminologie:**
- **"Inkomende Bestellingen"** of **"Nieuwe Bestellingen"**
- **"Bestellingen van Klanten"**
- **"Verkooporders"** (duidelijkste optie)

**Context:**
- Jij bent de verkoper
- Iemand heeft iets bij jou besteld
- Jij moet het product klaarmaken/verzenden

## 📋 Voorgestelde UI Wijzigingen

### 1. Koper Dashboard (`/orders`)
**Huidig:**
- Titel: "Mijn bestellingen"
- Beschrijving: "Overzicht van al je bestellingen"

**Voorgesteld:**
- Titel: **"Mijn Aankopen"**
- Beschrijving: **"Overzicht van producten die je hebt besteld"**
- Icon: ShoppingCart (aankoop icon)

### 2. Verkoper Dashboard (`/verkoper/dashboard`)
**Huidig:**
- Knop: "Bestellingen"
- Beschrijving: "Beheer bestellingen"

**Voorgesteld:**
- Knop: **"Inkomende Bestellingen"** of **"Verkooporders"**
- Beschrijving: **"Bestellingen van klanten die je moet verwerken"**
- Icon: Package (inkomend pakket icon)

### 3. Verkoper Orders Pagina (`/verkoper/orders`)
**Huidig:**
- Titel: "Bestellingen" (onduidelijk)

**Voorgesteld:**
- Titel: **"Inkomende Bestellingen"** of **"Verkooporders"**
- Subtitle: **"Bestellingen die klanten bij jou hebben geplaatst"**

## 🔄 Alternatieve Terminologie Opties

### Optie 1: Aankopen vs Verkooporders
- **Kopers**: "Mijn Aankopen"
- **Verkopers**: "Verkooporders"

### Optie 2: Bestellingen vs Inkomende Bestellingen
- **Kopers**: "Mijn Bestellingen" (blijft hetzelfde)
- **Verkopers**: "Inkomende Bestellingen" (duidelijker)

### Optie 3: Aankopen vs Bestellingen
- **Kopers**: "Mijn Aankopen"
- **Verkopers**: "Bestellingen" (blijft hetzelfde, maar context maakt duidelijk)

## 💡 Aanbeveling

**Gebruik Optie 1: Aankopen vs Verkooporders**

**Waarom:**
- ✅ Meest duidelijk onderscheid
- ✅ Geen verwarring mogelijk
- ✅ Professioneel klinkend
- ✅ Duidelijke actie: "Aankopen" = wat je koopt, "Verkooporders" = wat je verkoopt

## 📝 Implementatie Plan

### Stap 1: UI Teksten Aanpassen
1. `/orders` → "Mijn Aankopen"
2. `/verkoper/orders` → "Verkooporders" of "Inkomende Bestellingen"
3. Verkoper dashboard knop → "Verkooporders"

### Stap 2: API Endpoints (Optioneel)
- Huidige endpoints blijven werken
- Optioneel: aliassen toevoegen voor duidelijkheid
  - `/api/orders` (blijft hetzelfde)
  - `/api/seller/orders` (blijft hetzelfde)

### Stap 3: Documentatie
- Update alle documentatie met nieuwe terminologie
- Zorg voor consistentie in hele applicatie

## 🎨 UI Voorbeelden

### Koper Dashboard
```
┌─────────────────────────────────┐
│  🛒 Mijn Aankopen               │
│  Overzicht van producten die    │
│  je hebt besteld                │
└─────────────────────────────────┘
```

### Verkoper Dashboard
```
┌─────────────────────────────────┐
│  📦 Verkooporders                │
│  Bestellingen van klanten die   │
│  je moet verwerken              │
└─────────────────────────────────┘
```

## ✅ Voordelen

1. **Geen verwarring meer** - duidelijk onderscheid
2. **Betere UX** - gebruikers weten direct wat ze zien
3. **Professioneel** - duidelijke terminologie
4. **Schaalbaar** - werkt ook als iemand zowel koper als verkoper is





