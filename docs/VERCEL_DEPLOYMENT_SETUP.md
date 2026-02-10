# Vercel Deployment Setup

## Automatische Deployments Uitschakelen

Vercel heeft geen directe optie om automatische deployments uit te schakelen. We gebruiken een "Ignore Build Step" script dat builds negeert, tenzij je expliciet een deployment wilt.

### Hoe het werkt:

1. **Standaard**: Alle git pushes worden genegeerd (geen deployment)
2. **Om te deployen**: Voeg `[DEPLOY]` toe aan je commit message
3. **Of**: Zet environment variable `FORCE_DEPLOY=true` in Vercel

### Ignore Build Step Script:

Het script `vercel-ignore-build.js` controleert:
- ✅ Als commit message `[DEPLOY]` bevat → build wordt uitgevoerd
- ✅ Als `FORCE_DEPLOY=true` → build wordt uitgevoerd  
- ❌ Anders → build wordt genegeerd

### Configuratie in Vercel Dashboard:

1. **Ga naar Vercel Dashboard**
   - https://vercel.com/dashboard
   - Selecteer je project: `homecheff-app`

2. **Ga naar Settings → Git**
   - Klik op "Settings" in de navigatie
   - Klik op "Git" in het menu

3. **Scroll naar "Ignore Build Step"**
   - Voeg toe: `node vercel-ignore-build.js`
   - Of gebruik: `./vercel-ignore-build.sh` (als je bash gebruikt)

4. **Save Changes**
   - Klik op "Save" om de wijzigingen op te slaan

## Handmatige Deployment

Na het uitschakelen van automatische deployments, deploy je handmatig via:

### Optie 1: Via Vercel CLI (Aanbevolen)
```bash
# Production deployment
vercel --prod

# Preview deployment
vercel
```

### Optie 2: Via Vercel Dashboard
1. Ga naar je project
2. Klik op "Deployments"
3. Klik op "Deploy" → "Deploy from Git"
4. Selecteer branch en commit
5. Klik op "Deploy"

## Voordelen van Handmatige Deployments

- ✅ Geen onverwachte deployments bij elke git push
- ✅ Meer controle over wanneer er wordt gedeployed
- ✅ Kan eerst lokaal testen voordat je deployed
- ✅ Minder deployment failures door automatische triggers

## Belangrijk

Na het uitschakelen van automatische deployments:
- Je moet handmatig deployen via `vercel --prod` of Vercel Dashboard
- Git pushes zullen geen automatische deployment meer triggeren
- Je kunt altijd weer automatische deployments inschakelen als je wilt

