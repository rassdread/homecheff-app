/**
 * deliveryFeeCollected means courier delivery-fee Connect settlement completed.
 * Run: npx tsx --test lib/delivery/delivery-fee-collected.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { markDeliveryFeeCollectedOnConfirmedTransfer } from '@/lib/delivery/delivery-payout';

describe('deliveryFeeCollected flag', () => {
  it('does not flip true without a confirmed Stripe transfer id', async () => {
    const calls: unknown[] = [];
    const prisma = {
      deliveryOrder: {
        updateMany: async (args: unknown) => {
          calls.push(args);
          return { count: 1 };
        },
      },
    };
    assert.equal(
      await markDeliveryFeeCollectedOnConfirmedTransfer(prisma as never, 'd1', null),
      false,
    );
    assert.equal(
      await markDeliveryFeeCollectedOnConfirmedTransfer(prisma as never, 'd1', 'failed_x'),
      false,
    );
    assert.equal(calls.length, 0);
  });

  it('sets true only when currently false and transfer id is tr_', async () => {
    const calls: Array<{ where: Record<string, unknown>; data: Record<string, unknown> }> = [];
    const prisma = {
      deliveryOrder: {
        updateMany: async (args: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          calls.push(args);
          return { count: args.where.deliveryFeeCollected === false ? 1 : 0 };
        },
      },
    };
    assert.equal(
      await markDeliveryFeeCollectedOnConfirmedTransfer(prisma as never, 'd1', 'tr_abc'),
      true,
    );
    assert.deepEqual(calls[0]?.where, { id: 'd1', deliveryFeeCollected: false });
    assert.deepEqual(calls[0]?.data, { deliveryFeeCollected: true });
  });

  it('is idempotent when already true', async () => {
    const prisma = {
      deliveryOrder: {
        updateMany: async () => ({ count: 0 }),
      },
    };
    assert.equal(
      await markDeliveryFeeCollectedOnConfirmedTransfer(prisma as never, 'd1', 'tr_abc'),
      false,
    );
  });
});
