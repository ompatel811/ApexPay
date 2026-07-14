'use client';

import React, { useState } from 'react';
import { Search, Calendar, ShieldCheck, Clock } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  entityName: string;
  entityId: string;
  timestamp: string;
}

interface AuditViewerProps {
  logs: AuditLogEntry[];
  loading?: boolean;
}

export function AuditViewer({ logs, loading = false }: AuditViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action)))];

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by action, performer, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <Clock className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Loading audit log database...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No audit records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action Event</th>
                  <th className="py-3 px-6">Performer</th>
                  <th className="py-3 px-6">Affected Target</th>
                  <th className="py-3 px-6">Target Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-6 text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase">
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-semibold text-slate-200">{log.performedBy || 'SYSTEM'}</td>
                    <td className="py-3 px-6 text-xs text-slate-300 font-semibold">{log.entityName}</td>
                    <td className="py-3 px-6 text-xs text-slate-400 font-mono truncate max-w-[150px]">
                      {log.entityId || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
