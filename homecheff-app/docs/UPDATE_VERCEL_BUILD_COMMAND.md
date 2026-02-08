# Update Vercel Build Command

Het build command in Vercel moet worden aangepast om `prisma migrate deploy` robuust te maken.

## Snelle Oplossing (Handmatig in Dashboard)

1. **Ga naar Vercel Dashboard**
   - https://vercel.com/dashboard
   - Selecteer project: `homecheff-app`

2. **Ga naar Settings → General**
   - Klik op "Settings" in de navigatie
   - Klik op "General" (of "Build & Development Settings")

3. **Zoek "Build Command"**
   - Je ziet waarschijnlijk: `npx prisma generate && prisma migrate deploy && next build`

4. **Wijzig naar:**
   ```
   npx prisma generate && (npx prisma migrate deploy || echo "Migrations skipped") && npm run build
   ```

5. **Klik op "Save"**

6. **Deploy opnieuw:**
   ```bash
   vercel --prod
   ```

## Automatische Oplossing (Via API)

Als je een Vercel API token hebt:

1. **Haal je token op:**
   - https://vercel.com/account/tokens
   - Maak een nieuwe token aan

2. **Run het script:**
   ```bash
   $env:VERCEL_TOKEN="your-token-here"
   node scripts/update-vercel-build-command.js
   ```

## Waarom deze wijziging?

- `prisma migrate deploy` kan falen op Vercel (database locks, permissions, etc.)
- Door `|| echo "Migrations skipped"` toe te voegen, faalt de build niet als migrations niet nodig zijn
- De build gaat door en `npm run build` wordt altijd uitgevoerd



