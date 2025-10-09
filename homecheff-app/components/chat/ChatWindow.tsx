'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageEncryption from './MessageEncryption';
import TypingIndicator from './TypingIndicator';
import { ArrowLeft, MoreVertical, Phone, Video, Circle } from 'lucide-react';
import Image from 'next/image';
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

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

interface Message {
  id: string;
  text: string | null;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_SHARE' | 'SYSTEM';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  createdAt: string;
  readAt?: string | null;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
}

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
  onMessagesRead?: () => void;
}

export default function ChatWindow({ conversation, onBack, onMessagesRead }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get current user ID from session
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.id) {
            setCurrentUserId(data.user.id);
            console.log('[ChatWindow] Current user ID set:', data.user.id);
          }
        }
      } catch (error) {
        console.error('[ChatWindow] Error fetching current user ID:', error);
      }
    };
    
    fetchCurrentUserId();
  }, [session?.user?.email]);

  useEffect(() => {
    if (!socket || !conversation.id || !currentUserId) {
      console.log('[ChatWindow] Not setting up socket listeners:', { 
        hasSocket: !!socket, 
        conversationId: conversation.id, 
        currentUserId 
      });
      return;
    }

    console.log('[ChatWindow] Setting up socket listeners for conversation:', conversation.id);

    // Join conversation room
    socket.emit('join-conversation', conversation.id);
    console.log('[ChatWindow] Joined conversation room:', conversation.id);

    // Listen for new messages
    const handleNewMessage = (newMessage: Message) => {
      console.log('[ChatWindow] Received new message via socket:', newMessage.id, 'from user:', newMessage.User.id);
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('[ChatWindow] Message already exists, skipping:', newMessage.id);
          return prev;
        }
        console.log('[ChatWindow] Adding new message to list. Total messages now:', prev.length + 1);
        return [...prev, newMessage];
      });
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('messageReceived', {
        detail: { 
          message: newMessage,
          conversationId: conversation.id 
        }
      }));
      
      // Scroll to bottom on new message
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    };

    socket.on('new-message', handleNewMessage);

    // Listen for message sent acknowledgment
    socket.on('message-sent', (data: { messageId: string; conversationId: string; timestamp: string }) => {
      console.log('[ChatWindow] Message sent acknowledgment:', data);
      // You can use this to update UI or remove loading states
    });

    // Listen for typing indicators - WhatsApp/Telegram style
    socket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
      console.log('[ChatWindow] User typing event:', data);
      if (data.userId !== currentUserId) {
        setIsTyping(data.isTyping);
        // Auto-hide typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    // Listen for online status
    socket.on('user-online', (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === conversation.otherParticipant?.id) {
        setIsOnline(data.isOnline);
      }
    });

    // Listen for message errors
    socket.on('message-error', (error: { error: string; details?: string }) => {
      console.error('[ChatWindow] Message error:', error);
      alert(`Fout bij verzenden: ${error.error}${error.details ? ` - ${error.details}` : ''}`);
    });

    return () => {
      console.log('[ChatWindow] Cleaning up socket listeners for conversation:', conversation.id);
      socket.emit('leave-conversation', conversation.id);
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent');
      socket.off('user-typing');
      socket.off('user-online');
      socket.off('message-error');
    };
  }, [socket, conversation.id, currentUserId, conversation.otherParticipant?.id]);

  // Aggressive polling for Vercel - always poll as backup
  useEffect(() => {
    if (!conversation.id) return;
    
    console.log('[ChatWindow] Starting aggressive polling for Vercel reliability...');
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/conversations/${conversation.id}/messages-fast?page=1&limit=50`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const latestMessages = data.messages || [];
          
          if (latestMessages.length !== messages.length) {
            console.log('[ChatWindow] Polling found message count change:', latestMessages.length, 'vs', messages.length);
            loadMessages(); // Reload all messages
          }
        }
      } catch (error) {
        console.error('[ChatWindow] Polling error:', error);
      }
    }, 1500); // Poll every 1.5 seconds for reliability
    
    return () => {
      console.log('[ChatWindow] Stopping polling');
      clearInterval(pollInterval);
    };
  }, [conversation.id, messages.length]);

  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  // Also reload messages when conversation object changes
  useEffect(() => {
    if (conversation.id) {
      console.log('[ChatWindow] Conversation changed, reloading messages');
      loadMessages();
    }
  }, [conversation]);

  // Reload messages when conversation changes (e.g., after sending initial message)
  useEffect(() => {
    const handleConversationUpdate = () => {
      console.log('[ChatWindow] Conversation update event received, reloading messages');
      loadMessages();
    };

    const handleMessageSent = () => {
      console.log('[ChatWindow] Message sent event received, reloading messages');
      loadMessages();
    };

    // Listen for conversation updates and message sent events
    window.addEventListener('conversationUpdated', handleConversationUpdate);
    window.addEventListener('messageSent', handleMessageSent);
    
    return () => {
      window.removeEventListener('conversationUpdated', handleConversationUpdate);
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, [conversation.id]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    const markConversationAsRead = async () => {
      if (!conversation.id || !currentUserId) return;
      
      try {
        // Mark all unread messages in this conversation as read
        const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // The API already marks messages as read when fetching them
          // Trigger refresh of conversation list
          if (onMessagesRead) {
            onMessagesRead();
          }
          
          // Dispatch custom event to refresh other components
          window.dispatchEvent(new CustomEvent('messagesRead'));
        }
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    };
    
    // Mark as read after a short delay to ensure messages are loaded
    const timer = setTimeout(() => {
      markConversationAsRead();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [conversation.id, currentUserId, onMessagesRead]);

  const loadMessages = async (pageNum = 1, append = false) => {
    try {
      console.log('[ChatWindow] Loading messages for conversation:', conversation.id, 'page:', pageNum);
      
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Use fast API endpoint for better performance
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages-fast?page=${pageNum}&limit=50`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      );

      console.log('[ChatWindow] Messages response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ChatWindow] Messages data received:', data);
      
      const { messages: newMessages } = data;

      if (append) {
        setMessages(prev => {
          const combined = [...newMessages, ...prev];
          console.log('[ChatWindow] Appending messages. Total:', combined.length);
          return combined;
        });
      } else {
        console.log('[ChatWindow] Setting messages. Count:', newMessages?.length || 0);
        setMessages(newMessages || []);
      }

      console.log('[ChatWindow] Messages set:', newMessages?.length || 0);
      setHasMoreMessages((newMessages?.length || 0) === 50);
      setPage(pageNum);
    } catch (error) {
      console.error('[ChatWindow] Error loading messages:', error);
      // Set empty messages array on error to avoid showing loading state
      setMessages([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreMessages = () => {
    if (!isLoadingMore && hasMoreMessages) {
      loadMessages(page + 1, true);
    }
  };

  const handleSendMessage = async (messageData: {
    text: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }) => {
    if (!currentUserId) {
      console.error('[ChatWindow] No current user ID available');
      alert('Gebruiker niet gevonden. Probeer opnieuw in te loggen.');
      return;
    }

    try {
      console.log('[ChatWindow] Sending message via API (Vercel reliable method):', {
        conversationId: conversation.id,
        senderId: currentUserId,
        textLength: messageData.text.length,
        messageType: messageData.messageType
      });

      // Send message via API first (more reliable on Vercel)
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageData.text,
          messageType: messageData.messageType,
          attachmentUrl: messageData.attachmentUrl,
          attachmentName: messageData.attachmentName,
          attachmentType: messageData.attachmentType,
        }),
      });

      if (response.ok) {
        console.log('[ChatWindow] Message sent via API successfully');
        
        // Reload messages immediately for both sender and receiver
        setTimeout(() => {
          console.log('[ChatWindow] Reloading messages after API send');
          loadMessages();
        }, 300);
      } else {
        throw new Error(`API send failed: ${response.status}`);
      }

      // Also try socket as backup (but don't rely on it)
      if (socket) {
        socket.emit('send-message', {
          conversationId: conversation.id,
          senderId: currentUserId,
          text: messageData.text,
          messageType: messageData.messageType,
          attachmentUrl: messageData.attachmentUrl,
          attachmentName: messageData.attachmentName,
          attachmentType: messageData.attachmentType,
        });
        console.log('[ChatWindow] Message also sent via socket as backup');
      }
      
    } catch (error) {
      console.error('[ChatWindow] Error sending message:', error);
      alert('Fout bij verzenden van bericht. Probeer het opnieuw.');
    }
  };

  const formatPrice = (priceCents: number) => {
    return `€${(priceCents / 100).toFixed(2)}`;
  };

  const getDisplayNameForConversation = (user: Conversation['otherParticipant']) => {
    if (!user) return 'Onbekend';
    return getDisplayName(user);
  };

  // Encryption functions
  const handleEncryptMessage = async (messageId: string, key: string) => {
    try {
      const response = await fetch('/api/messages/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, encryptionKey: key })
      });

      if (!response.ok) {
        throw new Error('Encryption failed');
      }

      // Reload messages to show encrypted state
      loadMessages();
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  };

  const handleDecryptMessage = async (messageId: string, key: string): Promise<string> => {
    try {
      const response = await fetch('/api/messages/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, encryptionKey: key })
      });

      if (!response.ok) {
        throw new Error('Decryption failed');
      }

      const data = await response.json();
      return data.decryptedText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white touch-pan-y">
      {/* Header - Mobile optimized */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {/* Back button only shown on mobile or when onBack is provided */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0 md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {conversation.otherParticipant?.profileImage ? (
              <Image
                src={conversation.otherParticipant.profileImage}
                alt={getDisplayNameForConversation(conversation.otherParticipant)}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-medium">
                  {getDisplayNameForConversation(conversation.otherParticipant)?.charAt(0)}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 truncate">
                <ClickableName 
                  user={conversation.otherParticipant}
                  className="hover:text-primary-600 transition-colors"
                />
              </h2>
              {/* Connection status and online status - WhatsApp style */}
              <div className="flex items-center gap-1">
                {/* Connection status indicator */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const isVercelPro = !isLocalhost && window.location.hostname.includes('vercel.app');
                    
                    if (isLocalhost) {
                      return (
                        <>
                          <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                          <p className="text-xs text-gray-500">Local</p>
                        </>
                      );
                    }
                    
                    if (isVercelPro) {
                      return (
                        <>
                          <Circle className={`w-2 h-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-yellow-500 text-yellow-500'}`} />
                          <p className="text-xs text-gray-500">
                            {isConnected ? 'PRO Live' : 'PRO Connecting...'}
                          </p>
                        </>
                      );
                    }
                    
                    return (
                      <>
                        <Circle className={`w-2 h-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                        <p className="text-xs text-gray-500">
                          {isConnected ? 'Live' : 'Polling'}
                        </p>
                      </>
                    );
                  })()}
                </div>
                
                {isTyping ? (
                  <p className="text-xs text-blue-500 animate-pulse ml-2">aan het typen...</p>
                ) : isOnline ? (
                  <div className="flex items-center gap-1 ml-2">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    <p className="text-xs text-gray-500">online</p>
                  </div>
                ) : conversation.product ? (
                  <p className="text-xs text-gray-500 truncate ml-2">
                    Over: {conversation.product.title}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => {
              console.log('[ChatWindow] Manual reload triggered');
              loadMessages();
            }}
            className="p-2 hover:bg-gray-100 rounded-full text-xs text-gray-500 bg-gray-50 border"
            title="Herlaad berichten"
          >
            🔄
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Product info banner - Improved design */}
      {conversation.product && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {conversation.product.Image[0] && (
              <div className="relative flex-shrink-0">
                <Image
                  src={conversation.product.Image[0].fileUrl}
                  alt={conversation.product.title}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover shadow-sm"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate text-sm">{conversation.product.title}</h3>
              <p className="text-sm text-blue-600 font-semibold">
                {formatPrice(conversation.product.priceCents)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages - Mobile scroll optimized */}
      <div className="flex-1 overflow-hidden -webkit-overflow-scrolling-touch" ref={messagesContainerRef}>
        {/* Debug reload button - always visible */}
        <div className="p-2 text-center bg-blue-50 border-b border-blue-200">
          <button
            onClick={() => {
              console.log('[ChatWindow] Debug reload triggered');
              loadMessages();
            }}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 px-4 py-2 rounded-lg border-2 border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            🔄 Herlaad Berichten ({messages.length})
          </button>
          <p className="text-xs text-blue-600 mt-1">
            Klik om berichten handmatig te herladen
          </p>
        </div>
        
        {hasMoreMessages && (
          <div className="p-3 sm:p-4 text-center">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              {isLoadingMore ? 'Laden...' : 'Meer berichten laden'}
            </button>
          </div>
        )}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
          onMessagesRead={onMessagesRead}
          onEncryptMessage={handleEncryptMessage}
          onDecryptMessage={handleDecryptMessage}
        />
        {/* Typing indicator at bottom - WhatsApp/Telegram style */}
        {isTyping && (
          <div className="px-4 pb-2">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Message input */}
      <MessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
        disabled={!socket}
      />
    </div>
  );
}



