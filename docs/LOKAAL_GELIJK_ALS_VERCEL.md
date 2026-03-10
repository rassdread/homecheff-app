# Lokale versie weer gelijk maken aan wat op Vercel werkt

Je hebt **rechtstreeks naar Vercel** gedeployed vanaf je oude Mac, daarna de hele repo gezipt, hier uitgepakt en opnieuw aan het installeren. **Lokaal krijg je weer fouten die eigenlijk al hersteld waren** op de oude Mac / op Vercel.

**Twee mogelijke oorzaken:**
1. **De zip is niet de gefixte versie** – van een ander moment of andere map, dus de fixes zitten niet in de code die je nu hebt.
2. **De omgeving hier verschilt** – andere Node-versie, andere `node_modules`, oude `.next`-cache. De code is goed, maar lokaal gedraagt het zich anders (bijv. Node 25 i.p.v. 18).

Hieronder: eerst omgeving gelijk trekken (vaak lost dat het al op); anders de juiste codebron zoeken.

## Kan je de “Vercel-versie” downloaden?

**Nee.** Vercel biedt geen knop of API om de **broncode** van een deployment terug te halen. Wat je wél kunt doen:

1. **Lokaal zo veel mogelijk op “productie” laten lijken** (zelfde dependencies,zelfde Node, schone build) – zie hieronder.
2. **Als je nog toegang hebt tot de oude Mac** (of een andere backup van de map **van het moment dat je die deploy deed**): die map opnieuw zippen en op de nieuwe Mac gebruiken. Dat ís de versie die op Vercel draait.
3. **Als je ooit vanaf die oude Mac naar Git hebt gepusht** vóór die deploy: dan staat die werkende versie op GitHub. Na SSH/token instellen: `git fetch origin` en `git reset --hard origin/main` (of de juiste branch) om die versie lokaal te krijgen.

---

## Stap 1: Lokaal “productie-gelijk” maken (aanbevolen eerst proberen)

Vaak komt het verschil door: andere Node-versie, andere `node_modules`, oude/corrupte `.next`-cache, of ontbrekende/afwijkende env. Dit brengt je lokaal dicht bij wat Vercel bouwt en draait.

### 1.1 Node 18 gebruiken (zoals op Vercel)

Het project verwacht Node 18 (`.nvmrc` en `package.json` engines). Op de nieuwe Mac staat vaak Node 20/25; dat kan ander gedrag geven.

```bash
# Optie A: nvm (als je dat hebt)
nvm install 18
nvm use 18
node -v   # moet v18.x zijn

# Optie B: Homebrew
brew install node@18
# En in je shell PATH: export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
```

### 1.2 Schone installatie en build (zoals Vercel)

In de projectmap:

```bash
cd /Users/sergioarrias/Homecheff-app

# Alles weggooien wat van de zip/OneDrive kan afwijken
rm -rf node_modules .next

# Exact dezelfde dependencies als in package-lock.json (zoals Vercel)
npm ci

# Prisma client (Vercel doet dit ook)
npx prisma generate

# Zelfde build als op Vercel
npm run build
```

Daarna lokaal testen:

```bash
npm run dev
# of
npm run start
```

- **`npm run dev`** = development server (hot reload).
- **`npm run start`** = production build lokaal draaien (meest vergelijkbaar met Vercel).

### 1.3 .env.local controleren

Op Vercel draait de app met de **Environment Variables** uit het Vercel-dashboard. Lokaal gebruik je `.env.local`. Als iets “niet klopt” (bijv. inloggen, API’s, domeinen):

- Vergelijk in [Vercel → Project → Settings → Environment Variables] welke variabelen er voor **Production** staan.
- Zet in `.env.local` dezelfde **namen** en voor lokaal passende **waarden** (bijv. `NEXTAUTH_URL=http://localhost:3000`, dezelfde `DATABASE_URL` als productie als je dezelfde DB wilt gebruiken, etc.).

Daarmee gedraagt je lokale app zich zo veel mogelijk als op Vercel.

---

## Stap 2: Als je de oude Mac of een backup nog hebt

De **exacte** versie die op Vercel draait, is de code die op je **oude Mac** stond op het moment dat je `vercel --prod` (of je deploy-commando) uitvoerde.

- **Backup van die map** (bijv. op de oude Mac opnieuw zippen, of Time Machine / andere backup van die map): die map op de nieuwe Mac uitpakken en als je projectmap gebruiken. Dan heb je “die versie weer op je schijf”.
- Daarna kun je die map opnieuw aan Git koppelen en pushen als backup (zie `docs/SETUP_NA_BACKUP_GIT_VERCEL.md` sectie 6).

---

## Stap 3: Als die versie ooit naar Git is gepusht

Als je vanaf de oude Mac ooit `git push` hebt gedaan (naar dezelfde repo die je nu gebruikt), staat die werkende versie op GitHub.

1. **GitHub-toegang op de nieuwe Mac** instellen (SSH of token), zie `docs/SETUP_NA_BACKUP_GIT_VERCEL.md` (Toegang instellen).
2. In de projectmap:
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```
   Dan is je lokale map exact gelijk aan wat op `origin/main` staat (de versie die je ooit hebt gepusht).
3. Daarna weer `npm ci`, `npx prisma generate`, `npm run build` zoals in stap 1.2.

---

## Samenvatting

| Situatie | Wat doen |
|----------|----------|
| Alleen nieuwe Mac, zip van oude map | Stap 1: Node 18, `npm ci`, schone `.next`, zelfde env → lokaal “productie-gelijk” maken. |
| Oude Mac of backup van map op moment van deploy | Stap 2: Die map gebruiken = exact de Vercel-versie weer op je schijf; daarna eventueel naar Git pushen. |
| Ooit naar GitHub gepusht vanaf oude Mac | Stap 3: Toegang instellen, `git fetch` + `git reset --hard origin/main` → die versie lokaal; daarna `npm ci` en build. |

Vercel zelf kan de broncode van een deployment niet teruggeven; je moet die versie dus hebben van je oude machine, van Git, of je maakt lokaal zo goed mogelijk gelijk met productie (stap 1).
