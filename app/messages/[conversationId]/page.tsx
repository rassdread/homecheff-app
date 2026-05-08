'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatBox from '@/components/chat/ChatBox';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string | null;
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
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
}

function ThreadSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex items-center gap-3 border-b p-4 shadow-sm">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden bg-gray-50 p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`h-11 animate-pulse rounded-2xl bg-gray-200 ${
                i % 2 === 0 ? 'w-[72%]' : 'w-[55%]'
              }`}
            />
          </div>
        ))}
        <div className="flex flex-1 items-center justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      </div>
    </div>
  );
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

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setConversation(null);
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!response.ok) {
          if (!cancelled) router.push('/messages');
          return;
        }

        const data = await response.json();
        if (cancelled) return;
        if (data.conversation) {
          setConversation(data.conversation);
        } else {
          router.push('/messages');
        }
      } catch {
        if (!cancelled) router.push('/messages');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, session, router]);

  const handleBackToList = () => {
    router.push('/messages');
  };

  if (isLoading) {
    return <ThreadSkeleton />;
  }

  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600">
        <p className="text-sm">Terug naar berichten…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <ChatBox
        key={conversation.id}
        conversationId={conversation.id}
        otherParticipant={{
          id: conversation.otherParticipant?.id || 'unknown',
          name: conversation.otherParticipant?.name || undefined,
          username: conversation.otherParticipant?.username || undefined,
          profileImage: conversation.otherParticipant?.profileImage || undefined,
          displayFullName: conversation.otherParticipant?.displayFullName ?? undefined,
          displayNameOption: conversation.otherParticipant?.displayNameOption ?? undefined,
        }}
        onBack={handleBackToList}
      />
    </div>
  );
}
