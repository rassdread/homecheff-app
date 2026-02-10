'use client';

import React, { useState, useEffect } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { Archive, Download, Users, MessageSquare, Calendar, Search, Filter, ChevronDown, ChevronRight, FileText, Mail, User } from 'lucide-react';
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

interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  isEncrypted: boolean;
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
}

interface ConversationGroup {
  key: string;
  participants: Array<{
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  }>;
  conversations: ConversationSummary[];
  totalMessages: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function ChatArchiver() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationGroups, setConversationGroups] = useState<ConversationGroup[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'encrypted' | 'plaintext'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/messages');
      if (response.ok) {
        const data = await response.json();
        const convs = data.conversations || [];
        setConversations(convs);
        groupConversations(convs);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupConversations = (convs: ConversationSummary[]) => {
    const groups = new Map<string, ConversationGroup>();

    convs.forEach(conv => {
      if (conv.participants.length === 2) {
        // Sort participant IDs to create consistent group key
        const sortedIds = conv.participants.map(p => p.id).sort();
        const groupKey = sortedIds.join('-');
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            key: groupKey,
            participants: conv.participants,
            conversations: [],
            totalMessages: 0,
            dateRange: {
              start: conv.createdAt,
              end: conv.createdAt
            }
          });
        }

        const group = groups.get(groupKey)!;
        group.conversations.push(conv);
        group.totalMessages += conv.messageCount;
        
        // Update date range
        if (new Date(conv.createdAt) < new Date(group.dateRange.start)) {
          group.dateRange.start = conv.createdAt;
        }
        if (new Date(conv.createdAt) > new Date(group.dateRange.end)) {
          group.dateRange.end = conv.createdAt;
        }
      }
    });

    // Convert to array and sort by total messages
    const sortedGroups = Array.from(groups.values())
      .sort((a, b) => b.totalMessages - a.totalMessages);
    
    setConversationGroups(sortedGroups);
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

  const toggleGroupExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const downloadConversationGroup = async (group: ConversationGroup) => {
    try {
      // Fetch all messages for all conversations in the group
      const allMessages: Message[] = [];
      
      for (const conv of group.conversations) {
        const response = await fetch(`/api/admin/messages/${conv.id}`);
        if (response.ok) {
          const data = await response.json();
          allMessages.push(...(data.messages || []));
        }
      }

      // Sort messages by date
      allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Create downloadable content
      const content = generateChatExport(group, allMessages);
      
      // Download as file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-archive-${group.participants.map(p => p.username || p.name || p.id).join('-')}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading conversation group:', error);
    }
  };

  const downloadAllConversations = async () => {
    try {
      let content = '=== HOMECHEFF CHAT ARCHIEF ===\n';
      content += `Gegenereerd op: ${new Date().toLocaleString('nl-NL')}\n\n`;

      for (const group of conversationGroups) {
        const allMessages: Message[] = [];
        
        for (const conv of group.conversations) {
          const response = await fetch(`/api/admin/messages/${conv.id}`);
          if (response.ok) {
            const data = await response.json();
            allMessages.push(...(data.messages || []));
          }
        }

        allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        content += generateChatExport(group, allMessages);
        content += '\n\n' + '='.repeat(50) + '\n\n';
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homecheff-complete-chat-archive-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading all conversations:', error);
    }
  };

  const generateChatExport = (group: ConversationGroup, messages: Message[]) => {
    let content = '';
    
    content += `GESPREK TUSSEN: ${group.participants.map(p => p.name || p.username || p.id).join(' & ')}\n`;
    content += `Datum bereik: ${new Date(group.dateRange.start).toLocaleDateString('nl-NL')} - ${new Date(group.dateRange.end).toLocaleDateString('nl-NL')}\n`;
    content += `Totaal berichten: ${messages.length}\n`;
    content += `Aantal gesprekken: ${group.conversations.length}\n`;
    content += '-'.repeat(50) + '\n\n';

    if (messages.length === 0) {
      content += 'Geen berichten gevonden.\n';
      return content;
    }

    messages.forEach((message, index) => {
      const senderName = message.sender.name || message.sender.username || message.sender.id;
      const timestamp = new Date(message.createdAt).toLocaleString('nl-NL');
      
      content += `[${timestamp}] ${senderName}:\n`;
      
      if (message.isEncrypted) {
        content += '[VERSLEUTELD BERICHT - Kan niet worden gelezen]\n';
      } else {
        content += `${message.text || '[Geen tekst]'}\n`;
      }
      
      content += '\n';
    });

    return content;
  };

  const filteredGroups = conversationGroups.filter(group => {
    if (filterType === 'encrypted' && !group.conversations.some(c => c.isEncrypted)) return false;
    if (filterType === 'plaintext' && group.conversations.every(c => c.isEncrypted)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesParticipants = group.participants.some(p => 
        p.name?.toLowerCase().includes(query) || 
        p.username?.toLowerCase().includes(query)
      );
      return matchesParticipants;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Archive className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Gesprekken laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Chat Archivering
          </h2>
          <p className="text-gray-600">Gesprekken tussen gebruikers archiveren en exporteren</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadAllConversations}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Alles
          </button>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Vernieuwen
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gespreksgroepen</p>
              <p className="text-2xl font-semibold text-gray-900">{conversationGroups.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Totaal Gesprekken</p>
              <p className="text-2xl font-semibold text-gray-900">{conversations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Totaal Berichten</p>
              <p className="text-2xl font-semibold text-gray-900">
                {conversationGroups.reduce((sum, group) => sum + group.totalMessages, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Actieve Gesprekken</p>
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
              placeholder="Zoek gebruikers..."
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

      {/* Conversation Groups */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Gespreksgroepen ({filteredGroups.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen gespreksgroepen gevonden</h3>
              <p className="text-gray-500">Er zijn geen gesprekken tussen 2 personen die voldoen aan de filters.</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.key} className="border-b border-gray-100">
                {/* Group Header */}
                <div
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleGroupExpansion(group.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedGroups.has(group.key) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      
                      <div className="flex items-center gap-2">
                        {group.participants.map((participant, index) => (
                          <div key={participant.id} className="flex items-center gap-2">
                            {participant.profileImage ? (
                              <Image
                                src={participant.profileImage}
                                alt={getDisplayName(participant)}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                            <span className="font-medium text-gray-900">
                              {participant.name || participant.username || participant.id}
                            </span>
                            {index < group.participants.length - 1 && <span className="text-gray-400">&</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {group.conversations.length} gesprek(en) • {group.totalMessages} berichten
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(group.dateRange.start).toLocaleDateString('nl-NL')} - {new Date(group.dateRange.end).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadConversationGroup(group);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedGroups.has(group.key) && (
                  <div className="px-6 pb-4 bg-gray-50">
                    <div className="space-y-2">
                      {group.conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedConversation === conv.id 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => fetchConversationMessages(conv.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {conv.product ? `💬 over: ${conv.product.title}` : 'Direct gesprek'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {conv.messageCount} berichten • {conv.isEncrypted ? '🔒 Versleuteld' : '🔓 Niet versleuteld'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(conv.createdAt).toLocaleString('nl-NL')}
                                {conv.lastMessageAt && (
                                  <> • Laatst actief: {new Date(conv.lastMessageAt).toLocaleString('nl-NL')}</>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                conv.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {conv.isActive ? 'Actief' : 'Inactief'}
                              </span>
                              <MessageSquare className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Messages Display */}
                    {selectedConversation && messages.length > 0 && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Berichten:</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {messages.map((message) => (
                            <div key={message.id} className="flex items-start gap-3">
                              {message.sender.profileImage ? (
                                <Image
                                  src={message.sender.profileImage}
                                  alt={getDisplayName(message.sender)}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-gray-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {message.sender.name || message.sender.username || message.sender.id}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(message.createdAt).toLocaleString('nl-NL')}
                                  </span>
                                  {message.isEncrypted && (
                                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                      🔒 Versleuteld
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-700 mt-1">
                                  {message.isEncrypted ? '[VERSLEUTELD BERICHT]' : (message.text || '[Geen tekst]')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
