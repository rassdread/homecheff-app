/**
 * Ensure dedicated media-cert seller exists (idempotent).
 * Email: mediacert+homecheff@example.com  Username: MediaCertHC
 */
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

const EMAIL = process.env.MEDIA_TEST_EMAIL || 'mediacert+homecheff@example.com';
const PASSWORD = process.env.MEDIA_TEST_PASSWORD || 'MediaCert!2026Hc';
const USERNAME = 'MediaCertHC';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  let user = await prisma.user.findFirst({
    where: { OR: [{ email: EMAIL }, { username: USERNAME }] },
    include: { SellerProfile: true },
  });

  if (!user) {
    const id = randomUUID();
    user = await prisma.user.create({
      data: {
        id,
        email: EMAIL,
        username: USERNAME,
        name: 'MediaCert Test',
        passwordHash: hash,
        emailVerified: new Date(),
        role: 'SELLER',
        sellerRoles: ['chef'],
        showProfileToEveryone: true,
        displayFullName: true,
        place: 'Teststad',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        SellerProfile: {
          create: {
            id: randomUUID(),
            displayName: 'MediaCert Test',
          },
        },
      },
      include: { SellerProfile: true },
    });
    console.log(JSON.stringify({ created: true, userId: user.id, email: EMAIL, username: USERNAME }));
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        emailVerified: user.emailVerified ?? new Date(),
        showProfileToEveryone: true,
        role: 'SELLER',
        sellerRoles: user.sellerRoles?.length ? user.sellerRoles : ['chef'],
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      },
    });
    if (!user.SellerProfile) {
      await prisma.sellerProfile.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          displayName: 'MediaCert Test',
        },
      });
    }
    console.log(JSON.stringify({ created: false, updated: true, userId: user.id, email: EMAIL, username: USERNAME }));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
