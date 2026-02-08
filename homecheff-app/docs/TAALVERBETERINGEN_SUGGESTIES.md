# Taalverbeteringen Suggesties - HomeCheff App
## Gebaseerd op psychologisch onderzoek naar engagement, delen en community-gedrag

---

## 🎯 Kernprincipes (uit onderzoek)

1. **Autonomie & Zelfbepaling**: Geef gebruikers controle, geen druk
2. **Sociale Verbondenheid**: Benadruk community, niet individuele prestatie
3. **Positieve Feedback**: Vier successen, geen schuldgevoel
4. **Duidelijke Waarde**: Transparantie over wat de gebruiker krijgt
5. **Nederlandse Directheid**: Eerlijk en direct, geen overdrijving
6. **Delen als Natuurlijk Gedrag**: Maak delen laagdrempelig, niet verplichtend

---

## 📄 PAGINA: Homepage (Dorpsplein) - `app/page.tsx`

### Huidige Teksten:
- "Ontdek Lokale Delicatessen"
- "Vind verse producten, heerlijke gerechten en unieke creaties van lokale makers in jouw buurt"
- "Koop lokaal of zet je creaties op het dorpsplein te koop — alles op één plek."

### 🔍 Onderzoek: Sociale Verbondenheid + Duidelijke Waarde

### Suggesties:

#### Hero Section:
**HUIDIG:**
```
"Ontdek Lokale Delicatessen"
"Vind verse producten, heerlijke gerechten en unieke creaties van lokale makers in jouw buurt"
```

**VOORGESTELD:**
```
"Welkom op het Dorpsplein"
"Ontdek wat jouw buurt te bieden heeft: verse oogst, huisgemaakte gerechten en unieke creaties van mensen om je heen"
```

**Waarom:** 
- "Welkom" creëert verbondenheid (onderzoek: sociale verbondenheid verhoogt engagement)
- "jouw buurt" is persoonlijker dan "lokale makers"
- "mensen om je heen" benadrukt persoonlijke connectie

---

#### Call-to-Action:
**HUIDIG:**
```
"Koop lokaal of zet je creaties op het dorpsplein te koop — alles op één plek."
```

**VOORGESTELD:**
```
"Word onderdeel van je lokale community — deel je passie of ontdek wat er om je heen gebeurt"
```

**Waarom:**
- "Word onderdeel" stimuleert sociale verbondenheid (onderzoek: Fogg Behavior Model - sociale triggers)
- "deel je passie" is positief, geen verkoop-druk
- "ontdek wat er om je heen gebeurt" wekt nieuwsgierigheid (onderzoek: nieuwsgierigheid = motivatie)

---

## 📄 PAGINA: Registratie - `app/register/page.tsx`

### Huidige Teksten:
- "Wat ga je doen op HomeCheff?"
- "Zet je culinaire creaties op het dorpsplein te koop"
- "Je kunt meerdere rollen kiezen!"

### 🔍 Onderzoek: Autonomie + Sociale Bewijskracht + Gewoontevorming

### Suggesties:

#### Stap 2: Rol Selectie
**HUIDIG:**
```
"Wat ga je doen op HomeCheff? Je kunt meerdere rollen selecteren."
```

**VOORGESTELD:**
```
"Kies wat bij jou past — veel mensen combineren rollen om hun passie te delen"
```

**Waarom:**
- "Kies wat bij jou past" = autonomie (onderzoek: autonomie verhoogt intrinsieke motivatie)
- "veel mensen combineren" = sociale bewijskracht (onderzoek: sociale bewijskracht overtuigt zonder druk)
- "hun passie te delen" = positieve framing

---

#### Chef Beschrijving:
**HUIDIG:**
```
"Zet je culinaire creaties op het dorpsplein te koop"
"Deel je beste recepten op je profielpagina en zet je gerechten op het dorpsplein te koop."
```

**VOORGESTELD:**
```
"Deel je culinaire passie met de buurt"
"Vertel je verhaal, deel je recepten en laat anderen genieten van wat jij maakt — op jouw manier"
```

**Waarom:**
- "Deel je passie" = intrinsieke motivatie (onderzoek: intrinsieke motivatie > extrinsieke)
- "Vertel je verhaal" = persoonlijke verbinding (onderzoek: verhalen triggeren delen)
- "op jouw manier" = autonomie

---

#### Tip Sectie:
**HUIDIG:**
```
"💡 Tip: Alles wat je plaatst kun je consistent op het dorpsplein te koop zetten. Maak je profiel compleet en begin met het delen van je passie!"
```

