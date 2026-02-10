'use client';

import React, { createContext, useContext, useState } from 'react';

type PromoModalType = 'dashboard' | 'add' | 'messages' | 'profile' | 'dorpsplein-product' | 'inspiratie-item' | null;

interface PromoModalContextType {
  activeModal: PromoModalType;
  openModal: (modal: PromoModalType) => void;
  closeModal: () => void;
}

const PromoModalContext = createContext<PromoModalContextType | undefined>(undefined);

export function PromoModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModal, setActiveModal] = useState<PromoModalType>(null);

  const openModal = (modal: PromoModalType) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <PromoModalContext.Provider value={{ activeModal, openModal, closeModal }}>
      {children}
    </PromoModalContext.Provider>
  );
}

export function usePromoModal() {
  const context = useContext(PromoModalContext);
  if (context === undefined) {
    throw new Error('usePromoModal must be used within a PromoModalProvider');
  }
  return context;
}



