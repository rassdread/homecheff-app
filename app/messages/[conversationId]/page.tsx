'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatBox from '@/components/chat/ChatBox';
import ChatShell from '@/components/chat/ChatShell';
import { MessagesErrorBoundary } from '@/components/chat/MessagesErrorBoundary';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { cn } from '@/lib/utils';
import {
  normalizeConversationListItem,
  type NormalizedConversationListItem,
} from '@/lib/chat/normalizeConversation';
import { reportMessagingDiagnostic } from '@/lib/chat/messagingDiagnostics';

type Conversation = NormalizedConversationListItem;

function ThreadSkeleton() {
  return (
    <div className="hc-messages-root flex min-h-0 flex-col overflow-hidden bg-[#e8eaed]">
      <div className="flex shrink-0 items-center gap-3 border-b p-4 shadow-sm">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 overscroll-y-contain [-webkit-overflow-scrolling:touch]">
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
  const nativeMounted = useIsNativeAppMounted();
  const { data: session, status: sessionStatus } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const conversationIdRaw = params?.conversationId;
  const conversationId = Array.isArray(conversationIdRaw)
    ? conversationIdRaw[0]
    : (conversationIdRaw as string | undefined);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('hc-messages-chat-open');
    return () => {
      html.classList.remove('hc-messages-chat-open');
    };
  }, []);

  useEffect(() => {
    if (!conversationId) {
      return;
    }
    if (sessionStatus === 'loading') {
      return;
    }
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      const back = `/messages/${encodeURIComponent(conversationId)}/`;
      router.push(`/login?callbackUrl=${encodeURIComponent(back)}`);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setConversation(null);
      try {
        const response = await fetch(
          `/api/conversations/${encodeURIComponent(conversationId)}`,
          {
            cache: 'no-store',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          if (!cancelled) router.push('/messages');
          return;
        }

        const data = await response.json();
        if (cancelled) return;
        if (data.conversation) {
          const n = normalizeConversationListItem(data.conversation);
          if (!n) {
            reportMessagingDiagnostic('split_view_conv_fetch_shape', {
              reason: 'normalize_thread',
            });
            router.push('/messages');
            return;
          }
          setConversation(n);
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
  }, [conversationId, session, sessionStatus, router]);

  const handleBackToList = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/messages');
  };

  if (isLoading) {
    return <ThreadSkeleton />;
  }

  if (!conversation) {
    return (
      <div className="hc-messages-root flex items-center justify-center bg-[#e8eaed] text-gray-600">
        <p className="text-sm">Terug naar berichten…</p>
      </div>
    );
  }

  return (
    <MessagesErrorBoundary>
      <div
        className={cn(
          'hc-messages-root flex min-h-0 flex-col overflow-hidden bg-[#e8eaed]',
          /* Native: ruimte boven vaste bottom-nav — anders verdwijnt composer onder tabbalk (WebView). */
          nativeMounted &&
            'hc-native-thread-route pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0'
        )}
      >
        <ChatShell className="flex-1">
          <ChatBox
            key={conversation.id}
            conversationId={conversation.id}
            otherParticipant={(() => {
              const op = conversation.otherParticipant ?? conversation.participants?.[0];
              if (op?.id?.trim()) return op;
              return {
                id: 'unknown',
                name: null,
                username: null,
                profileImage: null,
              };
            })()}
            relationshipContext={conversation.relationshipContext ?? null}
            onBack={handleBackToList}
            showBackOnDesktop
          />
        </ChatShell>
      </div>
    </MessagesErrorBoundary>
  );
}
