"use client";

import { useEffect, useState } from "react";
import { Users, Heart, Star, Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";
import SafeImage from "./SafeImage";
import { getDisplayName } from "@/lib/displayName";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";

type UserStats = {
  fansCount: number;
  totalFavorites: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  totalProps: number;
};

type UserStatsTileProps = {
  userId: string | null;
  userName?: string | null;
  userUsername?: string | null;
  userAvatar?: string | null;
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
  className?: string;
};

export default function UserStatsTile({ 
  userId, 
  userName,
  userUsername,
  userAvatar,
  displayFullName,
  displayNameOption,
  className = "" 
}: UserStatsTileProps) {
  const { isMobile } = useMobileOptimization();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/user/${userId}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (!userId) {
    return null;
  }

  const userDisplayName = userName || userUsername || "Gebruiker";
  const profileHref = userUsername ? `/user/${userUsername}` : `/user/${userId}`;

  if (loading) {
    return (
      <div className={`pt-4 border-t border-gray-100 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statsItems = [
    {
      icon: Users,
      label: "Fans",
      value: stats.fansCount,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      hoverColor: "hover:bg-blue-100",
      tooltip: "Totaal aantal fans"
    },
    {
      icon: Heart,
      label: "Favorieten",
      value: stats.totalFavorites,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-100",
      hoverColor: "hover:bg-pink-100",
      tooltip: "Totaal favorieten over alle items"
    },
    {
      icon: ThumbsUp,
      label: "Props",
      value: stats.totalProps,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      hoverColor: "hover:bg-purple-100",
      tooltip: "Totaal props over alle items"
    },
    {
      icon: Star,
      label: "Reviews",
      value: stats.totalReviews,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-100",
      hoverColor: "hover:bg-yellow-100",
      tooltip: "Totaal reviews over alle items"
    },
    {
      icon: Star,
      label: "Rating",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      hoverColor: "hover:bg-amber-100",
      tooltip: "Gemiddelde rating over alle items"
    },
    {
      icon: Eye,
      label: "Views",
      value: stats.totalViews > 0 ? formatViews(stats.totalViews) : "0",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      hoverColor: "hover:bg-emerald-100",
      tooltip: "Totaal views over alle items"
    }
  ];

  return (
    <Link 
      href={profileHref}
      className={`pt-4 border-t border-gray-200 block hover:bg-gray-50 rounded-lg transition-colors ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* User Header */}
      <div className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity group">
        <div className="flex-shrink-0 relative w-10 h-10">
          {userAvatar ? (
            <SafeImage
              src={userAvatar}
              alt={userDisplayName}
              width={40}
              height={40}
              className="rounded-full object-cover border-2 border-primary-100 group-hover:border-primary-300 transition-colors"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center border-2 border-primary-200">
              <span className="text-primary-600 font-semibold text-sm">
                {userDisplayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
            {getDisplayName({
              id: userId,
              name: userName || null,
              username: userUsername || null,
              displayFullName: displayFullName,
              displayNameOption: displayNameOption
            }) || 'Gebruiker'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 text-center font-medium">Totaal over alle items</p>
        <div className="grid grid-cols-6 gap-2">
          {statsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 ${item.bgColor} ${item.borderColor} ${item.hoverColor} hover:shadow-lg hover:scale-105 transition-all duration-200 group cursor-pointer`}
                title={item.tooltip || `${item.label}: ${typeof item.value === 'string' ? item.value : formatNumber(item.value)}`}
              >
                <Icon className={`w-5 h-5 ${item.color} ${isMobile ? 'mb-0' : 'mb-1.5'} group-hover:scale-110 transition-transform`} />
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold ${item.color} leading-tight`}>
                  {typeof item.value === 'string' ? item.value : formatNumber(item.value)}
                </div>
                {!isMobile && (
                  <div className="text-[10px] text-gray-600 mt-0.5 truncate w-full text-center font-medium">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function formatViews(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

