# Mac Setup Guide - HomeCheff App

Deze guide helpt je om het HomeCheff project op te zetten op een Mac zodat alles blijft werken.

## 📋 Vereisten

### 1. **Node.js** (VERPLICHT)
Het project gebruikt Node.js 18.18.0 (zie `.nvmrc`).

**Optie A: Via Homebrew (Aanbevolen)**
```bash
brew install node@18
```

**Optie B: Via NVM (Node Version Manager) - Aanbevolen voor versiebeheer**
```bash
# Installeer NVM als je het nog niet hebt
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Herstart terminal of run:
source ~/.zshrc  # of ~/.bash_profile

# Installeer en gebruik Node.js 18.18.0
nvm install 18.18.0
nvm use 18.18.0
```

**Check of het werkt:**
```bash
node -v  # Moet 18.18.0 of hoger zijn
npm -v   # Moet 9.0.0 of hoger zijn
```

### 2. **Git** (VERPLICHT)
Meestal al geïnstalleerd op Mac. Check:
```bash
git --version
```

Als het niet geïnstalleerd is:
```bash
brew install git
```

### 3. **Homebrew** (Optioneel maar aanbevolen)
Package manager voor Mac. Installeer via:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 🚀 Project Setup

### Stap 1: Clone of open het project
```bash
cd ~/path/to/homecheff-app
```

### Stap 2: Installeer dependencies
```bash
npm install
```

Dit zal automatisch:
- Alle npm packages installeren
- Prisma client genereren (via `postinstall` script)

### Stap 3: Environment variabelen
Maak een `.env.local` bestand in de root van het project (als je die nog niet hebt):

```bash
# Database
DATABASE_URL="your-database-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Andere environment variabelen...
```

**Let op:** `.env.local` staat in `.gitignore` en wordt niet gecommit.

### Stap 4: Database setup (als nodig)
```bash
# Genereer Prisma client
npx prisma generate

# Run migrations (als je een lokale database hebt)
npx prisma migrate dev
```

### Stap 5: Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## 🔧 Mac-specifieke configuratie

### Shell scripts executable maken
De shell scripts in het project moeten executable zijn:

```bash
chmod +x apply.sh
chmod +x vercel-ignore-build.sh
chmod +x scripts/*.sh
```

### Line endings
Mac gebruikt LF (Line Feed) voor line endings, wat consistent is met Linux. Het project gebruikt al cross-platform tools (`path.join`, `cross-env`), dus dit zou geen probleem moeten zijn.

Als je problemen hebt met line endings:
```bash
# Configureer Git om LF te gebruiken
git config core.autocrlf input
```

### File permissions
Als je problemen hebt met file permissions:
```bash
# Fix permissions voor scripts
find scripts -name "*.sh" -exec chmod +x {} \;
chmod +x apply.sh vercel-ignore-build.sh
```

## 📝 Development Workflow

### Development server
```bash
npm run dev
```

### Build voor productie
```bash
npm run build
```

### Start productie server
```bash
npm run start
```

### Linting
```bash
npm run lint
```

## 🐛 Troubleshooting

### "Permission denied" bij scripts
```bash
chmod +x apply.sh
chmod +x vercel-ignore-build.sh
chmod +x scripts/*.sh
```

### "Command not found: node" of verkeerde Node versie
```bash
# Gebruik NVM om de juiste versie te selecteren
nvm use 18.18.0

# Of installeer NVM als je het nog niet hebt (zie boven)
```

### Prisma errors
```bash
# Regenerate Prisma client
npx prisma generate

# Check Prisma versie
npx prisma --version
```

### Port 3000 al in gebruik
```bash
# Zoek wat poort 3000 gebruikt
lsof -ti:3000

# Kill het proces
kill -9 $(lsof -ti:3000)

# Of gebruik een andere poort
PORT=3001 npm run dev
```

### "EACCES: permission denied" bij npm install
```bash
# Fix npm permissions (gebruik geen sudo!)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Build errors met "lightningcss" of "@tailwindcss"
Dit zijn bekende issues die al opgelost zijn in `next.config.mjs`. Als je ze toch ziet:
```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

## 🔄 Werken met Git

### Line endings configureren
```bash
# Voor dit project: gebruik LF (Unix style)
git config core.autocrlf input
```

### .DS_Store bestanden negeren
`.DS_Store` staat al in `.gitignore`, maar als je ze al gecommit hebt:
```bash
# Verwijder alle .DS_Store bestanden uit Git
find . -name .DS_Store -print0 | xargs -0 git rm --ignore-unmatch
git commit -m "Remove .DS_Store files"
```

## 📦 Deployment naar Vercel

### Via Vercel CLI
```bash
# Installeer Vercel CLI (als je het nog niet hebt)
npm i -g vercel

# Login
vercel login

# Deploy naar productie
vercel --prod
```

**Belangrijk:** Gebruik altijd `vercel --prod` voor deployment, niet `git push` naar GitHub (zie memory).

## 🎨 Cursor IDE Setup

### Aanbevolen extensies
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features (standaard)

### Settings
Cursor zou automatisch de TypeScript configuratie moeten detecteren. Als je errors ziet:
1. Open Command Palette (Cmd+Shift+P)
2. Type "TypeScript: Restart TS Server"
3. Selecteer de optie

## ✅ Checklist voor eerste keer opzetten

- [ ] Node.js 18.18.0+ geïnstalleerd
- [ ] Git geïnstalleerd
- [ ] Project gecloned/geopend
- [ ] `npm install` uitgevoerd
- [ ] `.env.local` aangemaakt (als nodig)
- [ ] `npx prisma generate` uitgevoerd (als database nodig is)
- [ ] Shell scripts executable gemaakt (`chmod +x`)
- [ ] `npm run dev` werkt
- [ ] Browser opent op http://localhost:3000

## 🔍 Verschillen tussen Windows en Mac

### Scripts
- **Windows:** Gebruikt `apply.ps1` (PowerShell)
- **Mac:** Gebruikt `apply.sh` (Bash)

Beide scripts doen hetzelfde, maar zijn platform-specifiek.

### Path separators
- **Windows:** Gebruikt `\` (backslash)
- **Mac/Linux:** Gebruikt `/` (forward slash)

Het project gebruikt `path.join()` overal, wat automatisch het juiste scheidingsteken gebruikt.

### Environment variables
- **Windows:** Via System Properties of PowerShell
- **Mac:** Via `~/.zshrc` of `~/.bash_profile`

Voor dit project: gebruik `.env.local` (werkt op beide platforms).

## 📚 Meer informatie

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

## 💡 Tips

1. **Gebruik NVM** voor Node.js versiebeheer - makkelijker om tussen projecten te switchen
2. **Gebruik `.env.local`** voor lokale environment variabelen - wordt niet gecommit
3. **Clean build bij problemen:** `rm -rf .next node_modules && npm install`
4. **Check Node versie regelmatig:** `node -v` moet 18.18.0+ zijn
5. **Gebruik `npm run dev`** voor development - hot reload werkt automatisch





