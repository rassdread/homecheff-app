'use client';

import { useState } from 'react';
import ConversationsList from '@/components/chat/ConversationsList';
import ChatWindow from '@/components/chat/ChatWindow';

interface Conversation {
  id: string;
  title: string;
  product?: {
    id: string;
    title: string;
    priceCents: number;
    Image: Array<{
      fileUrl: string;
      sortOrder: number;
    }>;
  };
  otherParticipant?: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    return (
      <div className="h-screen flex flex-col">
        <ChatWindow
          conversation={selectedConversation}
          onBack={handleBackToList}
          onMessagesRead={() => {
            // Refresh conversations when messages are read
            window.dispatchEvent(new CustomEvent('messagesRead'));
          }}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="w-full border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Berichten</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Je gesprekken met kopers en verkopers
          </p>
        </div>
      </header>
      
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <ConversationsList onSelectConversation={handleSelectConversation} />
      </section>
    </main>
  );
}