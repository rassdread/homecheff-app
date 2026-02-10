'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

interface MessageInputProps {
  conversationId: string;
  currentUserId: string;
  onSendMessage: (message: {
    text: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }) => void;
  disabled?: boolean;
}

export default function MessageInput({ 
  conversationId, 
  currentUserId, 
  onSendMessage, 
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for typing indicators
    socket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
      // Handle typing indicators from other users
      // You can implement this UI feedback later
    });

    return () => {
      socket.off('user-typing');
    };
  }, [socket]);

  const handleSendMessage = async () => {
    if (!message.trim() && !attachment) return;

    const messageData = {
      text: message.trim() || '',
      messageType: attachment ? (attachment.type.startsWith('image/') ? 'IMAGE' : 'FILE') as 'IMAGE' | 'FILE' : 'TEXT' as 'TEXT',
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type
    };

    onSendMessage(messageData);
    
    // Reset form
    setMessage('');
    setAttachment(null);
    
    // Stop typing indicator
    setIsTyping(false);
    if (socket) {
      socket.emit('typing-stop', { conversationId, userId: currentUserId });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Typing indicator
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing-start', { conversationId, userId: currentUserId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing-stop', { conversationId, userId: currentUserId });
      }
    }, 1000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Bestand is te groot. Maximum 10MB toegestaan.');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Bestandstype niet ondersteund.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();

      setAttachment({
        url,
        name: file.name,
        type: file.type
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fout bij uploaden van bestand.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t bg-white p-3 sm:p-4 sticky bottom-0 z-10">
      {/* Attachment preview - Like WhatsApp */}
      {attachment && (
        <div className="mb-3 p-3 bg-gray-100 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {attachment.type.startsWith('image/') ? (
              <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
            <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
          </div>
          <button
            onClick={removeAttachment}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message input - WhatsApp/iMessage style */}
      <div className="flex items-end space-x-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 flex-shrink-0 active:scale-95 transition-all rounded-full hover:bg-gray-100"
          aria-label="Bijlage toevoegen"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative min-w-0">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Typ je bericht..."
            disabled={disabled}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-all"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px'
            }}
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={disabled || (!message.trim() && !attachment) || isUploading}
          className="p-2 sm:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-all shadow-lg hover:shadow-xl"
          aria-label="Verstuur bericht"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.txt,.doc,.docx"
        className="hidden"
        aria-label="Bestand uploaden"
      />
    </div>
  );
}

