import { prisma } from '@/lib/prisma';
import type { WebhookReceiptRow, WebhookReceiptStore } from '@/lib/stripe/webhook-receipt';

function asStatus(value: string): WebhookReceiptRow['status'] {
  if (value === 'PROCESSED' || value === 'FAILED' || value === 'REJECTED' || value === 'PROCESSING') {
    return value;
  }
  return 'FAILED';
}

export function prismaWebhookReceiptStore(): WebhookReceiptStore {
  return {
    async find(eventId) {
      const row = await prisma.stripeWebhookReceipt.findUnique({ where: { eventId } });
      if (!row) return null;
      return {
        eventId: row.eventId,
        eventType: row.eventType,
        livemode: row.livemode,
        status: asStatus(row.status),
        httpStatus: row.httpStatus,
        attemptCount: row.attemptCount,
        updatedAt: row.updatedAt,
      };
    },
    async insert(row) {
      try {
        await prisma.stripeWebhookReceipt.create({
          data: {
            eventId: row.eventId,
            eventType: row.eventType,
            livemode: row.livemode,
            status: row.status,
            httpStatus: row.httpStatus,
            attemptCount: row.attemptCount,
            updatedAt: row.updatedAt,
          },
        });
        return 'created';
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === 'P2002') return 'conflict';
        throw error;
      }
    },
    async update(eventId, patch) {
      await prisma.stripeWebhookReceipt.update({
        where: { eventId },
        data: patch,
      });
    },
    async claim(eventId, expectedUpdatedAt, patch) {
      const claimed = await prisma.stripeWebhookReceipt.updateMany({
        where: {
          eventId,
          updatedAt: expectedUpdatedAt,
          status: { in: ['PROCESSING', 'FAILED'] },
        },
        data: patch,
      });
      return claimed.count === 1;
    },
  };
}
