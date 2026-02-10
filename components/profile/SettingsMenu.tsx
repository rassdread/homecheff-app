'use client';

import { useState } from 'react';
import { Settings, User, Shield, Bell, Palette, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}

export default function SettingsMenu({ isOpen, onClose, activeSection, setActiveSection }: SettingsMenuProps & {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}) {
  const { t } = useTranslation();
  const [internalSection, setInternalSection] = useState(activeSection || 'profile');
  const currentSection = activeSection || internalSection;
  const updateSection = setActiveSection || setInternalSection;

  const menuSections = [
    {
      id: 'profile',
      title: t('navbar.myProfile') || t('navigation.profile') || 'Profile',
      icon: User,
      description: t('settingsMenu.profileDescription') || 'Personal information and profile photo'
    },
    {
      id: 'account',
      title: t('settingsMenu.accountTitle') || 'Account',
      icon: Shield,
      description: t('settingsMenu.accountDescription') || 'Password, email and security'
    },
    {
      id: 'notifications',
      title: t('notificationSettings.title') || 'Notifications',
      icon: Bell,
      description: t('settingsMenu.notificationsDescription') || 'Notifications and communication'
    },
    {
      id: 'appearance',
      title: t('settingsMenu.appearance') || 'Appearance',
      icon: Palette,
      description: t('settingsMenu.appearanceDescription') || 'Theme and interface settings'
    },
    {
      id: 'help',
      title: t('settingsMenu.help') || 'Help & Support',
      icon: HelpCircle,
      description: t('settingsMenu.helpDescription') || 'Frequently asked questions and contact'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('navigation.settings')}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {menuSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => updateSection(section.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      currentSection === section.id
                        ? 'bg-emerald-50 border-2 border-emerald-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        currentSection === section.id
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <button 
              onClick={async () => {
                const { signOut } = await import('next-auth/react');
                await signOut({ callbackUrl: "/" });
                window.location.href = "/";
              }}
              className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('navbar.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
