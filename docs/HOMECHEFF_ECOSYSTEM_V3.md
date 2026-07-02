# HomeCheff Ecosysteem V3

## Missie

HomeCheff is het digitale dorpsplein van jouw buurt.

Mensen moeten elkaar kunnen vinden om:

- iets te maken
- iets te verkopen
- iets te ruilen
- elkaar te helpen
- iets te bezorgen
- iets bij te verdienen
- onderdeel te zijn van een lokale gemeenschap

## Kernbelofte

**Voor bewoners:**
"Ontdek wat mensen uit jouw buurt maken, aanbieden, verkopen en voor elkaar kunnen betekenen."

**Voor makers:**
"Bouw een reputatie op, bereik mensen uit je buurt en verdien op jouw manier."

**Voor helpers:**
"Help anderen, doe opdrachten in jouw omgeving en bouw vertrouwen op."

---

## Bouwsteen 1 — Mensen

Iedereen heeft één profiel.

Geen aparte:

- chef-profielen
- bezorger-profielen
- klusjes-profielen

Maar één persoon met meerdere rollen.

Voorbeelden:

- Kok
- Tuinier
- Maker
- Bezorger
- Digihulp
- Klushulp

Alle reputatie komt op hetzelfde profiel.

---

## Bouwsteen 2 — Aanbod

Twee hoofdtypen:

### Product

Voorbeelden:

- maaltijd
- aardbeien
- groenten
- schilderij
- kleding

### Dienst

Voorbeelden:

- bezorgen
- gras maaien
- computerhulp
- boodschappen
- klusjes
- ouderenhulp

---

## Bouwsteen 3 — Opdrachten

Opdrachten zijn verzoeken.

Typen:

- bestelling
- bezorging
- hulpvraag

---

## Hoofdcategorieën

🍲 Eten & Drinken

🌱 Tuin & Natuur

🎨 Creatief & Gemaakt

🤝 Hulp & Klusjes

---

## Feed Taxonomy

De feed is het centrale ontdekkingsoverzicht van het dorpsplein. Na Fase 5B ondersteunt de implementatie vooral **Aanbod** (producten, inspiratie, contact-only, HomeCheff-betaalproducten). Ecosysteem V3 voorziet dat de feed op termijn **Aanbod én Vraag** verenigt — zonder aparte platformen.

### Twee hoofdrichtingen

#### Aanbod

Mensen bieden iets aan:

- product
- dienst
- inspiratie
- verkoop
- ruilaanbod

#### Vraag

Mensen vragen iets:

- klusje
- hulpvraag
- bezorging
- ruilverzoek
- wederdienst
- buurtvraag

View filters in de UI (chips) zijn **weergave-filters** — geen vervanging voor item-identiteit in data.

### View filters (UI)

Standaard feed: **Alles**.

Snelle filters (chips):

| Filter | Betekenis |
|--------|-----------|
| **Alles** | Gemixte dorpsplein-feed (aanbod + inspiratie; later ook vraag) |
| **Aanbod** | Alles wat iemand aanbiedt |
| **Vraag** | Alles wat iemand zoekt of vraagt |
| **Inspiratie** | Content zonder directe verkoop |
| **Te koop** | Aanbod met verkoopprijs / checkout |
| **Diensten** | Aangeboden diensten |
| **Ruilen** | Ruilaanbod en ruilverzoeken |

### Item identity (data)

Elk feed-item heeft een stabiele identiteit, los van welke chip de gebruiker kiest:

| Veld | Waarden | Rol |
|------|---------|-----|
| **direction** | `OFFER` \| `REQUEST` | Aanbod vs. vraag |
| **kind** | `PRODUCT` \| `SERVICE` \| `INSPIRATION` \| `TASK` \| `BARTER` | Wat het item is |
| **category** | `FOOD` \| `GARDEN` \| `CREATIVE` \| `HELP` | Hoofdcategorie (maps naar Eten, Tuin, Creatief, Hulp & Klusjes) |
| **exchange** | `MONEY` \| `BARTER` \| `RECIPROCITY` \| `CONTACT` | Waarde-uitwisseling |

**category** ↔ hoofdcategorieën:

| Ecosystem V3 | `category` |
|--------------|------------|
| Eten & Drinken | `FOOD` |
| Tuin & Natuur | `GARDEN` |
| Creatief & Gemaakt | `CREATIVE` |
| Hulp & Klusjes | `HELP` |

### Mapping: huidig → taxonomy

Huidige feed (Fase 5B) — afgeleid van bestaande velden:

| Huidig | Taxonomy |
|--------|----------|
| sale + `HOMECHEFF_PAYMENT` | `OFFER` · `PRODUCT` · `MONEY` |
| sale + `CONTACT` | `OFFER` · `PRODUCT` · `CONTACT` |
| inspiration (geen verkoopprijs) | `OFFER` · `INSPIRATION` |

De UI gebruikt vandaag vooral `all` / `sale` / `inspiration` (prijs-gedreven). Dat is **niet** hetzelfde als `direction`; bij uitbreiding worden view filters en item identity gescheiden.

### Mapping: toekomstig (Vraag)

