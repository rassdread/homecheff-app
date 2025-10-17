"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserPlus, Users } from "lucide-react";
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

type Follow = { 
  id: string; 
  createdAt: string;
  seller?: { 
    id: string; 
    name?: string | null; 
    username?: string | null;
    avatar?: string | null 
  };
  user?: { 
    id: string; 
    name?: string | null; 
    username?: string | null;
    avatar?: string | null 
  };
};

export default function FansAndFollowsList() {
  const [follows, setFollows] = useState<Follow[]>([]);
  const [fans, setFans] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'follows' | 'fans'>('follows');

  useEffect(() => {
    (async () => {
      setLoading(true);
      
      // Fetch follows (people you follow)
      const followsRes = await fetch("/api/profile/follows");
      if (followsRes.ok) {
        const followsData = await followsRes.json();
        setFollows(followsData.items || []);
      }
      
      // Fetch fans (people who follow you)
      const fansRes = await fetch("/api/follows/fans");
      if (fansRes.ok) {
        const fansData = await fansRes.json();
        setFans(fansData.fans || []);
      }
      
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4 bg-white animate-pulse h-24" />
        <div className="rounded-xl border p-4 bg-white animate-pulse h-24" />
      </div>
    );
  }

  const currentItems = activeTab === 'follows' ? follows : fans;
  const currentLabel = activeTab === 'follows' ? 'fan' : 'fans';

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 rounded-t-xl">
        <nav className="flex space-x-1 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('follows')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative whitespace-nowrap ${
              activeTab === 'follows'
                ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <UserPlus className={`w-4 h-4 ${activeTab === 'follows' ? 'text-white' : 'text-gray-500'}`} />
            <span>Fan ({follows.length})</span>
            {activeTab === 'follows' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('fans')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative whitespace-nowrap ${
              activeTab === 'fans'
                ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'fans' ? 'text-white' : 'text-gray-500'}`} />
            <span>Fans ({fans.length})</span>
            {activeTab === 'fans' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      {!currentItems.length ? (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            {activeTab === 'follows' ? (
              <UserPlus className="w-10 h-10 text-gray-400" />
            ) : (
              <Users className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Nog geen {currentLabel}
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
            {activeTab === 'follows' 
              ? 'Zodra je fan wordt van iemand, verschijnt het hier.'
              : 'Zodra iemand fan van je wordt, verschijnt het hier.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 divide-y divide-gray-100">
          {currentItems.map((item) => {
            const user = item.seller || item.user;
            const avatar = user?.avatar || "/avatar-placeholder.png";
            const href = activeTab === 'follows' 
              ? `/seller/${user?.id}` 
              : `/profile/${user?.id}`;

            return (
              <div key={item.id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-all duration-200 group">
                <div className="relative">
                  <img 
                    src={avatar} 
                    alt={getDisplayName(user)}
                    className="w-14 h-14 rounded-full object-cover border-3 border-gray-200 group-hover:border-emerald-300 transition-colors shadow-sm" 
                  />
                  {activeTab === 'fans' && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ClickableName 
                    user={user}
                    className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors text-lg"
                    fallbackText="Gebruiker"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === 'follows' 
                      ? `Fan sinds ${new Date(item.createdAt).toLocaleDateString('nl-NL')}`
                      : `Fan sinds ${new Date(item.createdAt).toLocaleDateString('nl-NL')}`
                    }
                  </p>
                </div>
                {activeTab === 'fans' && (
                  <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full shadow-sm">
                    Fan
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
