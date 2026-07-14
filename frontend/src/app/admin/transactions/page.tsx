'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { ExportDialog } from '@/components/admin/ExportDialog';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  FileText,
  Download,
  AlertTriangle,
  X
} from 'lucide-react';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [txDetailsOpen, setTxDetailsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reverse' | 'cancel';
    txId: string | null;
  }>({ isOpen: false, type: 'approve', txId: null });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTransactions();
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAction = async () => {
    const { type, txId } = confirmState;
    if (!txId) return;

    try {
      if (type === 'approve') {
        await adminService.approveTransaction(txId);
      } else if (type === 'reverse') {
        await adminService.reverseTransaction(txId);
      } else if (type === 'cancel') {
        await adminService.cancelTransaction(txId);
      }
      fetchTransactions();
      setTxDetailsOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setConfirmState({ isOpen: false, type: 'approve', txId: null });
    }
  };

  const filteredTx = transactions.filter((t) => {
    const matchesSearch =
      t.transactionReference.toLowerCase().includes(search.toLowerCase()) ||
      (t.senderWallet && t.senderWallet.walletNumber.toLowerCase().includes(search.toLowerCase())) ||
      (t.receiverWallet && t.receiverWallet.walletNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center text-left">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">Audit Transactions</h2>
          <p className="text-sm text-slate-400">Inspect wallet, UPI, and QR payments, trigger reversals, or force approvals</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV / PDF</span>
          </button>
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Logs</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search reference or wallet number..."
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
            <option value="ALL">All Payments</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-450">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Loading payment records...</span>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="p-12 text-center text-slate-450">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Sender & Receiver</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Method & Type</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs text-indigo-400">{tx.transactionReference}</td>
                    <td className="py-3.5 px-6 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span>{tx.senderWallet ? tx.senderWallet.walletNumber : 'DEPOSIT'}</span>
                        <ArrowRight className="h-3 w-3 text-slate-500" />
                        <span>{tx.receiverWallet ? tx.receiverWallet.walletNumber : 'WITHDRAW'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-200">${tx.amount.toFixed(2)}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-slate-350 capitalize">{tx.paymentMethod?.toLowerCase()}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{tx.transactionType}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                          tx.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : tx.paymentStatus === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={() => {
                          setSelectedTx(tx);
                          setTxDetailsOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {txDetailsOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-md font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <span>Transaction Receipt Details</span>
              </h3>
              <button onClick={() => setTxDetailsOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-850">
                <span className="text-xs text-slate-500">Transaction Reference</span>
                <span className="font-mono font-bold text-indigo-400">{selectedTx.transactionReference}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Sender Wallet</span>
                  <span className="font-semibold text-slate-200">{selectedTx.senderWallet ? selectedTx.senderWallet.walletNumber : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Receiver Wallet</span>
                  <span className="font-semibold text-slate-200">{selectedTx.receiverWallet ? selectedTx.receiverWallet.walletNumber : 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Transfer Amount</span>
                  <span className="font-bold text-slate-100 text-lg">${selectedTx.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Creation Timestamp</span>
                  <span className="text-slate-300 font-mono text-xs">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Category</span>
                  <span className="font-semibold text-slate-200 capitalize">{selectedTx.category?.toLowerCase() || 'Other'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Transaction Remarks</span>
                  <span className="text-slate-300 italic">{selectedTx.remarks || 'None'}</span>
                </div>
              </div>

              {selectedTx.paymentStatus === 'PENDING' && (
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setConfirmState({ isOpen: true, type: 'cancel', txId: selectedTx.id });
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
                  >
                    Cancel Payment
                  </button>
                  <button
                    onClick={() => {
                      setConfirmState({ isOpen: true, type: 'approve', txId: selectedTx.id });
                    }}
                    className="px-5 py-2 bg-emerald-650/15 border border-emerald-800 hover:bg-emerald-650 text-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Approve Payment
                  </button>
                </div>
              )}

              {selectedTx.paymentStatus === 'SUCCESS' && (
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setConfirmState({ isOpen: true, type: 'reverse', txId: selectedTx.id });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-650/15 border border-red-800 hover:bg-red-650 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Refund & Reverse</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: 'approve', txId: null })}
        onConfirm={handleAction}
        title={
          confirmState.type === 'reverse'
            ? 'Reverse Payment Ledger?'
            : confirmState.type === 'cancel'
            ? 'Cancel Pending Payment?'
            : 'Approve Payment Transaction?'
        }
        message={
          confirmState.type === 'reverse'
            ? 'This will refund the amount back to the sender wallet, subtract it from the receiver wallet, and mark the status as reversed/failed.'
            : confirmState.type === 'cancel'
            ? 'This updates the pending payment status to failed.'
            : 'This force-completes the transaction, sets status to SUCCESS, and commits ledger balances.'
        }
        isDanger={confirmState.type === 'reverse' || confirmState.type === 'cancel'}
        confirmText={
          confirmState.type === 'reverse' ? 'Reverse' : confirmState.type === 'cancel' ? 'Cancel' : 'Approve'
        }
      />

      {/* Export Report dialog */}
      <ExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} defaultType="transactions" />
    </div>
  );
}
