'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  User,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface AuditAction {
  id: string;
  action: string;
  notes: string | null;
  createdAt: string;
  User: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
  Report: {
    id: string;
    reason: string;
    status: string;
  } | null;
}

export default function AuditLog() {
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    adminId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchActions();
  }, [filters, page]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.adminId && { adminId: filters.adminId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/admin/audit-log?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['Datum', 'Admin', 'Actie', 'Notities', 'Report'];
    const rows = actions.map(action => [
      formatDate(action.createdAt),
      action.User.name || action.User.email,
      action.action,
      action.notes || '',
      action.Report?.reason || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-gray-600">Overzicht van alle admin acties</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchActions}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Ververs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Actie</label>
            <input
              type="text"
              placeholder="Zoek actie..."
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Van datum</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tot datum</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Laden...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Notities</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {actions.map((action) => (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(action.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      {action.User.name || action.User.email}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{action.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{action.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Toon {page * limit + 1} - {Math.min((page + 1) * limit, total)} van {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Vorige
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Volgende
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




