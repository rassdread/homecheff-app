'use client';

import { useState, useRef, useEffect } from 'react';

interface VersionTileProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'all';
  animationDelay?: number;
}

export default function VersionTile({ 
  children, 
  className = '', 
  onClick, 
  hoverEffect = 'all',
  animationDelay = 0 
}: VersionTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), animationDelay);
        }
      },
      { threshold: 0.1 }
    );

    if (tileRef.current) {
      observer.observe(tileRef.current);
    }

    return () => observer.disconnect();
  }, [animationDelay]);

  const getHoverStyles = () => {
    if (!isHovered) return '';
    
    let styles = '';
    if (hoverEffect === 'lift' || hoverEffect === 'all') {
      styles += 'transform: translateY(-8px) ';
    }
    if (hoverEffect === 'scale' || hoverEffect === 'all') {
      styles += 'scale(1.02) ';
    }
    if (hoverEffect === 'glow' || hoverEffect === 'all') {
      styles += '; box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 30px rgba(16, 185, 129, 0.2)';
    }
    
    return styles;
  };

  return (
    <div
      ref={tileRef}
      className={`
        transition-all duration-500 ease-out cursor-pointer
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${className}
      `}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0,0,0,0.15), 0 0 30px rgba(16, 185, 129, 0.2)'
          : '0 8px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
      
      {/* Verslavende Shine Effect */}
      <div 
        className={`
          absolute inset-0 opacity-0 transition-opacity duration-700 pointer-events-none
          ${isHovered ? 'opacity-100' : ''}
        `}
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.8s ease-out'
        }}
      />
      
      {/* Pulsing Border Effect */}
      <div 
        className={`
          absolute inset-0 rounded-3xl border-2 transition-all duration-300
          ${isHovered ? 'border-emerald-400 opacity-100' : 'border-transparent opacity-0'}
        `}
        style={{
          animation: isHovered ? 'pulse 2s infinite' : 'none'
        }}
      />
    </div>
  );
}
