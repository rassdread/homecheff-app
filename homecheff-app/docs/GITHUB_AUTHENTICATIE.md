# GitHub Authenticatie met Cursor

## ❓ Vraag: Ben ik automatisch ingelogd met GitHub als ik met Cursor inlog?

**Antwoord: NEE** - Cursor login en GitHub authenticatie zijn **twee aparte systemen**.

## 🔍 Huidige Configuratie

Je project gebruikt:
- **Remote URL:** `https://github.com/rassdread/homecheff-app.git` (HTTPS)
- **Git User:** `rassdread`
- **Git Email:** `r.sergioarrias@gmail.com`

## 🔐 Hoe GitHub Authenticatie Werkt

### 1. **Cursor Login ≠ GitHub Login**
- Cursor login = toegang tot Cursor features
- GitHub authenticatie = nodig voor `git push`, `git pull`, etc.

### 2. **Huidige Situatie (HTTPS)**
Met HTTPS remote URL moet je bij elke push/pull authenticeren:
- **Personal Access Token (PAT)** - Aanbevolen
- **GitHub Credentials** - Opslaan in credential manager

## ✅ Oplossingen voor GitHub Authenticatie

### **Optie 1: Personal Access Token (Aanbevolen)**

#### Stap 1: Maak een Personal Access Token op GitHub

1. Ga naar: https://github.com/settings/tokens
2. Klik **"Generate new token"** → **"Generate new token (classic)"**
3. Geef een naam: `homecheff-app-development`
4. Selecteer scopes:
   - ✅ `repo` (volledige repository toegang)
   - ✅ `workflow` (als je GitHub Actions gebruikt)
5. Klik **"Generate token"**
6. **⚠️ Kopieer de token direct** (je ziet hem maar 1x!)

#### Stap 2: Gebruik Token bij Git Operaties

**Bij eerste push/pull:**
```bash
git push origin main
# Username: rassdread
# Password: [plak hier je Personal Access Token]
```

**Windows Credential Manager slaat dit automatisch op** voor volgende keren.

#### Stap 3: Verifieer dat het werkt
```bash
git push origin main
# Zou nu zonder prompt moeten werken
```

### **Optie 2: SSH Keys (Alternatief)**

SSH is veiliger en handiger voor dagelijks gebruik.

#### Stap 1: Genereer SSH Key (als je die nog niet hebt)
```bash
# Op Windows (PowerShell)
ssh-keygen -t ed25519 -C "r.sergioarrias@gmail.com"

# Volg de prompts:
# - Bestandslocatie: Enter (gebruik default)
# - Passphrase: Optioneel (voor extra beveiliging)
```

#### Stap 2: Voeg SSH Key toe aan GitHub
```bash
# Kopieer je publieke key
cat ~/.ssh/id_ed25519.pub
# Of op Windows:
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

1. Ga naar: https://github.com/settings/keys
2. Klik **"New SSH key"**
3. **Title:** `Windows PC - HomeCheff Development`
4. **Key:** Plak de publieke key
5. Klik **"Add SSH key"**

#### Stap 3: Verander Remote URL naar SSH
```bash
# Check huidige remote
git remote -v

# Verander naar SSH
git remote set-url origin git@github.com:rassdread/homecheff-app.git

# Verifieer
git remote -v
```

#### Stap 4: Test SSH Connectie
```bash
ssh -T git@github.com
# Moet zeggen: "Hi rassdread! You've successfully authenticated..."
```

### **Optie 3: GitHub CLI (gh)**

Installeer GitHub CLI voor makkelijke authenticatie:

```bash
# Installeer GitHub CLI
# Windows: Download van https://cli.github.com/

# Login
gh auth login

# Volg de prompts:
# - GitHub.com
# - HTTPS
# - Authenticate Git with your GitHub credentials? Yes
```

## 🔄 Werken op Mac

### Na Overzetting naar Mac:

#### Als je Personal Access Token gebruikt:
1. Token is opgeslagen in Windows Credential Manager
2. Op Mac moet je opnieuw authenticeren:
   ```bash
   git push origin main
   # Username: rassdread
   # Password: [plak je Personal Access Token]
   ```
3. macOS Keychain slaat het op voor volgende keren

#### Als je SSH gebruikt:
1. Kopieer je SSH key naar Mac:
   ```bash
   # Op Windows: Kopieer ~/.ssh/id_ed25519 en id_ed25519.pub
   # Op Mac: Plaats in ~/.ssh/
   chmod 600 ~/.ssh/id_ed25519
   chmod 644 ~/.ssh/id_ed25519.pub
   ```
2. Test: `ssh -T git@github.com`

## ✅ Verificatie Checklist

- [ ] Remote URL correct (`git remote -v`)
- [ ] Git user name en email ingesteld
- [ ] Authenticatie werkt (`git push` zonder errors)
- [ ] Credentials opgeslagen (niet elke keer vragen)

## 🚨 Veiligheid Tips

1. **Personal Access Tokens:**
   - ✅ Gebruik minimale scopes (alleen `repo`)
   - ✅ Verwijder oude tokens regelmatig
   - ✅ Nooit committen in code

2. **SSH Keys:**
   - ✅ Gebruik passphrase voor extra beveiliging
   - ✅ Gebruik verschillende keys voor verschillende machines
   - ✅ Verwijder keys van oude machines

3. **Algemeen:**
   - ✅ Gebruik 2FA op GitHub account
   - ✅ Review regelmatig actieve tokens/keys
   - ✅ Nooit tokens delen of committen

## 🐛 Troubleshooting

### "Authentication failed"
```bash
# Check remote URL
git remote -v

# Als HTTPS: gebruik Personal Access Token (niet wachtwoord)
# Als SSH: check SSH key is toegevoegd aan GitHub
```

### "Permission denied (publickey)"
```bash
# Test SSH connectie
ssh -T git@github.com

# Als het niet werkt:
# 1. Check SSH key is toegevoegd aan GitHub
# 2. Check SSH agent draait: ssh-add -l
# 3. Voeg key toe: ssh-add ~/.ssh/id_ed25519
```

### "Repository not found"
- Check of je toegang hebt tot de repository
- Check of remote URL correct is
- Check of je ingelogd bent met juiste GitHub account

### Credentials worden niet opgeslagen (Windows)
```bash
# Configureer credential helper
git config --global credential.helper manager-core
```

### Credentials worden niet opgeslagen (Mac)
```bash
# Configureer credential helper
git config --global credential.helper osxkeychain
```

## 📚 Meer Informatie

- [GitHub: Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub: SSH Keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub CLI](https://cli.github.com/)

## 💡 Aanbeveling

Voor dit project raad ik aan:
1. **Personal Access Token** voor snel starten
2. **SSH Keys** voor langetermijn gebruik (veiliger, handiger)

Beide methoden werken perfect met Cursor en zijn onafhankelijk van Cursor login.

