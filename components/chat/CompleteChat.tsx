'use client';

import ChatBox, { type ChatBoxProps } from '@/components/chat/ChatBox';

/**
 * Dunne wrapper om {@link ChatBox} (source of truth voor thread UI + merge/cache/Pusher) met extra profiel-tools.
 */
export default function CompleteChat(props: ChatBoxProps) {
  return <ChatBox {...props} showConversationTools />;
}
