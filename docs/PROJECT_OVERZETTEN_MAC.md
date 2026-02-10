# Project Veilig Overzetten naar Mac

Deze guide helpt je om het HomeCheff project veilig van Windows naar Mac over te zetten.

## ⚠️ Belangrijk: Veiligheid Eerst

**NOOIT committen:**
- `.env` of `.env.local` bestanden (bevatten API keys en secrets)
- `node_modules/` (te groot, wordt automatisch geïnstalleerd)
- `.next/` build folder (wordt automatisch gegenereerd)
- Persoonlijke bestanden of keys

## 📋 Stap-voor-stap Overzetting

### Stap 1: Commit en Push Wijzigingen (op Windows)

Voordat je naar Mac overzet, zorg dat alle belangrijke wijzigingen veilig opgeslagen zijn:

```bash
# Check status
git status

# Voeg nieuwe bestanden toe (maar NIET .env bestanden!)
git add .

# Commit wijzigingen
git commit -m "Wijzigingen voor Mac overzetting"

# Push naar remote repository
git push origin main
```

**Let op:** Als je `.env` bestanden hebt, commit deze NIET! Deze bevatten gevoelige informatie.

### Stap 2: Verifieer Remote Repository

Controleer dat alles gepusht is:

```bash
# Check remote status
git remote -v

# Check laatste commits
git log --oneline -5
```

### Stap 3: Clone op Mac

Op je Mac, open Terminal en navigeer naar waar je het project wilt hebben:

```bash
# Navigeer naar gewenste locatie
cd ~/Projects  # of waar je projecten bewaart

# Clone het project
git clone <jouw-repository-url> homecheff-app

# Of als je al een repository URL hebt:
# git clone https://github.com/jouw-username/homecheff-app.git
```

**Als je de repository URL niet weet:**
```bash
# Op Windows, check de remote URL:
git remote get-url origin
```

### Stap 4: Environment Variabelen Overzetten (BELANGRIJK!)

**⚠️ CRITIEK:** Environment variabelen worden NIET via Git overgezet. Je moet deze handmatig kopiëren.

#### Op Windows:
1. Open het `.env.local` bestand (of `.env`) in de project root
2. Kopieer de inhoud (zonder de bestandsnaam te committen!)

#### Op Mac:
1. Maak een nieuw `.env.local` bestand in de project root:
```bash
cd ~/Projects/homecheff-app
touch .env.local
```

2. Open het bestand in een editor:
```bash
nano .env.local
# of
code .env.local  # als je VS Code hebt
```

3. Plak de environment variabelen die je op Windows had

4. Sla op en sluit af (in nano: Ctrl+X, dan Y, dan Enter)

**Voorbeeld `.env.local` structuur:**
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="jouw-secret-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."

# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."

# Andere API keys...
```

### Stap 5: Installeer Dependencies op Mac

```bash
# Zorg dat je in de project directory bent
cd ~/Projects/homecheff-app

# Installeer Node.js versie (als je NVM gebruikt)
nvm use  # Dit leest .nvmrc en gebruikt Node 18.18.0

# Installeer dependencies
npm install
```

Dit zal automatisch:
- Alle npm packages installeren
- Prisma client genereren (via `postinstall` script)

### Stap 6: Database Setup (als nodig)

Als je een lokale database gebruikt:

```bash
# Genereer Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

Als je een remote database gebruikt (zoals Neon, Supabase):
- Zorg dat `DATABASE_URL` in `.env.local` correct is
- Run alleen: `npx prisma generate`

### Stap 7: Test of Alles Werkt

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### Stap 8: Maak Shell Scripts Executable

```bash
# Maak shell scripts uitvoerbaar
chmod +x apply.sh
chmod +x vercel-ignore-build.sh
chmod +x scripts/*.sh
```

## 🔄 Werken op Beide Platforms

**✅ Ja, je kunt op beide machines blijven bouwen!** Het project is volledig cross-platform.

Zie [Werken op Beide Platforms](WERKEN_OP_BEIDE_PLATFORMS.md) voor de complete workflow guide.

### Quick Workflow:

1. **Voor je stopt met werken (op Windows of Mac):**
   ```bash
   git add .
   git commit -m "Beschrijving van wijzigingen"
   git push origin main
   ```

2. **Voor je begint met werken (op andere machine):**
   ```bash
   git pull origin main
   npm install  # Als er nieuwe dependencies zijn
   npm run dev
   ```

3. **Environment variabelen:**
   - Zorg dat `.env.local` op beide machines hetzelfde is
   - Commit deze NIET naar Git
   - Gebruik een password manager of veilige cloud storage voor backup

## 🛡️ Veiligheid Checklist

Voordat je commit en push, check:

- [ ] Geen `.env` of `.env.local` in `git add`
- [ ] Geen API keys of secrets in code
- [ ] Geen `node_modules/` gecommit
- [ ] Geen `.next/` build folder gecommit
- [ ] Geen persoonlijke bestanden (foto's, documenten)
- [ ] `.gitignore` bevat alle gevoelige bestanden

### Check wat je gaat committen:

```bash
# Zie wat er gecommit wordt
git status

# Zie exacte wijzigingen
git diff

# Check of .env bestanden per ongeluk toegevoegd zijn
git status | grep env
```

## 🚨 Troubleshooting

### "Permission denied" bij scripts op Mac
```bash
chmod +x apply.sh vercel-ignore-build.sh scripts/*.sh
```

### "Command not found: node" op Mac
```bash
# Installeer Node.js via NVM (zie MAC_SETUP.md)
nvm install 18.18.0
nvm use 18.18.0
```

### Database connection errors
- Check of `DATABASE_URL` in `.env.local` correct is
- Check of je database toegankelijk is vanaf je Mac (firewall, IP whitelist)

### "Module not found" errors
```bash
# Herinstalleer dependencies
rm -rf node_modules package-lock.json
npm install
```

### Git merge conflicts
Als je op beide machines werkt en er zijn conflicten:
```bash
# Pull met rebase
git pull --rebase origin main

# Los conflicten op, dan:
git add .
git rebase --continue
```

## 📦 Alternatieve Methoden (als Git niet werkt)

### Methode 1: USB/Externe Drive
1. Kopieer de hele project folder naar USB
2. Zorg dat je `.env.local` apart kopieert (niet in de folder)
3. Op Mac: kopieer folder naar gewenste locatie
4. Voeg `.env.local` handmatig toe

**Let op:** Dit kopieert ook `node_modules/` wat groot kan zijn. Beter:
```bash
# Op Windows, maak een archive zonder node_modules
# (of gebruik .gitignore en commit alleen source code)
```

### Methode 2: Cloud Storage (Dropbox, Google Drive, etc.)
1. Upload project folder naar cloud
2. Download op Mac
3. **Belangrijk:** Verwijder `node_modules/` en `.next/` voordat je upload
4. Run `npm install` op Mac

### Methode 3: SSH/SCP (als beide machines opzelfde netwerk)
```bash
# Van Mac naar Windows (als Windows SSH heeft)
scp -r gebruiker@windows-ip:/pad/naar/homecheff-app ~/Projects/

# Of gebruik SFTP client zoals FileZilla
```

## ✅ Verificatie Checklist

Na overzetting, check:

- [ ] Project gecloned op Mac
- [ ] `.env.local` aangemaakt met alle variabelen
- [ ] `npm install` succesvol uitgevoerd
- [ ] `npx prisma generate` succesvol
- [ ] `npm run dev` start zonder errors
- [ ] Website laadt op http://localhost:3000
- [ ] Shell scripts zijn executable
- [ ] Git remote correct geconfigureerd

## 💡 Tips

1. **Gebruik altijd Git** voor code - veiliger en makkelijker
2. **Backup `.env.local`** in een password manager (1Password, Bitwarden, etc.)
3. **Gebruik branches** voor experimentele features
4. **Commit regelmatig** - kleine commits zijn beter dan grote
5. **Test altijd** na `git pull` of na overzetting

## 📦 Deployment naar Vercel

### Je Huidige Workflow (Handmatig via Vercel CLI)

**Belangrijk:** Je gebruikt handmatige deployments via `vercel --prod`, niet automatische Git deployments.

**Op Windows of Mac:**
```bash
# 1. Push code naar GitHub (geen automatische deployment!)
git add .
git commit -m "Beschrijving van wijzigingen"
git push origin main

# 2. Deploy handmatig naar Vercel (als je wilt)
vercel --prod
```

**Wat gebeurt er:**
- ✅ `git push` = alleen code naar GitHub (geen automatische deployment)
- ✅ `vercel --prod` = handmatige deployment naar productie
- ✅ `.env.local` = wordt automatisch genegeerd door `.gitignore` (wordt NIET gecommit)

### Automatische Deployments zijn UIT

Je `vercel.json` heeft:
```json
"git": {
  "deploymentEnabled": false
}
```

Dit betekent:
- ❌ Git push triggert GEEN automatische deployment
- ✅ Je hebt volledige controle over wanneer je deployed
- ✅ Je kunt eerst lokaal testen voordat je deployed

### Vercel CLI Setup (als je het nog niet hebt)

```bash
# Installeer Vercel CLI
npm i -g vercel

# Login (eenmalig)
vercel login

# Deploy commando's
vercel --prod    # Productie deployment
vercel           # Preview deployment
```

## 📚 Gerelateerde Documenten

- [Mac Setup Guide](MAC_SETUP.md) - Voor eerste keer Mac setup
- [GitHub Authenticatie](GITHUB_AUTHENTICATIE.md) - Hoe GitHub login werkt met Cursor
- [Werken op Beide Platforms](WERKEN_OP_BEIDE_PLATFORMS.md) - Workflow voor Windows + Mac
- [Android App Setup](ANDROID_APP_BENODIGDHEDEN.md) - Voor Android development

## 🔐 Security Best Practices

1. **Nooit committen:**
   - API keys
   - Database passwords
   - Stripe keys
   - OAuth secrets
   - Private keys

2. **Gebruik environment variabelen** voor alle secrets

3. **Gebruik `.env.local`** (staat in `.gitignore`)

4. **Review commits** voordat je pusht:
   ```bash
   git log -p origin/main..HEAD
   ```

5. **Gebruik Git hooks** om per ongeluk committen te voorkomen:
   ```bash
   # .git/hooks/pre-commit kan checken op .env bestanden
   ```

