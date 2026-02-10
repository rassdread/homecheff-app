# Veiligheid Checklist - Voor Overzetting

Gebruik deze checklist VOORDAT je het project overzet naar Mac of naar Git pusht.

## ✅ Pre-Commit Checklist

### 1. Check Git Status
```bash
git status
```

**Zorg dat deze NIET in de lijst staan:**
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `*.key`
- ❌ `*_KEYS.txt`
- ❌ `STRIPE_KEYS.txt`

### 2. Check Wat Je Gaat Committen
```bash
# Zie exacte wijzigingen
git diff --cached

# Check specifiek op .env bestanden
git status | grep -i env
```

Als je `.env` bestanden ziet, verwijder ze:
```bash
git reset HEAD .env.local  # Unstage
# Zorg dat .env.local in .gitignore staat
```

### 3. Check op Gevoelige Data in Code

Zoek naar hardcoded secrets:
```bash
# Zoek naar mogelijke API keys
grep -r "sk_live\|sk_test\|pk_live\|pk_test" --exclude-dir=node_modules .
grep -r "AIza\|AIzaSy" --exclude-dir=node_modules .
grep -r "xoxb-\|xoxp-" --exclude-dir=node_modules .
```

**Als je matches vindt:** Verwijder ze en gebruik environment variabelen!

### 4. Verifieer .gitignore

Check of `.gitignore` deze bevat:
```bash
cat .gitignore | grep -E "\.env|node_modules|\.next"
```

## 🔐 Environment Variabelen Backup

**BELANGRIJK:** Backup je `.env.local` VOORDAT je overzet!

### Veilige Backup Methoden:

1. **Password Manager** (Aanbevolen)
   - 1Password, Bitwarden, LastPass
   - Maak een "Secure Note" met alle environment variabelen

2. **Encrypted File**
   ```bash
   # Op Windows (PowerShell):
   # Kopieer .env.local naar een encrypted locatie
   # Gebruik BitLocker of VeraCrypt voor encryptie
   ```

3. **Cloud Storage (Encrypted)**
   - Upload naar encrypted cloud storage
   - Gebruik tools zoals Cryptomator

4. **Handmatig Kopiëren**
   - Open `.env.local`
   - Kopieer inhoud naar een veilige locatie
   - Verwijder het bestand na backup

## 🚨 Wat Te Doen Als Je Per Ongeluk Secrets Gecommit Hebt

### Stap 1: Verwijder Direct van Remote
```bash
# Verwijder bestand van Git (maar behoud lokaal)
git rm --cached .env.local

# Commit de verwijdering
git commit -m "Remove sensitive .env file"

# Force push (LET OP: dit overschrijft remote history)
git push origin main --force
```

### Stap 2: Rotate Alle Secrets
**BELANGRIJK:** Als secrets al gepusht zijn:
1. **Genereer nieuwe API keys** voor alle services
2. **Update environment variabelen** op alle machines
3. **Verwijder oude keys** uit de services

### Stap 3: Check Git History
```bash
# Zie alle commits die .env bevatten
git log --all --full-history -- .env.local
```

Als je deze moet verwijderen uit history (geavanceerd):
```bash
# Gebruik git filter-branch of BFG Repo-Cleaner
# Zie: https://help.github.com/articles/removing-sensitive-data-from-a-repository/
```

## ✅ Pre-Push Checklist

Voordat je `git push` doet:

- [ ] `git status` toont geen `.env` bestanden
- [ ] Geen hardcoded API keys in code
- [ ] `.env.local` is gebackupt op veilige locatie
- [ ] `.gitignore` bevat alle `.env*` patterns
- [ ] Test lokaal: `npm run build` werkt
- [ ] Geen persoonlijke bestanden in commit

## 📋 Quick Safety Commands

```bash
# Check wat je gaat committen
git diff --cached --name-only

# Check op .env bestanden
git ls-files | grep -E "\.env"

# Verwijder .env uit staging (als per ongeluk toegevoegd)
git reset HEAD .env.local

# Zie laatste commits (check op secrets)
git log -p -5

# Check .gitignore werkt
git check-ignore -v .env.local
# Moet output geven, anders werkt .gitignore niet
```

## 🔄 Workflow voor Veilige Overzetting

1. **Op Windows (voor overzetting):**
   ```bash
   # 1. Backup .env.local
   # 2. Check git status
   git status
   # 3. Commit alleen code (geen .env)
   git add .
   git commit -m "Wijzigingen"
   # 4. Push
   git push origin main
   ```

2. **Op Mac (na clone):**
   ```bash
   # 1. Clone project
   git clone <url> homecheff-app
   # 2. Maak .env.local handmatig
   # 3. Plak environment variabelen uit backup
   # 4. Installeer dependencies
   npm install
   ```

## 💡 Best Practices

1. **Gebruik altijd environment variabelen** - nooit hardcode secrets
2. **Test lokaal eerst** - voordat je pusht
3. **Review commits** - gebruik `git log -p` om te zien wat er verandert
4. **Gebruik branches** - voor experimentele features
5. **Rotate secrets regelmatig** - vooral als je denkt dat ze gelekt zijn

## 🆘 Hulp Nodig?

Als je twijfelt of iets veilig is om te committen:
- **Wanneer in twijfel: commit het NIET**
- Check de `.gitignore` file
- Vraag om hulp voordat je pusht

## 📚 Meer Informatie

- [GitHub: Removing sensitive data](https://help.github.com/articles/removing-sensitive-data-from-a-repository/)
- [OWASP: Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key)
- [Project Overzetten Guide](PROJECT_OVERZETTEN_MAC.md)