**VOORGESTELD:**
```
"💡 Wist je? Je kunt op elk moment starten met delen. Begin klein of ga groot — het dorpsplein is er voor iedereen die iets te delen heeft"
```

**Waarom:**
- "op elk moment" = geen druk, autonomie
- "Begin klein of ga groot" = laagdrempelig (onderzoek: kleine stappen verhogen adoptie)
- "voor iedereen die iets te delen heeft" = inclusief

---

## 📄 PAGINA: Sell/Abonnement - `app/sell/page.tsx`

### Huidige Teksten:
- "Zet je creaties op het dorpsplein te koop"
- "Kies je pakket. Abonnement + lage fee. Je kunt maandelijks opzeggen."
- "Start Basic", "Start Pro", "Start Premium"

### 🔍 Onderzoek: Transparantie + Autonomie + Sociale Bewijskracht

### Suggesties:

#### Titel:
**HUIDIG:**
```
"Zet je creaties op het dorpsplein te koop"
```

**VOORGESTELD:**
```
"Zet je bedrijf op de kaart — groei met je lokale community"
```

**Waarom:**
- "Zet op de kaart" = positieve framing (onderzoek: positieve framing > negatieve)
- "groei met je community" = sociale verbondenheid, geen eenzame verkoop
- Richt zich op bedrijven, niet algemeen

---

#### Beschrijving:
**HUIDIG:**
```
"Kies je pakket. Abonnement + lage fee. Je kunt maandelijks opzeggen."
```

**VOORGESTELD:**
```
"Kies het abonnement dat bij jouw bedrijf past — transparante prijzen, maandelijks opzegbaar, zonder verborgen kosten"
```

**Waarom:**
- "bij jouw bedrijf past" = personalisatie (onderzoek: personalisatie verhoogt conversie)
- "transparante prijzen, zonder verborgen kosten" = vertrouwen (onderzoek: transparantie = vertrouwen)
- Herhaalt "maandelijks opzegbaar" voor duidelijkheid

---

#### Button Teksten:
**HUIDIG:**
```
"Start Basic", "Start Pro", "Start Premium"
```

**VOORGESTELD:**
```
"Kies Basic", "Kies Pro", "Kies Premium"
```

**Waarom:**
- "Kies" = autonomie, minder commitment-druk dan "Start"
- Onderzoek: lagere commitment-drempel verhoogt actie (Fogg Behavior Model)

**ALTERNATIEF (meer engagement):**
```
"Ontdek Basic", "Groei met Pro", "Maximaliseer met Premium"
```

**Waarom:**
- Action-oriënteerde taal zonder druk
- "Groei" en "Maximaliseer" = positieve outcomes

---

## 📄 COMPONENT: Profiel - `components/profile/ProfileClient.tsx`

### Huidige Teksten:
- "Als bedrijf moet je een abonnement hebben om producten op het dorpsplein te koop te kunnen zetten."

### 🔍 Onderzoek: Positieve Framing + Duidelijke Waarde

### Suggesties:

#### Abonnement Waarschuwing:
**HUIDIG:**
```
"Als bedrijf moet je een abonnement hebben om producten op het dorpsplein te koop te kunnen zetten."
```

**VOORGESTELD:**
```
"Met een abonnement kun je je bedrijf op het dorpsplein laten stralen en meer mensen bereiken"
```

**Waarom:**
- Positieve framing ("kun je") vs. negatieve ("moet je")
- "laten stralen" = aspiratie (onderzoek: aspiratie motiveert meer dan verplichting)
- "meer mensen bereiken" = duidelijke waarde

---

#### Lege State Berichten:
**HUIDIG:**
```
"Je hebt nog geen items geplaatst"
```

**VOORGESTELD:**
```
"Begin met delen — jouw eerste creatie staat binnen 2 minuten online"
```

**Waarom:**
- "Begin met delen" = actie (onderzoek: specifieke actie-taal triggert gedrag)
- "binnen 2 minuten" = laagdrempelig (onderzoek: concrete tijdsduur vermindert perceptie van moeite)

---

## 📄 COMPONENT: ItemCard - `components/ItemCard.tsx`

### Huidige Teksten:
- "Net geleden", "u geleden", "d geleden"

### 🔍 Onderzoek: Sociale Bewijskracht + Urgentie (ethisch)

### Suggesties:

#### Tijd Indicatoren:
**HUIDIG:**
```
"Net geleden", "2u geleden", "3d geleden"
```

**VOORGESTELD:**
```
"Zojuist geplaatst", "2 uur geleden geplaatst", "3 dagen geleden geplaatst"
```

