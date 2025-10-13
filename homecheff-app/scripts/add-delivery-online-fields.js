const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding delivery online status fields...');

  try {
    // Run raw SQL to add columns
    await prisma.$executeRaw`
      ALTER TABLE "DeliveryProfile" 
      ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "lastOnlineAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "lastOfflineAt" TIMESTAMP(3)
    `;
    
    console.log('✅ Added isOnline fields to DeliveryProfile');

    await prisma.$executeRaw`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "lastLocationUpdate" TIMESTAMP(3)
    `;
    
    console.log('✅ Added lastLocationUpdate to User');

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "DeliveryProfile_isOnline_idx" ON "DeliveryProfile"("isOnline")
    `;
    
    console.log('✅ Created index on isOnline');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "DeliveryProfile_currentLat_currentLng_idx" ON "DeliveryProfile"("currentLat", "currentLng")
    `;
    
    console.log('✅ Created index on current location');

    // Update existing profiles
    await prisma.$executeRaw`
      UPDATE "DeliveryProfile" dp
      SET 
        "currentLat" = u.lat,
        "currentLng" = u.lng,
        "lastLocationUpdate" = NOW()
      FROM "User" u
      WHERE dp."userId" = u.id
        AND u.lat IS NOT NULL 
        AND u.lng IS NOT NULL
        AND dp."currentLat" IS NULL
    `;
    
    console.log('✅ Updated existing delivery profiles with user locations');
    
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

