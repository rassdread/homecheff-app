"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";

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
  const currentLabel = activeTab === 'follows' ? 'verkopers die je volgt' : 'je fans';

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('follows')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'follows'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Volgt ({follows.length})
        </button>
        <button
          onClick={() => setActiveTab('fans')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'fans'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Fans ({fans.length})
        </button>
      </div>

      {/* Content */}
      {!currentItems.length ? (
        <div className="rounded-xl border p-6 bg-white text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'follows' ? (
              <UserPlus className="w-8 h-8 text-gray-400" />
            ) : (
              <Users className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nog geen {currentLabel}
          </h3>
          <p className="text-gray-600 text-sm">
            {activeTab === 'follows' 
              ? 'Zodra je iemand volgt, verschijnt het hier.'
              : 'Zodra iemand fan van je wordt, verschijnt het hier.'
            }
          </p>
        </div>
      ) : (
        <ul className="rounded-xl border bg-white divide-y">
          {currentItems.map((item) => {
            const user = item.seller || item.user;
            const displayName = user?.name || user?.username || "Gebruiker";
            const avatar = user?.avatar || "/avatar-placeholder.png";
            const href = activeTab === 'follows' 
              ? `/seller/${user?.id}` 
              : `/profile/${user?.id}`;

            return (
              <li key={item.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <img 
                  src={avatar} 
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" 
                />
                <div className="flex-1">
                  <Link 
                    href={href}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {displayName}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {activeTab === 'follows' 
                      ? `Sinds ${new Date(item.createdAt).toLocaleDateString('nl-NL')}`
                      : `Fan sinds ${new Date(item.createdAt).toLocaleDateString('nl-NL')}`
                    }
                  </p>
                </div>
                {activeTab === 'fans' && (
                  <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                    Fan
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
