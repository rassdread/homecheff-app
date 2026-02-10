async function main() {
  console.log('Loading PrismaClient...');
  let PrismaClient;
  try {
    ({ PrismaClient } = require('@prisma/client'));
  } catch (error) {
    console.error('Failed to require @prisma/client:', error);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    console.log('Running NotificationPreferences diagnostics...');
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE 'notificationpreferences';"
    );
    console.log('Tables:', tables);

    const indexes = await prisma.$queryRawUnsafe(
      "SELECT indexname FROM pg_indexes WHERE tablename ILIKE 'notificationpreferences';"
    );
    console.log('Indexes:', indexes);

    const sequences = await prisma.$queryRawUnsafe(
      "SELECT relname FROM pg_class WHERE relkind = 'S' AND relname ILIKE 'notificationpreferences%';"
    );
    console.log('Sequences:', sequences);
  } catch (error) {
    console.error('Diagnostics failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
