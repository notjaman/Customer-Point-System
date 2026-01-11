import React, { useState, useEffect } from 'react';
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

  if (auditLogs.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Audit Log {customerId ? '(Customer Specific)' : ''}
        </h3>
        <button 
          onClick={loadAuditLogs}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getActionIcon(log.action_type)}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${getActionColor(log.action_type)}`}>
                      {formatActionType(log.action_type)}
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;