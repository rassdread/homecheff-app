'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

interface Conversation {
  id: string;
  title: string;
  otherParticipant?: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
}

interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
}

interface SimpleChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export default function SimpleChatWindow({ conversation, onBack }: SimpleChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  const currentUserId = (session?.user as any)?.id;

  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  // Reload messages when conversation is updated (e.g., after sending initial message)
  useEffect(() => {
    const handleConversationUpdate = (event: any) => {
      if (event.detail?.conversationId === conversation.id) {
        console.log('Conversation updated, reloading messages');
        loadMessages();
      }
    };

    window.addEventListener('conversationUpdated', handleConversationUpdate);
    
    return () => {
      window.removeEventListener('conversationUpdated', handleConversationUpdate);
    };
  }, [conversation.id]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentUserId) return;

    try {
      console.log('Sending message:', text);
      
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          messageType: 'TEXT'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      console.log('Message sent successfully:', data);

      // Add the new message to the local state immediately
      const newMessage: Message = {
        id: data.message.id,
        text: text.trim(),
        createdAt: data.message.createdAt,
        User: {
          id: currentUserId,
          name: session?.user?.name || null,
          username: (session?.user as any)?.username || null,
          profileImage: session?.user?.image || null,
        }
      };

      setMessages(prev => [...prev, newMessage]);

      // Scroll to bottom after sending
      setTimeout(() => {
        const messagesContainer = document.querySelector('.overflow-y-auto');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Er is een fout opgetreden bij het versturen van het bericht');
    }
  };

  const loadMessages = async () => {
    try {
      console.log('SimpleChatWindow: Loading messages for conversation:', conversation.id);
      setIsLoading(true);

      const response = await fetch(
        `/api/conversations/${conversation.id}/messages?page=1&limit=50`
      );

      console.log('SimpleChatWindow: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();
      console.log('SimpleChatWindow: Messages data:', data);

      setMessages(data.messages || []);
    } catch (error) {
      console.error('SimpleChatWindow: Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayNameForConversation = (user: Conversation['otherParticipant']) => {
    if (!user) return 'Onbekend';
    return getDisplayName(user);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Nu';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u`;
    
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {conversation.otherParticipant?.profileImage ? (
            <Image
              src={conversation.otherParticipant.profileImage}
              alt={getDisplayNameForConversation(conversation.otherParticipant)}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {getDisplayNameForConversation(conversation.otherParticipant)?.charAt(0)}
              </span>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-gray-900">
              <ClickableName 
                user={conversation.otherParticipant}
                className="hover:text-primary-600 transition-colors"
              />
            </h2>
            <p className="text-xs text-gray-500">
              {messages.length} berichten
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Berichten laden...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">Nog geen berichten</p>
              <p className="text-xs">Start het gesprek!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.User.id === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Typ je bericht..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                sendMessage(e.currentTarget.value.trim());
                e.currentTarget.value = '';
              }
            }}
            ref={(input) => {
              if (input) {
                input.focus();
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                sendMessage(input.value.trim());
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Verstuur
          </button>
        </div>
      </div>
    </div>
  );
}
