'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  Search,
  RefreshCw,
  Eye
} from 'lucide-react';

interface Dispute {
  id: string;
  type: 'report' | 'order';
  orderId?: string;
  orderNumber?: string;
  reporter?: {
    id: string;
    name: string | null;
    email: string;
  };
  target?: {
    id: string;
    name: string | null;
    email: string;
  };
  reason: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  messages?: Array<{
    text: string;
    User: {
      id: string;
      name: string | null;
      username: string | null;
    };
    createdAt: string;
  }>;
}

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/admin/disputes?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Combine reports and problematic orders
        const combined: Dispute[] = [
          ...data.reports.map((r: any) => ({
            id: r.id,
            type: 'report' as const,
            reporter: r.User_Report_reporterIdToUser,
            target: r.User_Report_targetUserIdToUser,
            reason: r.reason,
            status: r.status,
            createdAt: r.createdAt,
            resolvedAt: r.resolvedAt
          })),
          ...data.problematicOrders.map((o: any) => ({
            id: o.id,
            type: 'order' as const,
            orderId: o.id,
            orderNumber: o.orderNumber,
            reporter: o.User,
            target: o.items[0]?.Product?.seller?.User,
            reason: `Order ${o.status}`,
            status: o.status === 'CANCELLED' || o.status === 'REFUNDED' ? 'OPEN' : 'RESOLVED',
            createdAt: o.createdAt,
            messages: o.conversations[0]?.Message || []
          }))
        ];
        setDisputes(combined);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: string, action: string, notes: string) => {
    try {
      const response = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: disputeId,
          action,
          notes
        })
      });

      if (response.ok) {
        fetchDisputes();
        setSelectedDispute(null);
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispute Resolutie</h2>
          <p className="text-gray-600">Beheer conflicten en problematische bestellingen</p>
        </div>
        <button
          onClick={fetchDisputes}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Ververs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex gap-2">
          {['all', 'OPEN', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Alle' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${
                      dispute.status === 'OPEN' ? 'text-red-600' : 'text-green-600'
                    }`} />
                    <h3 className="font-semibold text-gray-900">
                      {dispute.type === 'order' ? `Order: ${dispute.orderNumber}` : 'Report'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      dispute.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{dispute.reason}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Van: {dispute.reporter?.name || dispute.reporter?.email}</span>
                    {dispute.target && (
                      <span>Tegen: {dispute.target.name || dispute.target.email}</span>
                    )}
                    <span>{formatDate(dispute.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDispute(dispute)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Bekijk
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <DisputeDetailModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}

function DisputeDetailModal({
  dispute,
  onClose,
  onResolve
}: {
  dispute: Dispute;
  onClose: () => void;
  onResolve: (id: string, action: string, notes: string) => void;
}) {
  const [resolution, setResolution] = useState('');
  const [action, setAction] = useState('resolved');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold">Dispute Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Actie</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="resolved">Opgelost</option>
              <option value="dismissed">Afgewezen</option>
              <option value="escalated">Geëscaleerd</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notities</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={4}
              placeholder="Voeg notities toe over de resolutie..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onResolve(dispute.id, action, resolution)}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Oplossen
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Annuleren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

