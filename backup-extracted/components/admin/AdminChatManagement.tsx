'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Unlock, User, Calendar, RefreshCw, Search, Eye, Shield, X, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';

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
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
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

interface Message {
  id: string;
  text: string | null;
  messageType: string;
  createdAt: string;
  readAt: string | null;
  isEncrypted: boolean;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
}

export default function AdminChatManagement() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'encrypted' | 'plaintext' | 'active' | 'inactive'>('all');

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
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectConversation = (conv: ConversationSummary) => {
    setSelectedConversation(conv);
    fetchConversationMessages(conv.id);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const filteredConversations = conversations.filter(conv => {
    // Filter by type
    if (filterType === 'encrypted' && !conv.isEncrypted) return false;
    if (filterType === 'plaintext' && conv.isEncrypted) return false;
    if (filterType === 'active' && !conv.isActive) return false;
    if (filterType === 'inactive' && conv.isActive) return false;
    
    // Filter by search
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
        <span className="ml-2 text-gray-600">Gesprekken laden...</span>
      </div>
    );
  }

  // Conversation Detail View
  if (selectedConversation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                {selectedConversation.participants.map(p => getDisplayName(p)).join(' & ')}
              </h2>
              <p className="text-gray-600">
                {selectedConversation.product && `Over: ${selectedConversation.product.title} • `}
                {selectedConversation.messageCount} berichten
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedConversation.isEncrypted && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Versleuteld
              </span>
            )}
            <span className={`px-3 py-1 text-sm rounded-full ${
              selectedConversation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
            }`}>
              {selectedConversation.isActive ? 'Actief' : 'Inactief'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Berichten ({messages.length})
            </h3>
          </div>

          {selectedConversation.isEncrypted ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">End-to-end versleutelde chat</h3>
              <p className="text-gray-600">
                Deze berichten zijn versleuteld en kunnen niet worden gelezen door admin.<br />
                Dit beschermt de privacy van gebruikers.
              </p>
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-green-800">
                  <strong>Metadata beschikbaar:</strong><br />
                  • Aantal berichten: {selectedConversation.messageCount}<br />
                  • Laatst actief: {selectedConversation.lastMessageAt ? new Date(selectedConversation.lastMessageAt).toLocaleString('nl-NL') : 'Onbekend'}<br />
                  • Status: {selectedConversation.isActive ? 'Actief' : 'Inactief'}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen berichten</h3>
                  <p className="text-gray-500">Deze conversatie heeft nog geen berichten.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {message.User.profileImage ? (
                        <Image
                          src={message.User.profileImage}
                          alt={getDisplayName(message.User)}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getDisplayName(message.User)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString('nl-NL')}
                          </span>
                          {message.readAt && (
                            <span className="text-xs text-green-600">✓✓ Gelezen</span>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Chat Beheer
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
              <p className="text-sm font-medium text-gray-500">Actief</p>
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

          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle gesprekken</option>
              <option value="active">Alleen actief</option>
              <option value="inactive">Alleen inactief</option>
              <option value="encrypted">🔒 Versleuteld</option>
              <option value="plaintext">🔓 Niet-versleuteld</option>
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
                onClick={() => handleSelectConversation(conv)}
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
                        {conv.participants.map(p => getDisplayName(p)).join(' & ')}
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

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-500">
                        📊 {conv.messageCount} bericht(en)
                      </div>
                      {conv.lastMessageAt && (
                        <div className="text-xs text-gray-400">
                          Laatst actief: {new Date(conv.lastMessageAt).toLocaleDateString('nl-NL')}
                        </div>
                      )}
                    </div>

                    {conv.isEncrypted ? (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        End-to-end versleuteld (berichten niet zichtbaar)
                      </div>
                    ) : (
                      conv.lastMessage && (
                        <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-2">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            <strong>{conv.lastMessage.sender.name || conv.lastMessage.sender.username}:</strong>{' '}
                            {conv.lastMessage.text}
                          </p>
                        </div>
                      )
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

