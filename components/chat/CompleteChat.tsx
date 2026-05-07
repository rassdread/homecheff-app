'use client';

import ChatBox, { type ChatBoxProps } from '@/components/chat/ChatBox';

/**
 * Dunne wrapper: zelfde UI als hoofd-chat (`ChatBox`), met profiel-tools (verversen / gesprek wissen).
 * Profiel en mobiele berichtenlijst blijven deze import gebruiken.
 */
export default function CompleteChat(props: ChatBoxProps) {
  return <ChatBox {...props} showConversationTools />;
}
