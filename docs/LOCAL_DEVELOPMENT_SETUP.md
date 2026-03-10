# Lokale Ontwikkeling Setup

## Dev op Mac én iPhone (localhost + thuis-wifi)

Eén commando werkt voor beide:

```bash
npm run dev
```

- **Op je Mac:** open **http://localhost:3000**
- **Op je iPhone (zelfde wifi of hotspot):** open **http://[Mac-IP]:3000** (vervang [Mac-IP] door het IP hieronder)

Het dev-script luistert al op alle interfaces (`-H 0.0.0.0`), dus de server is bereikbaar vanaf je telefoon zolang die op hetzelfde netwerk zit.

### Mac-IP bepalen

```bash
ipconfig getifaddr en0
```

(of `ifconfig | grep "inet "` als en0 niets geeft)

### Inloggen op iPhone

Zet in `.env.local` het IP van je Mac op het netwerk waar je iPhone op zit:

```env
NEXTAUTH_URL=http://192.168.1.5:3000
```

(Vervang door het IP van `ipconfig getifaddr en0`.)

- Als je alleen op je Mac werkt, kun je `NEXTAUTH_URL=http://localhost:3000` gebruiken.
- Met `trustHost: true` in NextAuth werkt sessie op zowel localhost als op het ingestelde IP.

### Telefoon bereikt geen lokale server – checklist

Als je op je telefoon **http://[Mac-IP]:3000** opent en de pagina laadt niet:

1. **Zelfde netwerk** – Telefoon en Mac moeten op hetzelfde wifi (of hotspot) zitten.
2. **Juiste URL op telefoon** – Gebruik het **LAN-IP** van je Mac (bijv. `http://192.168.1.228:3000`), **niet** `localhost` (dat is op de telefoon de telefoon zelf).
3. **Dev-server draait** – Start op de Mac: `npm run dev`. Wacht tot je “Ready” ziet.
4. **Firewall** – macOS kan poort 3000 blokkeren. Controleer: Systeeminstellingen → Netwerk → Firewall. Voeg Node toe of sta tijdelijke toegang toe voor development.
5. **NEXTAUTH_URL** – Zet in `.env.local`: `NEXTAUTH_URL=http://[Mac-IP]:3000` (zelfde IP als in de browser op de telefoon), anders faalt inloggen.
6. **Andere poort in gebruik** – Als 3000 bezet is, stop het andere proces of gebruik een andere poort (bijv. `next dev -p 3001 -H 0.0.0.0` en open dan `http://[Mac-IP]:3001` op de telefoon).

**Production build lokaal testen vanaf telefoon:** na `npm run build` kun je `npm run start:lan` gebruiken zodat de server op alle interfaces luistert; open op de telefoon weer `http://[Mac-IP]:3000`.

---

## Foto Upload Setup

Voor lokale ontwikkeling met foto uploads, heb je twee opties:

### Optie 1: Vercel Blob Storage (Aanbevolen)

1. Maak een Vercel account aan (gratis)
2. Maak een nieuw project aan in Vercel
3. Ga naar Project Settings > Environment Variables
4. Voeg `BLOB_READ_WRITE_TOKEN` toe met je Vercel Blob token
5. Of voeg het toe aan je `.env.local` bestand:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### Optie 2: Base64 Fallback (Alleen voor kleine foto's)

Als je geen `BLOB_READ_WRITE_TOKEN` hebt ingesteld, gebruikt de app automatisch base64 encoding als fallback. 

**Let op:** Base64 encoding maakt bestanden ~33% groter. Next.js heeft een limiet van ~10MB voor request bodies (aangepast van 4.5MB). Dit betekent:
- Maximaal 2-3 foto's per review (afhankelijk van grootte)
- Foto's moeten gecomprimeerd zijn (< 3MB elk voor meerdere foto's)

### Problemen met Base64?

Als je "request entity too large" of "413" errors krijgt:
1. Gebruik kleinere foto's (< 1MB elk)
2. Of stel `BLOB_READ_WRITE_TOKEN` in (zie Optie 1)

## Database Setup

Zorg ervoor dat de `DishReview` en `DishReviewImage` tabellen bestaan:

```bash
npx prisma db push
```

Of voer de migratie handmatig uit:
```bash
cat prisma/migrations/add_dish_reviews/migration.sql | npx prisma db execute --stdin --schema prisma/schema.prisma
```