**Waarom:**
- "Zojuist geplaatst" = verse content (onderzoek: verse content triggert interesse)
- Vollediger taal geeft serieuzer gevoel
- Geen nep-urgentie, wel duidelijke informatie

**EXTRA SUGGESTIE:**
```
Bij recente items (< 1 uur): "🆕 Vers geplaatst"
Bij populaire items: "🔥 Populair in je buurt"
```

**Waarom:**
- Sociale bewijskracht zonder manipulatie
- Onderzoek: badges/indicatoren verhogen klikgedrag (ethisch)

---

## 📄 COMPONENT: Winkelwagen - `i18n/nl.json`

### Huidige Teksten:
- "Je winkelwagen is leeg"
- "Ontdek heerlijke lokale producten en voeg ze toe aan je winkelwagen"
- "Verder winkelen"

### 🔍 Onderzoek: Verliesaversie (positief) + Sociale Verbondenheid

### Suggesties:

#### Lege Winkelwagen:
**HUIDIG:**
```
"Je winkelwagen is leeg"
"Ontdek heerlijke lokale producten en voeg ze toe aan je winkelwagen"
```

**VOORGESTELD:**
```
"Je winkelwagen staat klaar voor jouw volgende ontdekking"
"Ontdek wat er nu beschikbaar is in je buurt — van verse oogst tot huisgemaakte gerechten"
```

**Waarom:**
- "staat klaar voor" = positieve framing vs. "is leeg" (onderzoek: positieve framing)
- "jouw volgende ontdekking" = nieuwsgierigheid trigger
- "wat er nu beschikbaar is" = sociale bewijskracht (anderen hebben al items)

---

#### Verder Winkelen:
**HUIDIG:**
```
"Verder winkelen"
```

**VOORGESTELD:**
```
"Ontdek meer op het dorpsplein"
```

**Waarom:**
- "Ontdek meer" = nieuwsgierigheid (onderzoek: nieuwsgierigheid = motivatie)
- "op het dorpsplein" = consistentie met nieuwe branding
- Minder commercieel, meer community-gericht

---

## 📄 PAGINA: Inspiratie - `app/inspiratie/page.tsx`

### Huidige Teksten:
- "Inspiratie laden..."
- Metadata: "Ontdek recepten, kweken en designs van onze community"

### 🔍 Onderzoek: Nieuwsgierigheid + Sociale Bewijskracht

### Suggesties:

#### Loading State:
**HUIDIG:**
```
"Inspiratie laden..."
```

**VOORGESTELD:**
```
"We halen de nieuwste inspiratie op van je buurt..."
```

**Waarom:**
- "nieuwste inspiratie" = verse content (onderzoek: verse content = engagement)
- "van je buurt" = persoonlijke relevantie (onderzoek: relevantie = betrokkenheid)

---

#### Metadata:
**HUIDIG:**
```
"Ontdek recepten, kweken en designs van onze community"
```

**VOORGESTELD:**
```
"Ontdek wat er leeft in jouw buurt — recepten, verse oogst en unieke creaties van mensen om je heen"
```

**Waarom:**
- "wat er leeft" = dynamisch, levend (onderzoek: levendigheid triggert interesse)
- "jouw buurt" = personalisatie
- "mensen om je heen" = sociale verbondenheid

---

## 📄 ALGEMENE: Call-to-Action Buttons

### Onderzoek: Actie-Oriëntatie + Autonomie

### Suggesties:

#### Generieke Buttons:
**HUIDIG:**
```
"Start", "Begin", "Meld aan", "Koop nu"
```

**VOORGESTELD:**
```
"Ontdek", "Kies", "Word onderdeel van", "Probeer uit"
```

**Waarom:**
- Lagere commitment-drempel (onderzoek: Fogg - lagere drempel = meer acties)
- Positieve framing zonder druk
- Autonomie benadrukken

---

#### Specifieke Actions:
**HUIDIG → VOORGESTELD:**

| Huidig | Voorgesteld | Waarom |
|--------|------------|--------|
| "Item toevoegen" | "Deel je creatie" | Sociale verbondenheid |
| "Publiceren" | "Deel met de buurt" | Community-gericht |
| "Bestellen" | "Reserveer dit item" | Minder druk, meer commitment |
| "Fan worden" | "Volg [naam]" | Directe taal |
| "Opslaan" | "Bewaar voor later" | Duidelijke waarde |

---

## 📄 ALGEMENE: Error/Success Messages

