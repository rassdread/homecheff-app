# 🚀 Deployment Gids

## Snelle Deployment Commando's

### 1. **Volledige Deploy** (Build + Commit + Push + Vercel)
```bash
npm run deploy
```
Dit doet:
- ✅ Build de applicatie
- ✅ Commit alle changes met timestamp
- ✅ Push naar GitHub
- ✅ Deploy naar Vercel Production

### 2. **Snelle Deploy** (alleen Vercel, zonder build/git)
```bash
npm run deploy:quick
```
Gebruik dit als je al hebt gebuild en gepusht.

### 3. **Preview Deploy** (test environment)
```bash
npm run deploy:preview
```
Maakt een preview deployment aan zonder production te wijzigen.

---

## PowerShell Script (aanbevolen voor Windows)

### Basis gebruik:
```powershell
.\scripts\deploy.ps1
```

### Met custom commit message:
```powershell
.\scripts\deploy.ps1 -message "Fixed chat bug"
```

### Skip build (als je al gebuild hebt):
```powershell
.\scripts\deploy.ps1 -skipBuild
```

### Preview deployment:
```powershell
.\scripts\deploy.ps1 -preview
```

---

## Directe Vercel Commando's

### Production:
```bash
vercel --prod
```

### Preview:
```bash
vercel
```

### Met specifieke omgeving:
```bash
vercel --target preview
vercel --target production
```

---

## Workflow Voorbeelden

### 🔥 Hotfix (super snel):
```bash
# 1. Fix maken
# 2. Direct deployen
npm run deploy:quick
```

### 🎨 Nieuwe feature:
```bash
# 1. Code schrijven
# 2. Testen lokaal met: npm run dev
# 3. Build + deploy alles
npm run deploy
```

### 🧪 Testen voor production:
```bash
# 1. Maak preview
npm run deploy:preview
# 2. Test de preview URL
# 3. Als goed: npm run deploy:quick
```

---

## Troubleshooting

### Build errors:
```bash
# Clean build
rm -r -fo .next
npm run build
```

### Git conflicts:
```bash
git pull origin main
# Los conflicts op
npm run deploy
```

### Vercel authentication:
```bash
vercel login
```

---

## Tips 💡

1. **Gebruik `npm run deploy:quick`** als je snel wilt deployen zonder build
2. **Test altijd lokaal eerst** met `npm run dev`
3. **Check Vercel dashboard** voor deployment status
4. **Preview eerst** bij grote changes: `npm run deploy:preview`

---

## Sneltoetsen Setup (optioneel)

Voeg dit toe aan je PowerShell profile (`$PROFILE`):

```powershell
# HomeCheff aliases
function hc-dev { npm run dev }
function hc-deploy { npm run deploy }
function hc-quick { npm run deploy:quick }
function hc-preview { npm run deploy:preview }
```

Dan kun je gewoon typen:
```bash
hc-deploy      # Volledige deployment
hc-quick       # Snelle deployment
hc-preview     # Preview deployment
```

