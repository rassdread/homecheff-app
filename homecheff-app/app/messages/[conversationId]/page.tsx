'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RealTimeChat from '@/components/chat/RealTimeChat';
import { useSession } from 'next-auth/react';

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

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const conversationId = params?.conversationId as string;

  useEffect(() => {
    if (!session?.user) {
      router.push('/api/auth/signin');
      return;
    }

    loadConversation();
  }, [conversationId, session]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const { conversations } = await response.json();
      const foundConversation = conversations.find((c: Conversation) => c.id === conversationId);
      
      if (foundConversation) {
        setConversation(foundConversation);
      } else {
        // Conversation not found, redirect to messages
        router.push('/messages');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      router.push('/messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    router.push('/messages');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Gesprek laden...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Gesprek niet gevonden</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <RealTimeChat
        conversationId={conversation.id}
        otherParticipant={{
          id: conversation.otherParticipant?.id || 'unknown',
          name: conversation.otherParticipant?.name || undefined,
          username: conversation.otherParticipant?.username || undefined,
          profileImage: conversation.otherParticipant?.profileImage || undefined
        }}
      />
    </div>
  );
}