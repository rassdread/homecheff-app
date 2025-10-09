'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // Fetch only unread count for messages
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for message events
  useEffect(() => {
    const handleMessagesRead = () => {
      fetchUnreadCount();
    };

    window.addEventListener('messagesRead', handleMessagesRead);
    window.addEventListener('unreadCountUpdate', handleMessagesRead);
    
    return () => {
      window.removeEventListener('messagesRead', handleMessagesRead);
      window.removeEventListener('unreadCountUpdate', handleMessagesRead);
    };
  }, []);


  const handleBellClick = () => {
    // Always redirect to messages page when bell is clicked
    router.push('/messages');
  };

  return (
    <div className="relative">
      {/* Bell Button - Always redirects to messages */}
      <button
        onClick={handleBellClick}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Berichten"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

