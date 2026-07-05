'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageCircle } from 'lucide-react';
import ConversationsList from '@/components/chat/ConversationsList';
import ChatBox from '@/components/chat/ChatBox';
import ChatShell from '@/components/chat/ChatShell';
import { MessagesErrorBoundary } from '@/components/chat/MessagesErrorBoundary';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { isNativeAndroid } from '@/lib/native/capacitor';
import {
  APP_RESUME_MSG_CONV_HINT,
  readLastConversationIdIfFresh,
  saveLastConversationId,
} from '@/lib/appResumeCache';
import { cn } from '@/lib/utils';
import { HC_MOBILE_CHAT_ABOVE_NAV_BOTTOM } from '@/lib/layout/bottomNavInset';
import { useTranslation } from '@/hooks/useTranslation';
import BackButton from '@/components/navigation/BackButton';
import {
  normalizeConversationListItem,
  type NormalizedConversationListItem,
} from '@/lib/chat/normalizeConversation';
import { reportMessagingDiagnostic } from '@/lib/chat/messagingDiagnostics';
import { MessagesLoadingSkeleton } from '@/components/navigation/RouteLoadingSkeletons';
import type { ResolvedConversationHeader } from '@/lib/communication/resolveConversationHeader';

type Conversation = NormalizedConversationListItem;

function MessagesPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const messagesPath = usePathname() ?? '/messages';
  const nativeMounted = useIsNativeAppMounted();
  const isLargeDisplay = useMediaQuery('(min-width: 1024px)');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [contextHeader, setContextHeader] = useState<ResolvedConversationHeader | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      router.replace(
        `/login?callbackUrl=${encodeURIComponent(messagesPath)}`
      );
    }
  }, [session, sessionStatus, router, messagesPath]);

  /** Native: één keer per tab gesprek-URL herstellen uit resume-hint (API blijft leidend). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!nativeMounted) return;
    if (!searchParams) return;
    if (searchParams.get('conversation')) return;
    try {
      if (sessionStorage.getItem(APP_RESUME_MSG_CONV_HINT)) return;
      const id = readLastConversationIdIfFresh();
      if (!id) return;
      sessionStorage.setItem(APP_RESUME_MSG_CONV_HINT, '1');
      router.replace(`${messagesPath}?conversation=${encodeURIComponent(id)}`);
    } catch {
      /* ignore */
    }
  }, [nativeMounted, searchParams, router, messagesPath]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setContextHeader(null);
  };

  useEffect(() => {
    const id = selectedConversation?.id;
    if (!id) {
      setContextHeader(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setContextHeader(
            (data.conversation?.contextHeader as ResolvedConversationHeader | null) ?? null,
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedConversation?.id]);

  const handleBackToList = useCallback(() => {
    setSelectedConversation(null);
    try {
      router.replace(messagesPath);
    } catch {
      /* ignore */
    }
  }, [router, messagesPath]);

  /** Mobiel: geen body-scroll zolang een gesprek open is. */
  useEffect(() => {
    const narrow = !isLargeDisplay;
    const chatOpen = !!selectedConversation;
    if (!narrow || !chatOpen) return;
    const html = document.documentElement;
    html.classList.add('hc-messages-chat-open');
    return () => {
      html.classList.remove('hc-messages-chat-open');
    };
  }, [isLargeDisplay, selectedConversation]);

  // Handle URL conversation parameter
  useEffect(() => {
    if (!searchParams) return;

    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      try {
        saveLastConversationId(conversationId);
      } catch {
        /* ignore */
      }

      fetch(`/api/conversations/${encodeURIComponent(conversationId)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.conversation) {
            const n = normalizeConversationListItem(data.conversation);
            if (!n) {
              reportMessagingDiagnostic('split_view_conv_fetch_shape', {
                reason: 'normalize',
              });
              return;
            }
            setSelectedConversation(n);
            window.dispatchEvent(
              new CustomEvent('conversationUpdated', {
                detail: { conversationId },
              })
            );
          }
        })
        .catch((error) => {
          console.error('Error fetching conversation:', error);
        });
    }
  }, [searchParams]);

  const hidePageChromeForMobileChat =
    !!selectedConversation && !isLargeDisplay;

  /** Android WebView: gesprekkenlijst scrollt op body/#main-content — geen overflow-trap op main. */
  const androidListUsesPageScroll =
    nativeMounted &&
    isNativeAndroid() &&
    !selectedConversation &&
    !isLargeDisplay;

  if (sessionStatus === 'loading' || !session?.user) {
    return null;
  }

  return (
    <main
      className={cn(
        'hc-messages-root flex min-h-0 flex-col bg-[#e8eaed]',
        androidListUsesPageScroll
          ? 'overflow-visible max-lg:overflow-visible hc-native-android-messages-list-body'
          : 'overflow-hidden',
        nativeMounted && 'hc-native-messages-page'
      )}
    >
      <header
        className={`w-full flex-shrink-0 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm ${
          hidePageChromeForMobileChat ? 'hidden lg:block' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BackButton
                  fallbackUrl="/?chip=sale#homecheff-feed"
                  label={t('navigation.backToDorpsplein')}
                  variant="minimal"
                  className="-ml-1"
                  backNavMode="explicit"
                />
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {t('messages.title')}
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                {t('messages.pageIntro')}{' '}
                <span className="text-gray-500">{t('messages.pageNotificationsHint')}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'flex min-h-0 flex-1 p-0 lg:gap-3 lg:p-3',
          androidListUsesPageScroll
            ? 'max-lg:overflow-visible max-lg:flex-none lg:overflow-hidden lg:flex-1'
            : 'flex-1 overflow-hidden',
          nativeMounted && 'hc-native-chat-shell'
        )}
      >
        <div
          data-tour="conversations-list"
          className={cn(
            'flex min-h-0 flex-col border-r border-gray-200/80 bg-white transition-[width] duration-200 ease-out',
            selectedConversation
              ? 'hidden w-0 min-w-0 lg:flex lg:w-[22rem] lg:min-w-[22rem] xl:w-96 xl:min-w-[24rem]'
              : 'w-full min-w-0 lg:max-w-md xl:max-w-sm',
            nativeMounted &&
              'hc-native-messages-list-column max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-hidden',
            androidListUsesPageScroll &&
              'max-lg:flex-none max-lg:min-h-0 max-lg:overflow-visible max-lg:self-stretch',
            /* Mobiel web: vul resterende hoogte in hc-messages-root zodat de lijst niet onder de tabbalk loopt. */
            !nativeMounted &&
              'max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-hidden'
          )}
        >
          <div
            className={cn(
              'hc-native-messages-list-inner flex min-h-0 flex-col',
              androidListUsesPageScroll
                ? 'max-lg:flex-none max-lg:min-h-0 max-lg:overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-hidden'
                : nativeMounted
                  ? 'max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-hidden lg:overflow-hidden'
                  : 'flex min-h-0 max-lg:flex-1 max-lg:min-h-0 max-lg:flex-col max-lg:overflow-hidden lg:overflow-hidden'
            )}
          >
            <ConversationsList onSelectConversation={handleSelectConversation} />
          </div>
        </div>

        {selectedConversation && (
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-hidden',
              hidePageChromeForMobileChat
                ? /* Eindigt boven vaste tabbalk (z-65); geen bottom-0 + pb (bedekte anders de nav). */
                  cn(
                    'fixed inset-x-0 top-16 z-40 bg-[#f4f6f8]',
                    HC_MOBILE_CHAT_ABOVE_NAV_BOTTOM,
                    'lg:static lg:inset-auto lg:top-auto lg:bottom-auto lg:z-0 lg:bg-transparent'
                  )
                : 'lg:min-w-0'
            )}
          >
            <ChatShell>
              <ChatBox
                key={selectedConversation.id}
                conversationId={selectedConversation.id}
                otherParticipant={(() => {
                  const op =
                    selectedConversation.otherParticipant ??
                    selectedConversation.participants?.[0];
                  if (op?.id?.trim()) return op;
                  return {
                    id: 'unknown',
                    name: null,
                    username: null,
                    profileImage: null,
                  };
                })()}
                relationshipContext={selectedConversation.relationshipContext ?? null}
                contextHeader={contextHeader}
                onBack={handleBackToList}
              />
            </ChatShell>
          </div>
        )}

        {!selectedConversation && (
          <div className="hidden min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300/80 bg-white/60 lg:flex">
            <div className="p-8 text-center">
              <MessageCircle className="mx-auto mb-4 h-20 w-20 text-gray-300" />
              <h3 className="mb-2 text-xl font-medium text-gray-900">
                {t('messages.selectConversationDesktop')}
              </h3>
              <p className="max-w-md text-gray-500">
                {t('messages.selectConversationDesktopHint')}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesErrorBoundary>
        <MessagesPageContent />
      </MessagesErrorBoundary>
    </Suspense>
  );
}