| Scenario | Taxonomy |
|----------|----------|
| klusje gezocht | `REQUEST` · `TASK` · `HELP` |
| bezorging gevraagd | `REQUEST` · `TASK` · `HELP` |
| ruilverzoek | `REQUEST` · `BARTER` |
| wederdienst gezocht | `REQUEST` · `TASK` · `RECIPROCITY` |
| buurtvraag (algemeen) | `REQUEST` · `TASK` · `HELP` |

Toekomstig aanbod (niet gebouwd):

| Scenario | Taxonomy |
|----------|----------|
| dienst aangeboden | `OFFER` · `SERVICE` · `MONEY` of `CONTACT` |
| ruilaanbod | `OFFER` · `BARTER` |

### Advanced filters (later)

Filters zijn **dynamisch per direction + category**, bijvoorbeeld:

- **FOOD:** dieet, allergenen, ophalen/bezorgen, prijs
- **GARDEN:** oogst, planten, seizoen
- **CREATIVE:** maat, materiaal, stijl
- **HELP:** type hulp, datum/tijd, beloning, afstand
- **BARTER / Ruilen:** zoekt, biedt, wederdienst mogelijk

De API-parameter `subfilters` is een voorbereid extensiepunt; implementatie volgt in een latere fase.

### Niet nu bouwen

Deze taxonomy is **documentatie en richting** — geen implementatieverplichting in de huidige fase:

- Vraag (feed-items met `direction: REQUEST`)
- Klusjes
- Ruilen
- Assignment model
- Helpers (als apart platform of profieltype)

Zie [Local Discovery](./HOMECHEFF_LOCAL_DISCOVERY.md) voor geo-readiness en [Delivery Foundation](./HOMECHEFF_DELIVERY_FOUNDATION.md) voor bezorg-fundering.

**Implementatiestatus:** [Feed Taxonomy Foundation (Fase 5D)](./HOMECHEFF_FEED_TAXONOMY.md) — `deriveFeedTaxonomy()`, href resolver, card router, filter registry skeleton. UI-gedrag ongewijzigd (`all` / `sale` / `inspiration`).

---

## Waarde-uitwisseling

HomeCheff ondersteunt:

### Geld

Traditionele betaling.

### Ruilen

Product tegen product.

### Wederdienst

Dienst tegen dienst.

Voorbeelden:

- aardbeien voor maaltijd
- computerhulp voor eten
- tuinonderhoud voor schilderij

---

## Afhandeling

### Direct contact

Via:

- HomeCheff chat
- telefoon
- WhatsApp
- andere kanalen

### HomeCheff betaling

Via HomeCheff checkout.

Voordelen:

- veilige betaling
- orderstatus
- reviews
- affiliate verwerking
- HomeCheff bezorging

---

## Bezorging

Bezorging wordt losgekoppeld van betaling.

**Scenario A:**
HomeCheff betaling → order → bezorging

**Scenario B:**
Direct contact → deal → bezorging aanvragen

Verkopers moeten HomeCheff-bezorgers kunnen inzetten, ook wanneer een verkoop buiten HomeCheff om tot stand is gekomen.

---

## Helpers

Helpers zijn geen apart platform.

Voorbeelden:

- bezorger
- tuinhulp
- digihulp
- klushulp
- buurthulp

Helpers gebruiken:

- hetzelfde profiel
- dezelfde reputatie
- dezelfde reviews
- dezelfde contactopties

---

## Reputatie

Eén reputatie per persoon.

Gebaseerd op:

- reviews
- waardering
- succesvolle opdrachten
- activiteit

---

## Affiliate

Affiliate geldt alleen waar HomeCheff waarde toevoegt.

**Wel:**

- HomeCheff checkout
- abonnementen
- HomeCheff diensten

**Niet:**

- directe WhatsApp-deals
- externe transacties

---

## Premium

Premium draait om zichtbaarheid.

Voorbeelden:

- extra contactopties
- uitgebreid profiel
- featured plaatsingen

Niet om basisfunctionaliteit te blokkeren.

---

## Ontwerpregels

1. Gebruikers zien geen interne systemen.
2. Alles begint bij mensen.
3. Eén profiel per persoon.
4. Bezorging is een dienst.
5. Hulp & Klusjes is een categorie.
6. Waarde kan geld, ruil of wederdienst zijn.

---

## Lange termijn visie

HomeCheff wordt:

"Het digitale dorpsplein van jouw buurt."

Waar bewoners:

- producten verkopen
- diensten aanbieden
- elkaar helpen
- bezorgen
- ruilen
- lokale waarde creëren

Onder één profiel.
Met één reputatie.
Binnen één gemeenschap.

---

## Status

Dit document is de strategische productvisie van HomeCheff.

**Implementatie:** Feed Taxonomy Foundation (Fase 5D) — zie [HOMECHEFF_FEED_TAXONOMY.md](./HOMECHEFF_FEED_TAXONOMY.md).

Nieuwe functies moeten zoveel mogelijk binnen dit model passen.

Wanneer een functie niet binnen dit model past, moet eerst worden beoordeeld of de functie of het model aangepast moet worden.

---

## Gerelateerde documentatie

- [Feed Taxonomy (Fase 5D)](HOMECHEFF_FEED_TAXONOMY.md) — taxonomy helper, href, card router
- [Registratie, bereikbaarheid en contact](HOMECHEFF_REGISTRATION_AND_CONTACT.md) — huidige implementatie richtlijnen (account, bereikbaarheid, betalingen)
