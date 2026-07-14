'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { AuditViewer } from '@/components/admin/AuditViewer';
import { History, RefreshCw } from 'lucide-react';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center text-left">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">System Audit Logs</h2>
          <p className="text-sm text-slate-400">Review complete immutable logs of administrator logins, setting changes, and KYC reviews</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Logs</span>
        </button>
      </div>

      {/* Audit Logs Viewer grid */}
      <AuditViewer logs={logs} loading={loading} />
    </div>
  );
}
