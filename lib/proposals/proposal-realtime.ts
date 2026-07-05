import { pusherServer } from '@/lib/pusher';
import type { ProposalUpdatedEvent } from './proposal-types';

export async function emitProposalUpdated(
  conversationId: string,
  payload: ProposalUpdatedEvent,
): Promise<void> {
  try {
    await pusherServer.trigger(
      `conversation-${conversationId}`,
      'proposal-updated',
      payload,
    );
  } catch (error) {
    console.error('[proposal-realtime] Pusher error:', error);
  }
}

export async function emitNewMessage(
  conversationId: string,
  message: Record<string, unknown>,
): Promise<void> {
  try {
    await pusherServer.trigger(
      `conversation-${conversationId}`,
      'new-message',
      message,
    );
  } catch (error) {
    console.error('[proposal-realtime] new-message Pusher error:', error);
  }
}
