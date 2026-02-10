'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTileTracking } from '@/hooks/useTileTracking';

interface StatTileProps {
  tileId: string;
  tileName: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald' | 'gray';
  subtitle?: string | React.ReactNode;
  metadata?: Record<string, any>;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  dashboard?: string;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  gray: 'bg-gray-100 text-gray-600',
};

export default function StatTile({
  tileId,
  tileName,
  value,
  unit,
  icon: Icon,
  iconColor = 'blue',
  subtitle,
  metadata = {},
  className = '',
  onClick,
  children,
  dashboard = 'financial',
}: StatTileProps) {
  // Extract numeric value for tracking
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || undefined
    : value;

  const { tileRef, handleClick } = useTileTracking({
    tileId,
    tileName,
    dashboard,
    metric: tileId.replace(`${dashboard}-`, '').replace(/-/g, '_'),
    value: numericValue,
    unit: unit || (typeof value === 'string' && value.includes('€') ? 'EUR' : 'count'),
    metadata,
  });

  const handleTileClick = () => {
    handleClick('tile_interaction');
    if (onClick) onClick();
  };

  return (
    <div
      ref={tileRef as React.RefObject<HTMLDivElement>}
      onClick={handleTileClick}
      className={`bg-white rounded-xl shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{tileName}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[iconColor]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {children}
    </div>
  );
}

// Secondary stat tile for larger gradient tiles
interface SecondaryStatTileProps {
  tileId: string;
  tileName: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald' | 'gray';
  gradient: string;
  borderColor: string;
  textColor: string;
  metadata?: Record<string, any>;
  children?: React.ReactNode;
}

export function SecondaryStatTile({
  tileId,
  tileName,
  value,
  unit,
  icon: Icon,
  iconColor = 'emerald',
  gradient,
  borderColor,
  textColor,
  metadata = {},
  children,
}: SecondaryStatTileProps) {
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || undefined
    : value;

  const { tileRef, handleClick } = useTileTracking({
    tileId,
    tileName,
    dashboard: 'financial',
    metric: tileId.replace('financial-', '').replace(/-/g, '_'),
    value: numericValue,
    unit: unit || (typeof value === 'string' && value.includes('€') ? 'EUR' : 'count'),
    metadata,
  });

  return (
    <div
      ref={tileRef as React.RefObject<HTMLDivElement>}
      onClick={() => handleClick('secondary_stat_view')}
      className={`bg-gradient-to-br ${gradient} rounded-xl shadow-sm border border-${borderColor} p-6 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{tileName}</h3>
        <Icon className={`w-5 h-5 text-${textColor}`} />
      </div>
      <p className={`text-3xl font-bold text-${textColor}`}>
        {value}
      </p>
      {children}
    </div>
  );
}
