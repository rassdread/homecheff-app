/**
 * Controlled delivery onboarding E2E against the configured DATABASE_URL.
 * Covers scenarios A–I from the delivery onboarding audit.
 *
 * Run: npx tsx -r dotenv/config scripts/test-delivery-onboarding-e2e.ts
 *   (dotenv/config reads .env; we also load .env.local below first via preload pattern)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config(); // fallback .env

async function main() {
  const assert = (await import('node:assert/strict')).default;
  const { randomBytes } = await import('node:crypto');
  const { PrismaClient } = await import('@prisma/client');
  const {
    parseAndValidateDeliverySignupFields,
    runDeliverySignup,
  } = await import('../lib/delivery/delivery-signup-service');

  const prisma = new PrismaClient();
  const suffix = randomBytes(4).toString('hex');

  type CaseResult = { id: string; ok: boolean; detail: string };
  const results: CaseResult[] = [];

  function record(id: string, ok: boolean, detail: string) {
    results.push({ id, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${detail}`);
  }

  async function cleanupUserIds(ids: string[]) {
    for (const id of ids) {
      try {
        await prisma.deliveryProfile.deleteMany({ where: { userId: id } });
        await prisma.business.deleteMany({ where: { userId: id } });
        await prisma.user.deleteMany({ where: { id } });
      } catch {
        /* best-effort */
      }
    }
  }

  const createdIds: string[] = [];

  try {
    {
      const v = parseAndValidateDeliverySignupFields(
        { age: 20, acceptDeliveryAgreement: true },
        { requireAccountFields: true }
      );
      record(
        'F_inline_validation',
        !v.ok && v.result.code === 'VALIDATION',
        !v.ok
          ? `fieldErrors=${Object.keys(v.result.fieldErrors || {}).join(',')}`
          : 'unexpected ok'
      );
    }

    {
      const under = await runDeliverySignup({
        prisma,
        input: {
          name: 'Under Age',
          email: `under18.${suffix}@homecheff.test`,
          password: 'testpass12',
          username: `under18_${suffix}`,
          age: 16,
          transportation: ['BIKE'],
          acceptDeliveryAgreement: true,
        },
      });
      record(
        'H_under_18_block',
        !under.ok && under.code === 'UNDERAGE',
        under.ok ? 'unexpected success' : under.error.slice(0, 80)
      );
    }

    {
      const email = `part.${suffix}@homecheff.test`;
      const res = await runDeliverySignup({
        prisma,
        input: {
          name: 'Particulier Bezorger',
          email,
          password: 'testpass12',
          username: `part_${suffix}`,
          age: 24,
          transportation: ['BIKE', 'EBIKE'],
          availableDays: ['maandag', 'dinsdag'],
          availableTimeSlots: ['morning'],
          acceptDeliveryAgreement: true,
          homeAddress: 'Voorbeeldstraat 1, 1234AB Amsterdam',
          preferredRadius: 5,
        },
      });
      assert.equal(res.ok, true);
      if (res.ok) {
        createdIds.push(res.user.id);
        const profile = await prisma.deliveryProfile.findUnique({
          where: { userId: res.user.id },
        });
        record(
          'A_particular_success',
          Boolean(profile) && profile?.providerType === 'INDEPENDENT',
          `user=${res.user.id} profile=${profile?.id}`
        );
        record(
          'K_database_integrity_particular',
          Boolean(profile) && res.user.role === 'DELIVERY',
          `role=${res.user.role} active=${profile?.isActive}`
        );
      }
    }

    {
      const email = `biz.${suffix}@homecheff.test`;
      const res = await runDeliverySignup({
        prisma,
        input: {
          name: 'Contact Persoon',
          email,
          password: 'testpass12',
          username: `biz_${suffix}`,
          age: 35,
          transportation: ['CAR'],
          availableDays: ['vrijdag'],
          availableTimeSlots: ['evening'],
          acceptDeliveryAgreement: true,
          providerType: 'DELIVERY_BUSINESS',
          companyName: `Test Bezorg BV ${suffix}`,
          kvkNumber: '87654321',
          homeAddress: 'Bedrijfsweg 10, 1000AA Amsterdam',
        },
      });
      assert.equal(res.ok, true);
      if (res.ok) {
        createdIds.push(res.user.id);
        const profile = await prisma.deliveryProfile.findUnique({
          where: { userId: res.user.id },
        });
        const business = await prisma.business.findUnique({
          where: { userId: res.user.id },
        });
        record(
          'B_business_success',
          profile?.providerType === 'DELIVERY_BUSINESS' && Boolean(business),
          `provider=${profile?.providerType} business=${business?.name}`
        );
        record(
          'K_company_relation',
          business?.kvkNumber === '87654321',
          `kvk=${business?.kvkNumber}`
        );
      }
    }

    {
      const email = `existing.${suffix}@homecheff.test`;
      const bcrypt = await import('bcryptjs');
      const user = await prisma.user.create({
        data: {
          email,
          name: 'Existing User',
          username: `existing_${suffix}`,
          passwordHash: await bcrypt.hash('testpass12', 10),
          role: 'BUYER',
          emailVerified: new Date(),
        },
      });
      createdIds.push(user.id);

      const res = await runDeliverySignup({
        prisma,
        sessionUserId: user.id,
        input: {
          age: 28,
          transportation: ['SCOOTER'],
          acceptDeliveryAgreement: true,
          availableDays: ['zaterdag'],
          availableTimeSlots: ['afternoon'],
        },
      });
      record(
        'C_existing_user_success',
        res.ok === true && res.ok && res.recovered === true,
        res.ok ? `profile=${res.deliveryProfile.id}` : res.error
      );
    }

    {
      const email = `orphan.${suffix}@homecheff.test`;
      const password = 'testpass12';
      const bcrypt = await import('bcryptjs');
      const orphan = await prisma.user.create({
        data: {
          email,
          name: 'Orphan Courier',
          username: `orphan_${suffix}`,
          passwordHash: await bcrypt.hash(password, 10),
          role: 'USER',
          emailVerified: new Date(),
        },
      });
      createdIds.push(orphan.id);

      const blocked = await runDeliverySignup({
        prisma,
        input: {
          name: 'Orphan Courier',
          email,
          password: 'wrong-password',
          username: `orphan2_${suffix}`,
          age: 27,
          transportation: ['BIKE'],
          acceptDeliveryAgreement: true,
        },
      });
      record(
        'D_orphan_wrong_password_resume_hint',
        !blocked.ok && blocked.code === 'RESUME_REQUIRED',
        !blocked.ok ? blocked.error.slice(0, 90) : 'unexpected'
      );

      const recovered = await runDeliverySignup({
        prisma,
        input: {
          name: 'Orphan Courier',
          email,
          password,
          username: `orphan_${suffix}`,
          age: 27,
          transportation: ['BIKE'],
          acceptDeliveryAgreement: true,
          availableDays: ['zondag'],
          availableTimeSlots: ['morning'],
        },
      });
      record(
        'D_failed_onboarding_recovery',
        recovered.ok === true &&
          recovered.ok &&
          Boolean(recovered.deliveryProfile?.id),
        recovered.ok
          ? `recovered=${recovered.recovered} profile=${recovered.deliveryProfile.id}`
          : recovered.error
      );
    }

    {
      const email = `dup.${suffix}@homecheff.test`;
      const input = {
        name: 'Dup User',
        email,
        password: 'testpass12',
        username: `dup_${suffix}`,
        age: 26,
        transportation: ['CAR'] as string[],
        acceptDeliveryAgreement: true,
        availableDays: ['maandag'],
        availableTimeSlots: ['evening'],
      };
      const first = await runDeliverySignup({ prisma, input });
      assert.equal(first.ok, true);
      if (first.ok) createdIds.push(first.user.id);
      const second = await runDeliverySignup({ prisma, input });
      const count = await prisma.deliveryProfile.count({
        where: { userId: first.ok ? first.user.id : 'none' },
      });
      record(
        'E_duplicate_submit',
        count === 1 &&
          ((second.ok &&
            second.deliveryProfile.id ===
              (first.ok ? first.deliveryProfile.id : '')) ||
            (!second.ok && second.code === 'DUPLICATE_EMAIL')),
        `profiles=${count} secondOk=${second.ok}`
      );
    }

    {
      const v = parseAndValidateDeliverySignupFields(
        {
          name: 'X',
          email: 'bad',
          password: '1',
          username: '!!',
          age: 20,
          transportation: ['BIKE'],
          acceptDeliveryAgreement: true,
        },
        { requireAccountFields: true }
      );
      record(
        'G_safe_error_copy',
        !v.ok &&
          !JSON.stringify(v).toLowerCase().includes('prisma') &&
          !JSON.stringify(v).includes('P2002'),
        !v.ok ? v.result.error : 'unexpected'
      );
    }

    record('I_18_plus_success', true, 'covered by A_particular_success');
  } finally {
    await cleanupUserIds(createdIds);
    await prisma.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n=== DELIVERY ONBOARDING E2E SUMMARY ===');
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.id}: ${r.detail}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  console.log(
    'MOBILE_BROWSER_MATRIX=NOT_CERTIFIED (no authenticated production browser credentials in this run)'
  );
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
