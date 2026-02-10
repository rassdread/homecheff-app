'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface DeliveryCountdownTimerProps {
  deliveryOrderId: string;
  className?: string;
}

interface CountdownData {
  remainingMinutes: number;
  status: 'on_time' | 'warning' | 'urgent' | 'overdue';
  deadline: string | null;
}

export default function DeliveryCountdownTimer({ 
  deliveryOrderId, 
  className = '' 
}: DeliveryCountdownTimerProps) {
  const [countdown, setCountdown] = useState<CountdownData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountdown = async () => {
      try {
        const response = await fetch(`/api/delivery/orders/${deliveryOrderId}/countdown`);
        if (response.ok) {
          const data = await response.json();
          setCountdown(data);
        }
      } catch (error) {
        console.error('Error fetching countdown:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountdown();
    
    // Update every 30 seconds
    const interval = setInterval(fetchCountdown, 30000);
    
    return () => clearInterval(interval);
  }, [deliveryOrderId]);

  if (loading || !countdown) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <Clock className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Laden...</span>
      </div>
    );
  }

  const { remainingMinutes, status } = countdown;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const getStatusColor = () => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = () => {
    if (status === 'overdue' || status === 'urgent') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  const formatTime = () => {
    if (remainingMinutes < 0) {
      return `${Math.abs(remainingMinutes)} min te laat`;
    }
    if (hours > 0) {
      return `${hours}u ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">
        {status === 'overdue' ? '⚠️ ' : ''}
        {formatTime()}
      </span>
      {status === 'overdue' && (
        <span className="text-xs font-semibold">TE LAAT!</span>
      )}
    </div>
  );
}


