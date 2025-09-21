'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, RefreshCw, Filter, Search, Shield } from 'lucide-react';

interface ModerationLog {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  category: string;
  productTitle?: string;
  result: {
    isAppropriate: boolean;
    confidence: number;
    violations: string[];
    detectedObjects: string[];
    categoryMatch: boolean;
    recommendedCategory?: string;
  };
  timestamp: string;
  status: 'approved' | 'rejected' | 'pending_review';
}

interface ModerationStats {
  totalImages: number;
  approvedImages: number;
  rejectedImages: number;
  pendingReview: number;
  violationsByType: { [key: string]: number };
  categoryAccuracy: { [key: string]: number };
}

export default function ContentModerationDashboard() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    violationType: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/moderation/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    if (filters.category !== 'all' && log.category !== filters.category) return false;
    if (filters.violationType !== 'all' && !log.result.violations.includes(filters.violationType)) return false;
    if (filters.searchQuery && !log.productTitle?.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleManualReview = async (logId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/moderation/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, action })
      });

      if (response.ok) {
        // Update local state
        setLogs(prev => prev.map(log => 
          log.id === logId 
            ? { ...log, status: action === 'approve' ? 'approved' : 'rejected' }
            : log
        ));
      }
    } catch (error) {
      console.error('Error updating moderation status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending_review': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Eye className="w-5 h-5 text-gray-400" />;
    }
  };

  const getViolationColor = (violation: string) => {
    switch (violation) {
      case 'adult_content': return 'bg-red-100 text-red-800';
      case 'violence': return 'bg-red-100 text-red-800';
      case 'racy_content': return 'bg-orange-100 text-orange-800';
      case 'category_mismatch': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Moderatie data laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Content Moderation
          </h2>
          <p className="text-gray-600">AI-powered content filtering en handmatige reviews</p>
        </div>
        <button
          onClick={fetchModerationData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Vernieuwen
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Totaal Geanalyseerd</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalImages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Goedgekeurd</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approvedImages}</p>
                <p className="text-sm text-gray-500">
                  {Math.round((stats.approvedImages / stats.totalImages) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Afgewezen</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejectedImages}</p>
                <p className="text-sm text-gray-500">
                  {Math.round((stats.rejectedImages / stats.totalImages) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Handmatige Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingReview}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle statussen</option>
              <option value="approved">Goedgekeurd</option>
              <option value="rejected">Afgewezen</option>
              <option value="pending_review">Handmatige review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle categorieën</option>
              <option value="CHEFF">Chef</option>
              <option value="GROWN">Garden</option>
              <option value="DESIGNER">Designer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overtreding</label>
            <select
              value={filters.violationType}
              onChange={(e) => setFilters(prev => ({ ...prev, violationType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle overtredingen</option>
              <option value="adult_content">Volwassen inhoud</option>
              <option value="violence">Geweld</option>
              <option value="racy_content">Aanmatigende inhoud</option>
              <option value="category_mismatch">Categorie mismatch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Zoek in product titels..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Moderatie Logs ({filteredLogs.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredLogs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen moderatie logs gevonden</h3>
              <p className="text-gray-500">
                Er zijn geen logs die voldoen aan de huidige filters.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-start space-x-4">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <img
                      src={log.imageUrl}
                      alt="Moderation preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  </div>

                  {/* Log Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(log.status)}
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {log.productTitle || 'Geen titel'}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        log.category === 'CHEFF' ? 'bg-orange-100 text-orange-800' :
                        log.category === 'GROWN' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {log.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Gebruiker:</strong> {log.userName}</p>
                        <p><strong>Vertrouwen:</strong> {Math.round(log.result.confidence * 100)}%</p>
                      </div>
                      <div>
                        <p><strong>Gedetecteerde objecten:</strong></p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {log.result.detectedObjects?.slice(0, 3).map((obj, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {obj}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p><strong>Tijd:</strong> {new Date(log.timestamp).toLocaleString('nl-NL')}</p>
                        {log.result.recommendedCategory && (
                          <p><strong>Aanbevolen categorie:</strong> {log.result.recommendedCategory}</p>
                        )}
                      </div>
                    </div>

                    {/* Violations */}
                    {log.result.violations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Overtredingen:</p>
                        <div className="flex flex-wrap gap-2">
                          {log.result.violations.map((violation, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getViolationColor(violation)}`}
                            >
                              {violation.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {log.status === 'pending_review' && (
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => handleManualReview(log.id, 'approve')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Goedkeuren
                        </button>
                        <button
                          onClick={() => handleManualReview(log.id, 'reject')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Afwijzen
                        </button>
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
