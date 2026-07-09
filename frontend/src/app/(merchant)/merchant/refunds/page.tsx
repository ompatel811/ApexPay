'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, RefundResponseData } from '@/services/merchantService';
import { 
  RefreshCcw, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ArrowDownLeft, 
  Loader2, 
  X,
  FileText,
  DollarSign
} from 'lucide-react';

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Create Refund form state
  const [formData, setFormData] = useState({
    transactionId: '',
    amount: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Rejection state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const data = await merchantService.getRefunds();
      setRefunds(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid refund amount.');
      return;
    }

    if (!formData.transactionId) {
      setError('Please provide the original Transaction reference UUID.');
      return;
    }

    try {
      setSubmitting(true);
      await merchantService.createRefund({
        transactionId: formData.transactionId,
        amount: amt,
        reason: formData.reason || undefined,
      });
      setModalOpen(false);
      setFormData({ transactionId: '', amount: '', reason: '' });
      fetchRefunds();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit refund request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRefund = async (id: string) => {
    try {
      setLoading(true);
      await merchantService.approveRefund(id);
      fetchRefunds();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to process refund payout.');
      setLoading(false);
    }
  };

  const handleRejectRefund = async (id: string) => {
    if (!rejectReason) {
      alert('Please specify a rejection reason.');
      return;
    }
    try {
      setLoading(true);
      await merchantService.rejectRefund(id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      fetchRefunds();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reject refund.');
      setLoading(false);
    }
  };

  const filteredRefunds = refunds.filter(ref => {
    const text = (ref.transactionReference + ref.reason + ref.status).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <RefreshCcw className="w-7 h-7 text-indigo-500" /> Refunds Operations
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track customer refund drafts. Process partial or full transaction ledger reversals.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Request Refund Draft
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by transaction reference or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-xl text-xs text-white outline-none placeholder-slate-600 transition-all"
          />
        </div>
      </div>

      {/* Refunds History Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : filteredRefunds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  <th className="py-3 font-semibold">Refund ID</th>
                  <th className="py-3 font-semibold">Original Reference</th>
                  <th className="py-3 font-semibold">Reason</th>
                  <th className="py-3 font-semibold">Refund Amount</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Requested Date</th>
                  <th className="py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRefunds.map((ref) => (
                  <tr key={ref.id} className="text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-400">{ref.id.substring(0, 8)}...</td>
                    <td className="py-4 font-mono text-slate-400">{ref.transactionReference}</td>
                    <td className="py-4 text-slate-400">
                      <p className="text-slate-200 font-semibold">{ref.reason || 'No reason provided'}</p>
                      {ref.rejectedReason && <p className="text-[10px] text-rose-400 mt-0.5">Rejected: {ref.rejectedReason}</p>}
                    </td>
                    <td className="py-4 font-bold text-slate-200">${ref.amount.toFixed(2)}</td>
                    <td className="py-4">
                      {ref.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : ref.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full font-semibold">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold">
                          <Clock className="w-3 h-3 animate-pulse" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-slate-500">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      {ref.status === 'PENDING' ? (
                        <div className="inline-flex flex-col items-end gap-1.5">
                          {rejectingId === ref.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-[10px] text-white outline-none"
                              />
                              <button
                                onClick={() => handleRejectRefund(ref.id)}
                                className="p-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] transition-all"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => setRejectingId(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setRejectingId(ref.id)}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded-lg text-[10px] transition-all"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproveRefund(ref.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all shadow-md"
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-medium">
            No refund requests logged.
          </div>
        )}
      </div>

      {/* Draft Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-indigo-400" /> Request Refund Draft
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Create a pending refund request. Ledgers are only reversed once approved by an owner, admin, or manager.
            </p>

            <form onSubmit={handleCreateRefund} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Original Transaction Reference (UUID) *</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="E.g. d68e0e70-aec3..."
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Refund Amount (USD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Reason for Refund</label>
                <input
                  type="text"
                  placeholder="E.g. Customer returned items"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-850 text-slate-350 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Refund Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
