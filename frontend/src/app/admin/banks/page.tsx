'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Search,
  CheckCircle,
  XCircle,
  Landmark,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function AdminBanksPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    bankId: string | null;
  }>({ isOpen: false, type: 'approve', bankId: null });

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const data = await adminService.getLinkedBanks();
      setBanks(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleAction = async () => {
    const { type, bankId } = confirmState;
    if (!bankId) return;

    try {
      if (type === 'approve') {
        await adminService.approveBank(bankId);
      } else if (type === 'reject') {
        await adminService.rejectBank(bankId);
      }
      fetchBanks();
    } catch (err: any) {
      console.error(err);
    } finally {
      setConfirmState({ isOpen: false, type: 'approve', bankId: null });
    }
  };

  const filteredBanks = banks.filter((b) => {
    const matchesSearch =
      b.bankName.toLowerCase().includes(search.toLowerCase()) ||
      b.accountNumber.includes(search) ||
      b.ifscCode.toLowerCase().includes(search.toLowerCase()) ||
      (b.user && b.user.fullName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || b.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center text-left">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">Linked Banks Management</h2>
          <p className="text-sm text-slate-400">Review customer savings/current bank integrations and verify details</p>
        </div>
        <button
          onClick={fetchBanks}
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
            placeholder="Search bank name, holder, account, IFSC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Verification Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Accounts</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Verification Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-450">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Fetching bank links database...</span>
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="p-12 text-center text-slate-450">No linked bank accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-6">Bank Account</th>
                  <th className="py-3 px-6">Holder</th>
                  <th className="py-3 px-6">IFSC Code</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Verify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredBanks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <Landmark className="h-4.5 w-4.5 text-slate-400" />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-slate-200">{bank.bankName}</span>
                          <span className="font-mono text-slate-500">Acct: {bank.accountNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-xs font-semibold text-slate-300">
                      {bank.user ? bank.user.fullName : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs text-indigo-400">{bank.ifscCode}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                          bank.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : bank.verificationStatus === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {bank.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {bank.verificationStatus === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'approve', bankId: bank.id })
                            }
                            className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'reject', bankId: bank.id })
                            }
                            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-650 text-red-400 hover:text-white transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-semibold italic">Done</span>
                      )}
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
        onClose={() => setConfirmState({ isOpen: false, type: 'approve', bankId: null })}
        onConfirm={handleAction}
        title={confirmState.type === 'approve' ? 'Verify Bank Link?' : 'Reject Bank Link?'}
        message={
          confirmState.type === 'approve'
            ? 'This will mark the customer bank account as verified, allowing them to deposit and transfer funds immediately.'
            : 'This rejects verification for this bank account.'
        }
        isDanger={confirmState.type === 'reject'}
      />
    </div>
  );
}
