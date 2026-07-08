'use client';

import React, { useState } from 'react';
import { 
  useWalletQuery, 
  useWalletSummaryQuery, 
  useLedgerQuery, 
  useWalletAnalyticsQuery,
  useWallet
} from '@/hooks/useWallet';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet as WalletIcon, 
  History, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  MinusCircle, 
  Loader2, 
  AlertCircle,
  X,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useWalletQuery();
  const { data: summary, isLoading: summaryLoading } = useWalletSummaryQuery();
  const { data: ledger, isLoading: ledgerLoading } = useLedgerQuery();
  const { data: analytics, isLoading: analyticsLoading } = useWalletAnalyticsQuery();

  const { addMoney, isAddingMoney, addMoneyError, addMoneyResponse, withdraw, isWithdrawing, withdrawError, withdrawResponse } = useWallet();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const [addAmount, setAddAmount] = useState('');
  const [fundingSource, setFundingSource] = useState('Savings Bank Account');
  
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet?.currency || 'USD' }).format(val);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) return;
    addMoney({ amount: amt, fundingSource });
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;
    withdraw({ amount: amt });
  };

  const closeModals = () => {
    setIsAddOpen(false);
    setIsWithdrawOpen(false);
    setAddAmount('');
    setWithdrawAmount('');
  };

  const loading = walletLoading || summaryLoading || ledgerLoading || analyticsLoading;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <span>Loading wallet ledger...</span>
      </div>
    );
  }

  // Calculate remaining limits
  const remainingDailyWithdrawal = wallet ? Math.max(0, wallet.dailyWithdrawalLimit - (summary?.dailySpentToday || 0)) : 0;
  const remainingMonthlyWithdrawal = wallet ? Math.max(0, wallet.monthlyWithdrawalLimit - (summary?.monthlySpentThisMonth || 0)) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Wallet Management</h2>
          <p className="text-xs text-slate-400 mt-1">Manage your digital balance, link bank top-ups, and withdraw settlements.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Add Money
          </button>
          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="flex items-center gap-2 bg-slate-900 border border-white/5 hover:border-white/10 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all"
          >
            <MinusCircle className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Grid: Balance Card and Spend Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 border border-white/10 rounded-3xl p-6.5 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <WalletIcon className="w-3.5 h-3.5" /> ApexPay Wallet
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase ${
                wallet?.walletStatus === 'ACTIVE' 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}>
                {wallet?.walletStatus}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Available Settlement Balance</span>
              <h2 className="text-3xl font-black text-white mt-1">{formatCurrency(wallet?.availableBalance)}</h2>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
            <span>No: <span className="font-mono text-slate-350">{wallet?.walletNumber}</span></span>
            <span>Currency: <span className="text-slate-350 uppercase">{wallet?.currency}</span></span>
          </div>
        </motion.div>

        {/* Dynamic withdrawal limits card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900/40 border border-white/5 rounded-3xl p-6.5 space-y-4 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Remaining Withdrawal Limits</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Daily Limit remaining</span>
                <span className="text-slate-200 font-semibold">{formatCurrency(remainingDailyWithdrawal)} / <span className="text-slate-500">{formatCurrency(wallet?.dailyWithdrawalLimit)}</span></span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-indigo-500 h-full rounded-full" 
                  style={{ width: `${wallet ? ((wallet.dailyWithdrawalLimit - remainingDailyWithdrawal) / wallet.dailyWithdrawalLimit) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Monthly Limit remaining</span>
                <span className="text-slate-200 font-semibold">{formatCurrency(remainingMonthlyWithdrawal)} / <span className="text-slate-500">{formatCurrency(wallet?.monthlyWithdrawalLimit)}</span></span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-purple-500 h-full rounded-full" 
                  style={{ width: `${wallet ? ((wallet.monthlyWithdrawalLimit - remainingMonthlyWithdrawal) / wallet.monthlyWithdrawalLimit) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Spent widgets */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/40 border border-white/5 rounded-3xl p-6.5 grid grid-cols-2 gap-4"
        >
          <div className="bg-slate-950/40 p-4 border border-white/5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Spent Today</span>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-white">{formatCurrency(summary?.dailySpentToday)}</h4>
              <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Withdrawal
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 border border-white/5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Additions (Month)</span>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-white">{formatCurrency(summary?.monthlyCredits)}</h4>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingDown className="w-3 h-3" /> Credits
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section: Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Credits', value: analytics?.totalCredits, icon: ArrowDownLeft, color: 'text-emerald-400' },
          { title: 'Total Debits', value: analytics?.totalDebits, icon: ArrowUpRight, color: 'text-rose-500' },
          { title: 'Average Transaction', value: analytics?.averageTransactionAmount, icon: TrendingUp, color: 'text-indigo-400' },
          { title: 'Largest Transaction', value: analytics?.largestTransaction, icon: TrendingUp, color: 'text-purple-400' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900/20 border border-white/5 rounded-2xl p-4.5"
            >
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{stat.title}</span>
              <div className="flex justify-between items-end mt-3">
                <span className="text-base font-extrabold text-white">{formatCurrency(stat.value)}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Ledger Entries Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Wallet Ledger</h3>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
          {!ledger || ledger.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No wallet activity recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider text-[9px] font-bold bg-slate-950/20">
                    <th className="p-4 pl-6">Reference</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Balance Range</th>
                    <th className="p-4">Date/Time</th>
                    <th className="p-4">Remarks</th>
                    <th className="p-4 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {ledger.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-mono text-slate-400">{item.referenceNumber}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          item.transactionType === 'ADD_MONEY'
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {item.transactionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`p-4 font-bold ${
                        item.transactionType === 'ADD_MONEY' ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {item.transactionType === 'ADD_MONEY' ? '+' : '-'}{formatCurrency(item.amount)}
                      </td>
                      <td className="p-4 text-slate-500">
                        {formatCurrency(item.balanceBefore)} &rarr; {formatCurrency(item.balanceAfter)}
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-500">
                        {new Date(item.timestamp).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">{item.remarks}</td>
                      <td className="p-4 pr-6 text-right font-semibold">
                        <span className="text-emerald-400 uppercase text-[9px] font-extrabold">{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Money Modal Overlay */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModals}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-md relative z-10 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <PlusCircle className="w-5 h-5" />
                  <h3 className="text-lg font-black text-white">Add Simulated Money</h3>
                </div>
                <button onClick={closeModals} className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {addMoneyResponse?.success && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-350 text-xs flex gap-2.5 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Receipt Generated</p>
                    <p className="mt-1">Ref: <span className="font-mono">{addMoneyResponse.data?.transactionReference}</span></p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Updated balance: {formatCurrency(addMoneyResponse.data?.balanceAfter)}</p>
                  </div>
                </div>
              )}

              {addMoneyError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2 items-start">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{(addMoneyError as any).response?.data?.message || 'Transaction failed. Check input details.'}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Add Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="w-4.5 h-4.5 text-slate-650 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="50.00"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Funding Source (Simulated)</label>
                  <select 
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Savings Bank Account">Chase Savings (xxxx-9821)</option>
                    <option value="Checking Bank Account">Citi checking (xxxx-1209)</option>
                    <option value="Linked Debit Card">Visa Debit (xxxx-4432)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAddingMoney}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold text-sm py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {isAddingMoney ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Add Money'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal Overlay */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModals}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-md relative z-10 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <MinusCircle className="w-5 h-5" />
                  <h3 className="text-lg font-black text-white">Process Settlement Withdrawal</h3>
                </div>
                <button onClick={closeModals} className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {withdrawResponse?.success && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-355 text-xs flex gap-2.5 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Withdrawal Receipt Generated</p>
                    <p className="mt-1">Ref: <span className="font-mono">{withdrawResponse.data?.transactionReference}</span></p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Updated balance: {formatCurrency(withdrawResponse.data?.balanceAfter)}</p>
                  </div>
                </div>
              )}

              {withdrawError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2 items-start">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{(withdrawError as any).response?.data?.message || 'Withdrawal failed. Check balance and limit constraints.'}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Withdraw Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="w-4.5 h-4.5 text-slate-650 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="25.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                    <span>Available: {formatCurrency(wallet?.availableBalance)}</span>
                    <span>Max Daily Remaining: {formatCurrency(remainingDailyWithdrawal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isWithdrawing}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold text-sm py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Withdrawal'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
