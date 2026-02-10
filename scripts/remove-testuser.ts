
import { prisma } from '@/lib/prisma';

async function main() {
  const removed = await prisma.user.deleteMany({
    where: {
      OR: [
        { username: { contains: 'testuser', mode: 'insensitive' } },
        { email: { contains: 'testuser', mode: 'insensitive' } },
        { name: { contains: 'testuser', mode: 'insensitive' } },
      ],
    },
  });
  console.log(`Removed users: ${removed.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
