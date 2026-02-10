# 🔄 Restore Strategie - Admin Changes Behouden

## ⚠️ PROBLEEM:
Als we naar 8:00 PM restoren:
- ✅ We krijgen DE OUDE DATA TERUG (gebruikers, producten, verkopers)
- ❌ We VERLIEZEN de admin changes van vandaag (SUPERADMIN, adminRoles, AdminPreferences)

## 🎯 OPLOSSING: 2 Stappen

### Stap 1: Herstel naar 8:00 PM (voordat admin changes)
**DOEL:** Oude gebruikers/producten terugkrijgen

**NEON CONSOLE:**
- Zet timestamp naar: **Oct 28, 2025 08:00:00 PM**
- Klik "Proceed" om te restoren
- Wacht tot restore klaar is

### Stap 2: Admin Changes Opnieuw Toepassen
**DOEL:** Admin functionaliteit terugkrijgen

**ONZE CODE:**
```bash
# De Prisma schema heeft al de admin fields:
# - adminRoles: String[] 
# - AdminPreferences table
# - AdminPermissions table

# We hoeven ALLEEN de admin accounts opnieuw aan te maken!
```

**SCRIPT MAKEN:**
```javascript
// scripts/recreate-admin-after-restore.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Find first admin and make SUPERADMIN
  const firstAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (firstAdmin) {
    await prisma.user.update({
      where: { id: firstAdmin.id },
      data: {
        role: 'SUPERADMIN',
        adminRoles: [] // Empty = sees everything
      }
    });
    console.log('✅ First admin promoted to SUPERADMIN');
  }
  
  // Create admin@homecheff.nl with all roles
  await prisma.user.upsert({
    where: { email: 'admin@homecheff.nl' },
    update: {},
    create: {
      email: 'admin@homecheff.nl',
      passwordHash: await bcrypt.hash('temp-password', 10),
      role: 'ADMIN',
      adminRoles: [
        'users_management',
        'products_management',
        'orders_management',
        'delivery_management',
        'analytics_viewer',
        'content_moderator',
        'user_support',
        'financial_viewer',
        'system_admin'
      ]
    }
  });
  
  console.log('✅ admin@homecheff.nl created with all roles');
})();
```

## ✅ VOORDELEN VAN DEZE AANPAK:

1. **We krijgen ALLE DATA TERUG** (gebruikers, producten, verkopers)
2. **Admin changes kunnen worden opnieuw toegepast**
3. **We verliezen alleen tijd** (moeten admin setup opnieuw doen)
4. **Maar DATA IS TERUG!**

## ⏰ TIJD ESTIMATIE:

- **Neon Restore:** 2-5 minuten
- **Admin Setup:** 5 minuten
- **Totaal:** ~10 minuten

## 🎯 DIRECTE ACTIE:

**JA of NEE: Wil je deze strategie?**

Als **JA:**
1. Restore naar 8:00 PM (zet tijd op **Oct 28, 2025 08:00:00 PM**)
2. Klik "Proceed"
3. Wacht op restore
4. Dan maken we script om admin accounts opnieuw aan te maken
5. Data is terug + admin functionaliteit werkt weer!

**Als JE WEET WAT MOMENT admin changes gebeurde:**
- Restore naar 1 MINUUT VOOR die tijd
- Dan blijven sommige changes behouden
- Maar misschien verlies je toch iets

**Mijn aanbeveling:** Doe de restore en pas admin changes daarna opnieuw toe. Veiliger en zekerder.

