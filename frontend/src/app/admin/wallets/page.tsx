'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Search,
  Lock,
  Unlock,
  Coins,
  RefreshCw,
  Wallet,
  X
} from 'lucide-react';

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [adjustState, setAdjustState] = useState<{
    isOpen: boolean;
    walletId: string | null;
    walletNumber: string;
    amount: string;
    remarks: string;
  }>({ isOpen: false, walletId: null, walletNumber: '', amount: '', remarks: '' });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'freeze' | 'unfreeze';
    walletId: string | null;
  }>({ isOpen: false, type: 'freeze', walletId: null });

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const data = await adminService.getWallets();
      setWallets(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleAction = async () => {
    const { type, walletId } = confirmState;
    if (!walletId) return;

    try {
      if (type === 'freeze') {
        await adminService.freezeWallet(walletId);
      } else if (type === 'unfreeze') {
        await adminService.unfreezeWallet(walletId);
      }
      fetchWallets();
    } catch (err: any) {
      console.error(err);
    } finally {
      setConfirmState({ isOpen: false, type: 'freeze', walletId: null });
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const { walletId, amount, remarks } = adjustState;
    if (!walletId || !amount) return;

    const amt = parseFloat(amount);
    if (isNaN(amt)) return;

    try {
      await adminService.adjustWalletBalance(walletId, amt, remarks || 'Manual administrator ledger adjustment');
      fetchWallets();
    } catch (err: any) {
      console.error(err);
    } finally {
      setAdjustState({ isOpen: false, walletId: null, walletNumber: '', amount: '', remarks: '' });
    }
  };

  const filteredWallets = wallets.filter((w) => {
    const username = w.user ? w.user.username : '';
    const fullName = w.user ? w.user.fullName : '';
    const matchesSearch =
      w.walletNumber.toLowerCase().includes(search.toLowerCase()) ||
      username.toLowerCase().includes(search.toLowerCase()) ||
      fullName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || w.walletStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center text-left">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">Wallet Ledger Controls</h2>
          <p className="text-sm text-slate-400">Lock deposits checkout, freeze digital wallets, or perform dynamic balance adjustments</p>
        </div>
        <button
          onClick={fetchWallets}
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
            placeholder="Search wallet number, owner name..."
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
            <option value="ALL">All States</option>
            <option value="ACTIVE">Active</option>
            <option value="FROZEN">Frozen</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-450">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Fetching wallet deposits records...</span>
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="p-12 text-center text-slate-450">No wallets matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-6">Wallet Address</th>
                  <th className="py-3 px-6">Account Holder</th>
                  <th className="py-3 px-6">Balance</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredWallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs text-indigo-400">{wallet.walletNumber}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-slate-200">{wallet.user ? wallet.user.fullName : 'N/A'}</span>
                        <span className="text-slate-500">@{wallet.user ? wallet.user.username : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-extrabold text-slate-100">${wallet.balance.toFixed(2)}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                          wallet.walletStatus === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {wallet.walletStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            setAdjustState({
                              isOpen: true,
                              walletId: wallet.id,
                              walletNumber: wallet.walletNumber,
                              amount: '',
                              remarks: '',
                            })
                          }
                          title="Adjust Balance"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all text-xs font-bold"
                        >
                          <Coins className="h-3.5 w-3.5" />
                          <span>Adjust Balance</span>
                        </button>
                        {wallet.walletStatus === 'ACTIVE' ? (
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'freeze', walletId: wallet.id })
                            }
                            title="Freeze Wallet"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'unfreeze', walletId: wallet.id })
                            }
                            title="Unfreeze Wallet"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-650 text-slate-350 hover:text-white transition-colors"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        )}
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
        onClose={() => setConfirmState({ isOpen: false, type: 'freeze', walletId: null })}
        onConfirm={handleAction}
        title={confirmState.type === 'freeze' ? 'Freeze Digital Wallet?' : 'Unfreeze Digital Wallet?'}
        message={
          confirmState.type === 'freeze'
            ? 'This will immediately lock wallet checkout capabilities. No transfers, deposits, or withdrawals can be processed until unfrozen.'
            : 'This will unlock the wallet and resume regular digital transactions.'
        }
        isDanger={confirmState.type === 'freeze'}
      />

      {/* Adjust Balance Dialog */}
      {adjustState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100 text-left">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-400" />
              <span>Adjust Wallet Balance</span>
            </h3>
            <span className="text-xs text-indigo-400 block mt-1 font-mono">Target: {adjustState.walletNumber}</span>

            <form onSubmit={handleAdjustBalance} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Adjustment Amount (Positive to credit, Negative to debit)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 150.00 or -50.00"
                  value={adjustState.amount}
                  onChange={(e: any) => setAdjustState({ ...adjustState, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Adjustment Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Refund adjustment / manual credit"
                  value={adjustState.remarks}
                  onChange={(e: any) => setAdjustState({ ...adjustState, remarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustState({ isOpen: false, walletId: null, walletNumber: '', amount: '', remarks: '' })}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-850 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white transition-colors"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
