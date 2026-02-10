'use client';

/**
 * Typing indicator - WhatsApp/Telegram style
 * Shows animated dots when someone is typing
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-4 py-2 bg-gray-200 rounded-2xl rounded-tl-sm w-fit animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

