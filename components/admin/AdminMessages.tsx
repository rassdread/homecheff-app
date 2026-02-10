'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Unlock, User, Calendar, RefreshCw, Search, Eye, Shield } from 'lucide-react';
import Image from 'next/image';

interface ConversationSummary {
  id: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  isEncrypted: boolean;
  participants: Array<{
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  }>;
  product?: {
    id: string;
    title: string;
  } | null;
  lastMessage?: {
    text: string | null;
    createdAt: string;
    isEncrypted: boolean;
    sender: {
      name: string | null;
      username: string | null;
    };
  } | null;
}

export default function AdminMessages() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'encrypted' | 'plaintext'>('all');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/messages');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setSelectedConversation(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (filterType === 'encrypted' && !conv.isEncrypted) return false;
    if (filterType === 'plaintext' && conv.isEncrypted) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesParticipants = conv.participants.some(p => 
        p.name?.toLowerCase().includes(query) || 
        p.username?.toLowerCase().includes(query)
      );
      const matchesProduct = conv.product?.title?.toLowerCase().includes(query);
      const matchesTitle = conv.title?.toLowerCase().includes(query);
      return matchesParticipants || matchesProduct || matchesTitle;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Berichten laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Berichten & Gesprekken
          </h2>
          <p className="text-gray-600">Overzicht van alle chat gesprekken en berichten</p>
        </div>
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Vernieuwen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Totaal Gesprekken</p>
              <p className="text-2xl font-semibold text-gray-900">{conversations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Lock className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Versleuteld</p>
              <p className="text-2xl font-semibold text-gray-900">
                {conversations.filter(c => c.isEncrypted).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Unlock className="w-8 h-8 text-gray-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Niet Versleuteld</p>
              <p className="text-2xl font-semibold text-gray-900">
                {conversations.filter(c => !c.isEncrypted).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Actief Gesprekken</p>
              <p className="text-2xl font-semibold text-gray-900">
                {conversations.filter(c => c.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek gebruikers, producten..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle gesprekken</option>
              <option value="encrypted">🔒 Alleen versleuteld</option>
              <option value="plaintext">🔓 Alleen niet-versleuteld</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Gesprekken ({filteredConversations.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen gesprekken gevonden</h3>
              <p className="text-gray-500">Er zijn geen gesprekken die voldoen aan de filters.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => fetchConversationMessages(conv.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {conv.isEncrypted ? (
                        <Lock className="w-4 h-4 text-green-600" />
                      ) : (
                        <Unlock className="w-4 h-4 text-gray-400" />
                      )}
                      <h4 className="font-medium text-gray-900">
                        {conv.participants.map(p => p.name || p.username || p.id).join(' & ')}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        conv.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {conv.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </div>

                    {conv.product && (
                      <p className="text-sm text-gray-600 mb-1">
                        💬 over: {conv.product.title}
                      </p>
                    )}

                    {conv.isEncrypted ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          End-to-end versleuteld
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-green-700">
                          <div>
                            <strong>Berichten:</strong> {conv.messageCount}
                          </div>
                          <div>
                            <strong>Laatst actief:</strong> {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString('nl-NL') : 'Onbekend'}
                          </div>
                          <div className="col-span-2">
                            <strong>Conversatie ID:</strong> {conv.id.substring(0, 8)}...
                          </div>
                        </div>
                        <p className="text-xs text-green-600 mt-2 italic">
                          ℹ️ Berichten kunnen niet worden gelezen door admin (privacy beschermd)
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        {conv.lastMessage ? (
                          <div className="bg-gray-50 border border-gray-200 rounded p-3">
                            <p className="text-sm text-gray-700">
                              <strong>{conv.lastMessage.sender.name || conv.lastMessage.sender.username}:</strong>{' '}
                              {conv.lastMessage.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(conv.lastMessage.createdAt).toLocaleString('nl-NL')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Nog geen berichten</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          📊 Totaal {conv.messageCount} bericht(en) • Klik om details te zien
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

