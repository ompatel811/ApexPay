'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Search,
  CheckCircle,
  XCircle,
  QrCode,
  RefreshCw,
  Trash2,
  Activity,
  X
} from 'lucide-react';

export default function AdminQrPage() {
  const [qrs, setQrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Stats Modal
  const [selectedQr, setSelectedQr] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'delete';
    qrId: string | null;
  }>({ isOpen: false, type: 'deactivate', qrId: null });

  const fetchQrCodes = async () => {
    try {
      setLoading(true);
      const data = await adminService.getQrCodes();
      setQrs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrCodes();
  }, []);

  const handleAction = async () => {
    const { type, qrId } = confirmState;
    if (!qrId) return;

    try {
      if (type === 'deactivate') {
        await adminService.deactivateQr(qrId);
      } else if (type === 'delete') {
        await adminService.deleteQr(qrId);
      }
      fetchQrCodes();
    } catch (err: any) {
      console.error(err);
    } finally {
      setConfirmState({ isOpen: false, type: 'deactivate', qrId: null });
    }
  };

  const inspectUsage = async (qr: any) => {
    setSelectedQr(qr);
    try {
      setUsageLoading(true);
      const usage = await adminService.getQrUsage(qr.id);
      setUsageStats(usage);
    } catch (err: any) {
      console.error(err);
    } finally {
      setUsageLoading(false);
    }
  };

  const filteredQr = qrs.filter((q) => {
    const matchesSearch =
      q.qrValue.toLowerCase().includes(search.toLowerCase()) ||
      q.qrType.toLowerCase().includes(search.toLowerCase()) ||
      (q.user && q.user.fullName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center text-left">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">QR Codes Registry</h2>
          <p className="text-sm text-slate-400">Monitor customer dynamic & static checkouts, review metrics, and deactive scans</p>
        </div>
        <button
          onClick={fetchQrCodes}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search QR value, type, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All QRs</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-450">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Fetching QR codes database...</span>
          </div>
        ) : filteredQr.length === 0 ? (
          <div className="p-12 text-center text-slate-450">No QR Code entries registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-6">QR Value / Target</th>
                  <th className="py-3 px-6">QR Type</th>
                  <th className="py-3 px-6">Associated User</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredQr.map((qr) => (
                  <tr key={qr.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs text-indigo-400 truncate max-w-[200px]" title={qr.qrValue}>
                      {qr.qrValue}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border border-slate-800 bg-slate-800 text-slate-300">
                        {qr.qrType}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-200 font-semibold">
                      {qr.user ? qr.user.fullName : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                          qr.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {qr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => inspectUsage(qr)}
                          title="Inspect scan usage statistics"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all text-xs font-bold"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          <span>Check Usage</span>
                        </button>
                        {qr.status === 'ACTIVE' && (
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'deactivate', qrId: qr.id })
                            }
                            title="Deactivate QR Checkout"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmState({ isOpen: true, type: 'delete', qrId: qr.id })}
                          title="Delete QR Record"
                          className="p-1.5 rounded-lg bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: 'deactivate', qrId: null })}
        onConfirm={handleAction}
        title={confirmState.type === 'delete' ? 'Delete QR Code permanently?' : 'Deactivate QR Code scan?'}
        message={
          confirmState.type === 'delete'
            ? 'WARNING: This is a destructive action that deletes the customer checkout QR mapping permanently.'
            : 'This disables checkouts scanned using this QR Code immediately.'
        }
        isDanger
      />

      {/* QR Usage Statistics Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-400" />
                <span>QR Code Usage Profile</span>
              </h3>
              <button onClick={() => setSelectedQr(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                <span className="text-xs text-slate-500">QR Target Value</span>
                <span className="font-mono text-xs text-slate-350 block break-all">{selectedQr.qrValue}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Simulated Scan Actions Count</span>
                {usageLoading ? (
                  <span className="text-slate-400 animate-pulse text-xs">Computing checks...</span>
                ) : (
                  <span className="text-2xl font-black text-slate-50">{usageStats ?? 0} scans</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
