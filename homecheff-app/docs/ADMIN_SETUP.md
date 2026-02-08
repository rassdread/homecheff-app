# 🔐 Admin Setup - HomeCheff

## **Stap 1: Admin Account Aanmaken**

### **Optie A: Via Script (Aanbevolen)**
```bash
# Ga naar de project directory
cd C:\Users\Admin\homecheff-app

# Maak admin account aan
node scripts/create-admin.js admin@homecheff.eu jouw-wachtwoord123 "Admin User"
```

### **Optie B: Via Database Direct**
1. Ga naar je database (PostgreSQL)
2. Voer deze query uit:
```sql
INSERT INTO "User" (id, email, "passwordHash", name, username, role, bio, interests, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@homecheff.eu',
  '$2b$12$YOUR_HASHED_PASSWORD', -- Gebruik bcrypt om je wachtwoord te hashen
  'Admin User',
  'admin',
  'ADMIN',
  'HomeCheff Administrator',
  ARRAY['Beheer', 'Moderatie', 'Ondersteuning'],
  NOW(),
  NOW()
);
```

## **Stap 2: Inloggen als Admin**

1. Ga naar: `https://homecheff.eu/login`
2. Log in met je admin credentials
3. Ga naar: `https://homecheff.eu/admin`

## **Stap 3: Admin Functies**

### **Gebruikersbeheer**
- Bekijk alle gebruikers
- Zoek gebruikers
- Verwijder gebruikers (individueel of bulk)
- Bekijk Stripe status
- Stuur e-mails

### **Productenbeheer**
- Bekijk alle producten
- Verwijder producten
- Modereer content

### **Berichtensysteem**
- Stuur berichten naar alle gebruikers
- Stuur berichten naar specifieke groepen
- Beheer notificaties

## **Stap 4: Beveiliging**

### **Admin Routes zijn Beveiligd:**
- ✅ Alleen ingelogde gebruikers
- ✅ Alleen gebruikers met rol 'ADMIN'
- ✅ Automatische redirect naar login
- ✅ Automatische redirect naar home voor niet-admins

### **Extra Beveiliging:**
- Admin accounts kunnen zichzelf niet verwijderen
- Alle admin acties worden gelogd
- Session-based authenticatie

## **Stap 5: Wachtwoord Reset**

Als je je wachtwoord vergeet:
```bash
# Update admin wachtwoord
node scripts/create-admin.js admin@homecheff.eu nieuw-wachtwoord123
```

## **Troubleshooting**

### **"Forbidden" Error**
- Controleer of je rol 'ADMIN' is in de database
- Log uit en log opnieuw in

### **"Unauthorized" Error**
- Controleer of je ingelogd bent
- Controleer je session

### **Admin Panel Laadt Niet**
- Controleer of de middleware correct werkt
- Controleer de database connectie

## **Admin Features Overzicht**

| Functie | Status | Beschrijving |
|---------|--------|--------------|
| Gebruikersbeheer | ✅ | Bekijk, zoek, verwijder gebruikers |
| Productenbeheer | 🚧 | Bekijk, verwijder producten |
| Berichtensysteem | 🚧 | Stuur berichten naar gebruikers |
| Notificaties | 🚧 | Beheer notificaties |
| Stripe Verificatie | 🚧 | Beheer Stripe accounts |
| Analytics | 🚧 | Platform statistieken |

## **Support**

Voor vragen over het admin systeem, controleer:
1. Database connectie
2. User rol in database
3. Session status
4. Console errors in browser






