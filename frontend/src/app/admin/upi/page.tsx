'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Search,
  CheckCircle,
  XCircle,
  Fingerprint,
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function AdminUpiPage() {
  const [upis, setUpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'activate' | 'deactivate' | 'delete';
    upiId: string | null;
  }>({ isOpen: false, type: 'deactivate', upiId: null });

  const fetchUpiIds = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUpiIds();
      setUpis(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpiIds();
  }, []);

  const handleAction = async () => {
    const { type, upiId } = confirmState;
    if (!upiId) return;

    try {
      if (type === 'activate') {
        await adminService.activateUpi(upiId);
      } else if (type === 'deactivate') {
        await adminService.deactivateUpi(upiId);
      } else if (type === 'delete') {
        await adminService.deleteUpi(upiId);
      }
      fetchUpiIds();
    } catch (err: any) {
      console.error(err);
    } finally {
      setConfirmState({ isOpen: false, type: 'deactivate', upiId: null });
    }
  };

  const filteredUpi = upis.filter((u) => {
    const matchesSearch =
      u.upiId.toLowerCase().includes(search.toLowerCase()) ||
      (u.user && u.user.fullName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center text-left">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">UPI Management</h2>
          <p className="text-sm text-slate-400">View customer UPI address bindings, toggle routing status, or delete registers</p>
        </div>
        <button
          onClick={fetchUpiIds}
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
            placeholder="Search UPI handle, user holder..."
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
            <option value="ALL">All Handles</option>
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
            <span>Fetching UPI handles database...</span>
          </div>
        ) : filteredUpi.length === 0 ? (
          <div className="p-12 text-center text-slate-450">No UPI ID handles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-6">UPI Handle Address</th>
                  <th className="py-3 px-6">Account Holder</th>
                  <th className="py-3 px-6 text-center">Primary Mapping</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredUpi.map((upi) => (
                  <tr key={upi.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs text-indigo-400 font-bold">{upi.upiId}</td>
                    <td className="py-3.5 px-6 text-xs text-slate-200 font-semibold">
                      {upi.user ? upi.user.fullName : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          upi.isPrimary
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {upi.isPrimary ? 'Primary' : 'Secondary'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                          upi.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {upi.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {upi.status === 'ACTIVE' ? (
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'deactivate', upiId: upi.id })
                            }
                            title="Deactivate UPI"
                            className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-350 hover:text-white transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'activate', upiId: upi.id })
                            }
                            title="Activate UPI"
                            className="p-1 rounded bg-slate-800 hover:bg-emerald-650 text-slate-350 hover:text-white transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmState({ isOpen: true, type: 'delete', upiId: upi.id })}
                          title="Delete UPI"
                          className="p-1 rounded bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
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
        onClose={() => setConfirmState({ isOpen: false, type: 'deactivate', upiId: null })}
        onConfirm={handleAction}
        title={
          confirmState.type === 'delete'
            ? 'Delete UPI ID permanently?'
            : confirmState.type === 'deactivate'
            ? 'Deactivate UPI ID routing?'
            : 'Activate UPI ID routing?'
        }
        message={
          confirmState.type === 'delete'
            ? 'WARNING: This is a destructive action that completely deletes the customer UPI alias from the mapping registrar.'
            : confirmState.type === 'deactivate'
            ? 'This disables payments routed to this specific UPI ID immediately.'
            : 'This reactivates and enables payment routing for this UPI handle.'
        }
        isDanger={confirmState.type === 'delete' || confirmState.type === 'deactivate'}
      />
    </div>
  );
}
