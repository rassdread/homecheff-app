'use client';

import React, { useRef } from 'react';
import EmojiPickerButton from '@/components/chat/EmojiPicker';

interface EmojiInputWrapperProps {
  children: React.ReactElement;
  onEmojiSelect: (emoji: string) => void;
  category?: 'CHEFF' | 'GARDEN' | 'DESIGNER' | 'auto';
  className?: string;
}

/**
 * Wrapper component die een emoji picker toevoegt aan input/textarea velden
 */
export default function EmojiInputWrapper({ 
  children, 
  onEmojiSelect, 
  category = 'auto',
  className = '' 
}: EmojiInputWrapperProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const handleEmojiClick = (emoji: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const value = input.value;
      
      // Insert emoji at cursor position
      const newValue = value.substring(0, start) + emoji + value.substring(end);
      
      // Update value
      if ('value' in input) {
        input.value = newValue;
      }
      
      // Trigger onChange event
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      // Set cursor position after emoji
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    }
    onEmojiSelect(emoji);
  };

  // Clone child element and add ref
  const childWithRef = React.cloneElement(children, {
    ref: (node: HTMLInputElement | HTMLTextAreaElement | null) => {
      inputRef.current = node;
      // Preserve original ref if it exists
      const originalRef = (children as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef) {
        originalRef.current = node;
      }
    }
  });

  return (
    <div className={`relative ${className}`}>
      {childWithRef}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <EmojiPickerButton 
          onEmojiClick={handleEmojiClick} 
          category={category}
        />
      </div>
    </div>
  );
}

