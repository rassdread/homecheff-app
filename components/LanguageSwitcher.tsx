'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation, type Language } from '@/hooks/useTranslation';

export default function LanguageSwitcher() {
  const { language, changeLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(typeof document !== 'undefined');
  }, []);

  // Calculate dropdown position when opening (onder de knop, altijd zichtbaar)
  useEffect(() => {
    if (isOpen && buttonRef.current && typeof window !== 'undefined') {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const padding = 8;
          setDropdownPosition({
            top: rect.bottom + padding,
            left: Math.min(rect.left, window.innerWidth - 180) // 180 = dropdown breedte, blijft in beeld
          });
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  // Sluiten bij klik buiten (click i.p.v. mousedown zodat keuze in dropdown eerst registreert)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !dropdownRef.current?.contains(target) &&
        !dropdownMenuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    changeLanguage(newLanguage);
    setIsOpen(false);
  };

  const dropdownContent = isOpen && mounted && dropdownPosition.top > 0 && (
    <div
      ref={dropdownMenuRef}
      className="fixed w-36 sm:w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 99999
      }}
    >
      {availableLanguages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => handleLanguageChange(lang.code as Language)}
          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
            language === lang.code ? 'bg-primary-50 text-primary-brand' : 'text-gray-700'
          }`}
        >
          <span className="text-lg">{lang.flag}</span>
          <span className="font-medium">{lang.name}</span>
          {language === lang.code && (
            <div className="ml-auto w-2 h-2 bg-primary-brand rounded-full" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-primary-brand transition-colors rounded-lg hover:bg-gray-50"
        title="Taal wijzigen"
        aria-label="Taal wijzigen"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4 flex-shrink-0" />
        <span className="text-base sm:text-lg">{currentLanguage?.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {mounted && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
