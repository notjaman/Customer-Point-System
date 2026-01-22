import React, { useState, useEffect, useMemo } from 'react';
import { AuditLog } from '../types';
import { db } from '../services/supabase';

interface AuditLogViewerProps {
  customerId?: string;
  actionType?: AuditLog['action_type'];
  limit?: number;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  customerId,
  actionType,
  limit = 50
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [customerId, actionType, limit]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let logs: AuditLog[];

      if (customerId) {
        logs = await db.getCustomerAuditLogs(customerId);
      } else if (actionType) {
        logs = await db.getAuditLogsByAction(actionType, limit);
      } else {
        logs = await db.getAuditLogs(limit);
      }

      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: AuditLog['action_type']) => {
    switch (actionType) {
      case 'customer_created':
        return '👤';
      case 'customer_updated':
        return '✏️';
      case 'customer_deleted':
        return '🗑️';
      case 'points_added':
        return '➕';
      case 'points_redeemed':
        return '💰';
      default:
        return '📝';
    }
  };

  const getActionColor = (actionType: AuditLog['action_type']) => {
    switch (actionType) {
      case 'customer_created':
        return 'text-green-600';
      case 'customer_updated':
        return 'text-blue-600';
      case 'customer_deleted':
        return 'text-red-600';
      case 'points_added':
        return 'text-green-600';
      case 'points_redeemed':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatActionType = (actionType: AuditLog['action_type']) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return auditLogs;
    const q = searchQuery.toLowerCase();
    return auditLogs.filter(log => {
      const customerName = log.customer_name?.toLowerCase() || '';
      const actionType = formatActionType(log.action_type).toLowerCase();
      return customerName.includes(q) || actionType.includes(q);
    });
  }, [auditLogs, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadAuditLogs}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Audit Log {customerId ? '(Customer Specific)' : ''}
        </h3>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={loadAuditLogs}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors whitespace-nowrap"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div>
          {filteredLogs.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <p>{searchQuery ? 'No activities matching your search' : 'No audit logs found'}</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getActionIcon(log.action_type)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${getActionColor(log.action_type)}`}>
                        {formatActionType(log.action_type)}
                        {(log.action_type === 'points_added' || log.action_type === 'points_redeemed') &&
                          log.points_change !== undefined && log.points_change !== null && (
                            <span className="ml-1 font-bold">
                              ({log.points_change > 0 ? '+' : ''}{log.points_change} pts)
                            </span>
                          )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(log.created_at)}
                      </p>
                    </div>

                    <p className="text-sm text-gray-900 mt-1">
                      <strong>{log.customer_name}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )))}
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;