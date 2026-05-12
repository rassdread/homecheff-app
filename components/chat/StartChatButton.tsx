'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { openSoftAuthGateWithScroll } from '@/lib/onboarding/open-soft-auth-gate';

interface StartChatButtonProps {
  productId?: string;
  sellerId: string;
  sellerName: string;
  onConversationStarted?: (conversationId: string) => void;
  onMessageSent?: (conversationId: string) => void;
  className?: string;
  showSuccessMessage?: boolean;
}

export default function StartChatButton({
  productId,
  sellerId,
  sellerName,
  onConversationStarted,
  onMessageSent,
  className = '',
  showSuccessMessage = false,
}: StartChatButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const nativeMounted = useIsNativeAppMounted();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [successConversationId, setSuccessConversationId] = useState<
    string | null
  >(null);
  const { data: session, status } = useSession();

  const goToLoginForChat = () => {
    const returnPath =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : pathname || '/';
    openSoftAuthGateWithScroll({
      copyKey: 'message',
      intent: {
        type: 'start_chat',
        targetId: sellerId,
        draftKey: productId,
        returnPath,
      },
    });
  };

  const submitConversation = async (rawMessage: string | null) => {
    const endpoint = productId
      ? '/api/conversations/start'
      : '/api/conversations/start-seller';
    const msgRaw = rawMessage?.trim() || null;
    const requestBody = productId
      ? { productId, initialMessage: msgRaw }
      : { sellerId, initialMessage: msgRaw };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string }).error ||
          'Failed to start conversation'
      );
    }

    const { conversation } = await response.json();
    onConversationStarted?.(conversation.id);
    onMessageSent?.(conversation.id);

    if (showSuccessMessage) {
      setSuccessConversationId(conversation.id);
      setShowModal(false);
      setInitialMessage('');
    } else {
      router.push(`/messages?conversation=${conversation.id}`);
      window.dispatchEvent(
        new CustomEvent('conversationUpdated', {
          detail: { conversationId: conversation.id },
        })
      );
      setShowModal(false);
      setInitialMessage('');
    }
  };

  const handleStartChat = async () => {
    if (!session?.user) {
      goToLoginForChat();
      return;
    }
    setIsLoading(true);
    try {
      await submitConversation(initialMessage);
    } catch (error) {
      alert(
        `Fout bij starten van gesprek: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMessage = async (message: string) => {
    if (!session?.user) {
      goToLoginForChat();
      return;
    }
    setIsLoading(true);
    setInitialMessage(message);
    try {
      await submitConversation(message);
    } catch (error) {
      alert(
        `Fout bij starten van gesprek: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickMessages = productId
    ? [
        'Hoi! Is dit product nog beschikbaar?',
        "Kun je meer foto's sturen?",
        'Wat zijn de bezorgmogelijkheden?',
        'Is onderhandeling mogelijk?',
        'Hoi! Ik heb interesse in dit product.',
      ]
    : [
        'Hoi! Ik heb interesse in je producten.',
        'Kun je meer informatie geven over je werk?',
        'Wat zijn je bezorgmogelijkheden?',
        'Heb je nog andere producten beschikbaar?',
        'Hoi! Ik zou graag meer willen weten over je creaties.',
      ];

  if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user)) {
    return (
      <button
        type="button"
        onClick={() => goToLoginForChat()}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
          shadow-md hover:shadow-lg
          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
          ${className}
        `}
      >
        <MessageCircle className="w-4 h-4" />
        <span>{t('chat.loginToChat')}</span>
      </button>
    );
  }

  return (
    <>
      {successConversationId && (
        <div
          className={`fixed left-3 right-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:left-auto sm:right-4 sm:bottom-auto sm:top-4 z-[235] rounded-xl border border-emerald-200 bg-white p-4 shadow-xl ${nativeMounted ? 'hc-native-msg-success-toast' : ''}`}
          role="status"
        >
          <p className="text-sm font-semibold text-gray-900">
            {t('common.messageSentConfirm')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/messages?conversation=${successConversationId}`}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 min-h-[44px]"
              onClick={() => setSuccessConversationId(null)}
            >
              {t('common.openConversation')}
            </Link>
            <button
              type="button"
              onClick={() => setSuccessConversationId(null)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 min-h-[44px]"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (status === 'loading') {
            openModalAfterSessionRef.current = true;
            return;
          }
          setShowModal(true);
        }}
        disabled={isLoading}
        title={isLoading ? undefined : t('common.startChat')}
        aria-busy={status === 'loading'}
        aria-label={
          isLoading
            ? t('common.loadingDots')
            : status === 'loading'
              ? t('common.loadingDots')
              : t('common.startChat')
        }
        className={`
          flex min-h-[44px] items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200
          shadow-md hover:shadow-lg touch-manipulation
          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          w-full sm:w-auto text-sm sm:text-base
          ${className}
        `}
      >
        <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
        <span>
          {isLoading
            ? t('common.sending')
            : status === 'loading'
              ? t('common.loadingDots')
              : t('common.startChat')}
        </span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[230] flex items-end justify-center sm:items-center sm:p-4 bg-black/65 backdrop-blur-[2px]"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setInitialMessage('');
            }
          }}
        >
          <div
            className={`product-msg-modal-inner w-full sm:max-w-md max-h-[88dvh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden outline-none ${nativeMounted ? 'hc-native-product-msg-modal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-msg-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 p-3 sm:p-4 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-2">
                <h2
                  id="product-msg-modal-title"
                  className="text-base sm:text-lg font-semibold text-gray-900 pr-2"
                >
                  {t('common.startChatWith').replace('{name}', sellerName)}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setInitialMessage('');
                  }}
                  className="shrink-0 rounded-full p-2 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3">
              <p className="text-sm text-gray-800 bg-sky-50 border border-sky-200 rounded-lg p-3">
                {productId ? t('common.chatIntroProduct') : t('common.chatIntroGeneral')}
              </p>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {t('common.quickMessages')}
                  <span className="block text-xs font-normal text-gray-600 mt-0.5">
                    {t('common.quickMessagesHint')}
                  </span>
                </h3>
                <div className="space-y-2">
                  {quickMessages.map((message, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleQuickMessage(message)}
                      disabled={isLoading}
                      className="w-full text-left rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-60 transition-colors min-h-[48px]"
                    >
                      {message}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium text-gray-600">OF</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('common.typeYourMessage')}
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder={t('common.typeMessagePlaceholder')}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base text-gray-900 placeholder:text-gray-500"
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleStartChat}
                  disabled={isLoading || !initialMessage.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3.5 min-h-[48px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>{isLoading ? t('common.sending') : t('common.sendMessage')}</span>
                </button>
              </div>
            </div>

            <div className="shrink-0 p-3 sm:p-4 border-t border-gray-200 bg-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setInitialMessage('');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 min-h-[48px] border-2 border-gray-400 bg-white text-gray-900 rounded-xl hover:bg-gray-50 font-semibold"
              >
                <X className="w-5 h-5 text-gray-800" />
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
