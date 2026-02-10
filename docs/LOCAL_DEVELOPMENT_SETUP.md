# Lokale Ontwikkeling Setup

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

