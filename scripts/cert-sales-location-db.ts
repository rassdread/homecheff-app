/**
 * Isolated-database checks for sales locations.
 * DATABASE_URL must point at a disposable local database.
 */
import assert from 'node:assert/strict';
import { prisma } from '@/lib/prisma';
import { createSalesLocation, updateSalesLocation } from '@/lib/seller/sales-locations-server';

const SELLER = '11111111-1111-4111-8111-111111111111';
const OTHER = '33333333-3333-4333-8333-333333333333';
const PRODUCT = '81dee35b-5577-442c-a96f-13839cec8c76';
const ORDER = '44444444-4444-4444-8444-444444444444';

const draft = (name: string) => ({
  name,
  street: 'Hoogstraat',
  houseNumber: '1',
  postalCode: '3131 BC',
  city: 'Vlaardingen',
  country: 'BE',
});

async function main() {
  const before = {
    users: await prisma.user.count(),
    products: await prisma.product.count({ where: { id: PRODUCT } }),
    orders: await prisma.order.count({ where: { id: ORDER } }),
  };
  assert.equal(before.products, 1);
  assert.equal(before.orders, 1);
  assert.ok(before.users >= 2);

  const product = await prisma.product.findUnique({
    where: { id: PRODUCT },
    select: { title: true, pickupAddress: true, salesLocations: true },
  });
  assert.equal(product?.title, 'Krentenbol');
  assert.equal(product?.salesLocations.length, 0);

  const orderBefore = await prisma.order.findUnique({
    where: { id: ORDER },
    select: { pickupAddress: true },
  });
  assert.equal(orderBefore?.pickupAddress, 'Oude afhaaltekst');

  await prisma.sellerSalesLocation.deleteMany({ where: { userId: SELLER } });
  const [first, second] = await Promise.all([
    createSalesLocation(SELLER, draft('Kraam A')),
    createSalesLocation(SELLER, draft('Kraam B')),
  ]);
  const successes = [first, second].filter((result) => result.ok);
  assert.equal(successes.length, 1, 'individual cap allows one concurrent create');
  assert.equal([first, second].some((result) => !result.ok && result.code === 'LOCATION_LIMIT'), true);

  const stored = await prisma.sellerSalesLocation.count({ where: { userId: SELLER } });
  assert.equal(stored, 1);

  const foreign = await updateSalesLocation(OTHER, successes[0] && successes[0].ok ? successes[0].location.id : '', {
    name: 'Gestolen kraam',
  });
  assert.equal(foreign.ok, false);
  assert.equal(foreign.ok ? '' : foreign.code, 'NOT_FOUND');

  const keptOrder = await prisma.order.findUnique({
    where: { id: ORDER },
    select: { pickupAddress: true },
  });
  assert.equal(keptOrder?.pickupAddress, 'Oude afhaaltekst');
  const keptProduct = await prisma.product.count({ where: { id: PRODUCT } });
  assert.equal(keptProduct, 1);

  console.log('cert-sales-location-db: pass');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
