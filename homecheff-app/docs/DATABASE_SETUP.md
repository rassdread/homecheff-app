# Database Setup voor Vercel

## Probleem
Vercel kan niet verbinden met de Neon database. Dit komt omdat:
1. Environment variables niet zijn ingesteld
2. Database server is niet bereikbaar vanaf Vercel

## Oplossing 1: Environment Variables Instellen

### In Vercel Dashboard:
1. Ga naar je project
2. Settings > Environment Variables
3. Voeg toe:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/homecheff
NEXTAUTH_URL=https://homecheff.eu
NEXTAUTH_SECRET=your-secret-key-here
```

## Oplossing 2: Lokale Database

### Stap 1: Installeer PostgreSQL lokaal
```bash
# Windows (met Chocolatey)
choco install postgresql

# Of download van https://www.postgresql.org/download/
```

### Stap 2: Start PostgreSQL service
```bash
# Windows
net start postgresql-x64-14

# Of via Services.msc
```

### Stap 3: Maak database aan
```sql
CREATE DATABASE homecheff;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE homecheff TO postgres;
```

### Stap 4: Update .env.local
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/homecheff"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Stap 5: Run Prisma migrations
```bash
npx prisma db push
npx prisma generate
```

## Oplossing 3: Vercel Postgres (Aanbevolen)

### Stap 1: Installeer Vercel Postgres
```bash
npm install @vercel/postgres
```

### Stap 2: Maak database aan in Vercel
1. Ga naar Vercel Dashboard
2. Storage > Create Database
3. Kies PostgreSQL
4. Kopieer de connection string

### Stap 3: Voeg toe aan Environment Variables
```
DATABASE_URL=postgresql://username:password@host:port/database
```

## Test Database Connectie

Na het instellen, test de connectie:
```bash
curl https://homecheff.eu/api/test-db
```

Dit zou moeten returnen:
```json
{
  "success": true,
  "message": "Database connection successful",
  "userCount": 0,
  "databaseUrl": "Set"
}
```
