'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, SettlementResponseData, MerchantProfileResponseData } from '@/services/merchantService';
import { 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Sparkles,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementResponseData[]>([]);
  const [profile, setProfile] = useState<MerchantProfileResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [list, prof] = await Promise.all([
        merchantService.getSettlements(),
        merchantService.getProfile()
      ]);
      setSettlements(list);
      setProfile(prof);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualPayout = async () => {
    if (!profile?.walletBalance || profile.walletBalance <= 0) {
      setMsg({ text: 'Available business balance must be greater than $0 to trigger manual payouts.', type: 'error' });
      return;
    }
    try {
      setActionLoading(true);
      setMsg({ text: '', type: '' });
      await merchantService.triggerSettlement();
      setMsg({ text: 'Manual payout processed. Funds have been credited to your bank.', type: 'success' });
      await fetchData();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.message || 'Failed to trigger settlement.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateAutoJob = async () => {
    try {
      setActionLoading(true);
      setMsg({ text: '', type: '' });
      await merchantService.simulateSettlementsJob();
      setMsg({ text: 'Auto-settlement system cron job completed successfully.', type: 'success' });
      await fetchData();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.message || 'Failed to trigger simulated cron job.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-500" /> Payout Settlements
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage your daily automated bank transfers or trigger immediate manual balance withdrawals.
          </p>
        </div>
      </div>

      {/* Message Notifications */}
      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold ${
          msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Simulator Control Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Balance Card */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Settlable Balance</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-2">{formatCurrency(profile?.walletBalance || 0)}</h3>
            <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed">
              Revenue from verified paid invoices accumulates here and is transferred to your linked bank account.
            </p>
          </div>

          <button
            onClick={handleManualPayout}
            disabled={actionLoading || !profile?.walletBalance || profile.walletBalance <= 0}
            className="w-full mt-6 py-3 bg-indigo-650 hover:bg-indigo-500 disabled:bg-indigo-650/40 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
            Payout Settlable Funds
          </button>
        </div>

        {/* Simulator Card */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden md:col-span-2">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Auto-Settlement Payout Scheduler Simulator</h3>
            </div>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              ApexPay runs an automatic end-of-day settlement batch to transfer business balances of all verified merchants to their banking portals. Click below to trigger a mock execution of this background batch job immediately:
            </p>
          </div>

          <button
            onClick={handleSimulateAutoJob}
            disabled={actionLoading}
            className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700/80 border border-white/5 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            {actionLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null}
            Trigger Auto-Settlement Batch (Cron Job)
          </button>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6">Settlements Ledger</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : settlements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  <th className="py-3 font-semibold">Settlement ID</th>
                  <th className="py-3 font-semibold">Reference</th>
                  <th className="py-3 font-semibold">Type</th>
                  <th className="py-3 font-semibold">Amount</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Date Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {settlements.map((set) => (
                  <tr key={set.id} className="text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-400">{set.id.substring(0, 8)}...</td>
                    <td className="py-4 font-mono text-slate-400">{set.referenceNumber}</td>
                    <td className="py-4 font-bold text-slate-400">{set.settlementType}</td>
                    <td className="py-4 font-bold text-slate-250 text-indigo-400">{formatCurrency(set.amount)}</td>
                    <td className="py-4">
                      {set.status === 'SETTLED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      ) : set.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full font-semibold">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold">
                          <Clock className="w-3 h-3 animate-pulse" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{set.settledAt ? new Date(set.settledAt).toLocaleString() : 'Pending Payout'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-medium">
            No settlements logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