### Onderzoek: Positieve Feedback + Duidelijke Waarde

### Suggesties:

#### Success Messages:
**HUIDIG:**
```
"Item geplaatst", "Opgeslagen", "Succesvol"
```

**VOORGESTELD:**
```
"✅ Je creatie staat nu op het dorpsplein!"
"💾 Opgeslagen — je kunt het later bewerken"
"🎉 Gefeliciteerd! Je bent nu onderdeel van de community"
```

**Waarom:**
- Emoji's = positieve emotie (onderzoek: visuele cues verhogen engagement)
- Specifieke feedback = competentie gevoel (onderzoek: zelfdeterminatie theorie)
- Vier successen = gewoontevorming

---

#### Error Messages:
**HUIDIG:**
```
"Upload mislukt", "Fout opgetreden"
```

**VOORGESTELD:**
```
"🔄 Probeer het opnieuw — soms heeft de upload even tijd nodig"
"💡 Tip: Check je internetverbinding en probeer het nogmaals"
```

**Waarom:**
- Helpende taal vs. blameren (onderzoek: helpende taal = vertrouwen)
- Concrete suggesties = competentie
- Positieve framing zelfs bij errors

---

## 📄 ALGEMENE: Notificaties/Feedback

### Onderzoek: Persoonlijke Feedback + Sociale Verbondenheid

### Suggesties:

#### Notificaties:
**HUIDIG:**
```
"Je hebt nieuwe berichten"
"Item is toegevoegd aan favorieten"
```

**VOORGESTELD:**
```
"👋 [Naam] heeft je een bericht gestuurd"
"✨ Iemand in je buurt heeft je creatie opgeslagen"
"🎉 Je eerste fan! [Naam] volgt je nu"
```

**Waarom:**
- Naam = persoonlijke connectie (onderzoek: personalisatie)
- Positieve emotie (emoji's) = dopamine response
- Sociale bevestiging = gewoontevorming

---

## 🎯 SAMENVATTING: Hoofdthema's

### 1. **Community-Focus**
- Vervang "jij" door "jullie" waar mogelijk
- Benadruk "buurt", "community", "samen"
- Sociale bewijskracht: "veel mensen doen X"

### 2. **Autonomie**
- "Kies" i.p.v. "Moet"
- "Kun je" i.p.v. "Moet je"
- Opties geven, geen verplichtingen

### 3. **Positieve Framing**
- "Kun je bereiken" i.p.v. "Moet hebben"
- "Deel je passie" i.p.v. "Verkoop je product"
- Vier successen, geen schuldgevoel

### 4. **Duidelijke Waarde**
- Concrete voordelen: "Binnen 2 minuten online"
- Transparantie: "Geen verborgen kosten"
- Sociale bewijskracht: "Zoals 500+ anderen"

### 5. **Nederlandse Directheid**
- Eerlijk en transparant
- Geen overdrijving
- Direct maar vriendelijk

---

## 🔬 Onderzoeksbronnen (samengevat)

1. **Fogg Behavior Model**: B=MAT (Motivation, Ability, Trigger)
   - Lagere drempels = meer acties
   - Autonomie = intrinsieke motivatie

2. **Zelfdeterminatie Theorie**: Autonomie, Competentie, Verbondenheid
   - Positieve feedback = competentie
   - Sociale verbondenheid = engagement

3. **Sociale Bewijskracht (Cialdini)**: "Anderen doen dit ook"
   - Subtiel, niet manipulatief
   - Community-focused

4. **Positieve Psychologie**: Vier successen
   - Positieve framing > negatieve
   - Helpende taal > blameren

5. **Behavioral Design Hooks**: Ethisch engagement
   - Nieuwsgierigheid triggers
   - Variabele beloningen (ethisch)
   - Sociale triggers

---

## ⚠️ Te Vermijden (Manipulatie)

1. ❌ "Mis deze kans niet!"
2. ❌ "Je vrienden wachten op je"
3. ❌ "Nog maar 2 plekken over!"
4. ❌ "Je moet..."
5. ❌ Dwingende taal
6. ❌ Nep-urgentie
7. ❌ Schuldgevoel opwekken

---

## ✅ Toe te Passen (Ethisch)

1. ✅ "Kies wat bij jou past"
2. ✅ "Veel mensen in je buurt doen dit"
3. ✅ "Deel je passie met anderen"
4. ✅ Transparante communicatie
5. ✅ Autonomie benadrukken
6. ✅ Positieve feedback
7. ✅ Sociale verbondenheid

---

**Gereed voor review en feedback voordat we implementeren!**

