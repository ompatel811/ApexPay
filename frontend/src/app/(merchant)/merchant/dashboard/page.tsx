'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, MerchantDashboardResponseData, MerchantProfileResponseData } from '@/services/merchantService';
import { 
  DollarSign, 
  CreditCard, 
  RefreshCcw, 
  Clock, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  Loader2, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';

export default function MerchantDashboard() {
  const [dashboard, setDashboard] = useState<MerchantDashboardResponseData | null>(null);
  const [profile, setProfile] = useState<MerchantProfileResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashData, profData] = await Promise.all([
        merchantService.getDashboard(),
        merchantService.getProfile()
      ]);
      setDashboard(dashData);
      setProfile(profData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualSettlement = async () => {
    if (!profile?.walletBalance || profile.walletBalance <= 0) {
      setMsg({ text: 'Available business balance must be greater than 0 to settle payouts.', type: 'error' });
      return;
    }
    try {
      setSettling(true);
      setMsg({ text: '', type: '' });
      await merchantService.triggerSettlement();
      setMsg({ text: 'Settlement processed successfully. Funds are being wired to your bank.', type: 'success' });
      await fetchData();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.message || 'Manual payout settlement failed.', type: 'error' });
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const statCards = [
    { title: "Today's Sales", value: dashboard?.todaySales || 0, icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
    { title: "Weekly Revenue", value: dashboard?.weeklySales || 0, icon: TrendingUp, color: 'text-indigo-400 bg-indigo-500/10' },
    { title: "Monthly Volume", value: dashboard?.monthlySales || 0, icon: CreditCard, color: 'text-purple-400 bg-purple-500/10' },
    { title: "Total Volume", value: dashboard?.totalRevenue || 0, icon: Sparkles, color: 'text-amber-400 bg-amber-500/10' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 border border-white/5 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
            Welcome back, {profile?.businessName}!
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Wallet Reference: <span className="font-mono text-indigo-400 font-bold">{profile?.walletNumber}</span> • Payout Bank: Simulation Network
          </p>
        </div>

        {/* Business Balance and Settlement */}
        <div className="flex items-center gap-4 bg-slate-950/60 border border-white/5 p-3 px-4 rounded-2xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Settlable Balance</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">{formatCurrency(profile?.walletBalance || 0)}</p>
          </div>
          <button
            onClick={handleManualSettlement}
            disabled={settling}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 shrink-0"
          >
            {settling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Wiring...
              </>
            ) : (
              <>
                Settle Payout <ArrowUpRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold ${
          msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <h3 className="text-xl font-extrabold text-white mt-1.5">{formatCurrency(card.value)}</h3>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <RefreshCcw className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Refund Requests</span>
            <p className="text-base font-extrabold text-white mt-0.5">{dashboard?.totalRefunds || 0}</p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <p className="text-base font-extrabold text-white mt-0.5">{dashboard?.totalTransactionsCount || 0}</p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Links</span>
            <p className="text-base font-extrabold text-white mt-0.5">{dashboard?.pendingPaymentsCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Recent Invoices</h3>
          <Link
            href="/merchant/payment-links"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            Manage Links <LinkIcon className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {dashboard?.recentPayments && dashboard.recentPayments.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  <th className="py-3 font-semibold">Reference</th>
                  <th className="py-3 font-semibold">Customer</th>
                  <th className="py-3 font-semibold">Description</th>
                  <th className="py-3 font-semibold">Amount</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Date</th>
                  <th className="py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dashboard.recentPayments.map((link) => (
                  <tr key={link.id} className="text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-400">{link.referenceNumber}</td>
                    <td className="py-4">
                      <p className="font-bold text-slate-200">{link.customerName || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500">{link.customerEmail || 'No Email'}</p>
                    </td>
                    <td className="py-4 text-slate-400">{link.description || 'No description'}</td>
                    <td className="py-4 font-bold text-slate-200">{formatCurrency(link.amount)}</td>
                    <td className="py-4">
                      {link.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : link.status === 'EXPIRED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full font-semibold">
                          <XCircle className="w-3 h-3" /> Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold">
                          <Clock className="w-3 h-3 animate-pulse" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-slate-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/pay/${link.referenceNumber}`}
                        className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700/80 rounded-lg text-slate-300 hover:text-white font-semibold transition-all inline-flex items-center gap-1"
                      >
                        Checkout View <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-500 font-medium">
              No invoice payments generated yet. Go to Payment Links to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
