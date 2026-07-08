'use client';

import React, { useState } from 'react';
import { reportService, AccountStatement } from '@/services/reportService';
import { 
  Calendar, FileText, Download, ArrowUpRight, ArrowDownLeft, Search, Filter, 
  Loader2, AlertCircle, RefreshCw, Layers, DollarSign, Tag, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'ALL', 'FOOD', 'SHOPPING', 'TRAVEL', 'RECHARGE', 'UTILITIES', 
  'BILLS', 'MEDICAL', 'EDUCATION', 'INVESTMENT', 'ENTERTAINMENT', 
  'SALARY', 'TRANSFER', 'OTHER'
];

export default function ReportsAndStatementsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filters State
  const [category, setCategory] = useState('ALL');
  const [direction, setDirection] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const [statement, setStatement] = useState<AccountStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<'CSV' | 'EXCEL' | 'PDF' | null>(null);
  const [error, setError] = useState('');

  const handleGenerateStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatement(null);
    setLoading(true);

    try {
      const data = await reportService.generateStatement(startDate, endDate);
      setStatement(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve statement records.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'CSV' | 'EXCEL' | 'PDF') => {
    setExportLoading(format);
    try {
      const blob = await reportService.exportTransactions(format, startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const ext = format === 'CSV' ? 'csv' : format === 'PDF' ? 'pdf' : 'xls';
      link.setAttribute('download', `statement_${startDate}_to_${endDate}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download export file. Please try again.');
    } finally {
      setExportLoading(null);
    }
  };

  // Perform client-side filter for fine-grained selections
  const getFilteredTransactions = () => {
    if (!statement) return [];
    
    return statement.transactions.filter((tx) => {
      // 1. Category filter
      if (category !== 'ALL' && tx.category !== category) return false;
      
      // 2. Direction filter
      if (direction !== 'ALL' && tx.direction !== direction) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = tx.transactionReference.toLowerCase().includes(q);
        const descMatch = tx.description.toLowerCase().includes(q);
        const catMatch = tx.category.toLowerCase().includes(q);
        if (!refMatch && !descMatch && !catMatch) return false;
      }

      // 4. Amount Range filter
      const amt = tx.amount;
      if (minAmount && amt < parseFloat(minAmount)) return false;
      if (maxAmount && amt > parseFloat(maxAmount)) return false;

      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Financial Reports & Statements</h1>
        <p className="text-slate-400 text-xs mt-1">Generate comprehensive accounts audits, run filters, and export formatted CSV/Excel/PDF records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Filter Controls Form */}
        <div className="lg:col-span-1 space-y-5">
          
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" /> Date Range & Core Params
            </h3>

            <form onSubmit={handleGenerateStatement} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 font-bold text-xs rounded-xl transition-all text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Statement
              </button>
            </form>
          </div>

          {/* Transaction Filters Panel */}
          {statement && (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" /> Filter Criteria
              </h3>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ref, remarks, desc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Direction Filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Flows</option>
                  <option value="DEBIT">Debits (Outbound)</option>
                  <option value="CREDIT">Credits (Inbound)</option>
                </select>
              </div>

              {/* Amount Range */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Amount Range ($)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Statement Display & Exports */}
        <div className="lg:col-span-2 space-y-5">
          
          <AnimatePresence mode="wait">
            {!statement ? (
              <motion.div
                key="empty-statement"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-16 text-center flex flex-col items-center justify-center h-80"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-500 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm">No Statement Generated</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Please select a date range on the left and click **Generate Statement** to compile financial summaries.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="statement-viewer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                
                {/* Statement Summary Card */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                  
                  {/* Export Controls Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <div>
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Statement Summary</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{statement.summaryPeriod}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExport('CSV')}
                        disabled={!!exportLoading}
                        className="flex items-center gap-1 p-1.5 px-3 bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-white/10 rounded-lg text-[9px] font-bold text-slate-300 transition-all cursor-pointer"
                      >
                        {exportLoading === 'CSV' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        CSV
                      </button>
                      <button
                        onClick={() => handleExport('EXCEL')}
                        disabled={!!exportLoading}
                        className="flex items-center gap-1 p-1.5 px-3 bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-white/10 rounded-lg text-[9px] font-bold text-slate-300 transition-all cursor-pointer"
                      >
                        {exportLoading === 'EXCEL' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Excel
                      </button>
                      <button
                        onClick={() => handleExport('PDF')}
                        disabled={!!exportLoading}
                        className="flex items-center gap-1 p-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[9px] font-bold text-white transition-all cursor-pointer"
                      >
                        {exportLoading === 'PDF' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        PDF Report
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Opening Balance</span>
                      <span className="text-sm font-extrabold text-slate-200">${statement.openingBalance.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Closing Balance</span>
                      <span className="text-sm font-extrabold text-white">${statement.closingBalance.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Credits Sum (In)</span>
                      <span className="text-sm font-extrabold text-emerald-400">+${statement.creditsSum.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Debits Sum (Out)</span>
                      <span className="text-sm font-extrabold text-rose-400">-${statement.debitsSum.toFixed(2)}</span>
                    </div>
                  </div>

                </div>

                {/* Filtered Transactions Timeline List */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Transaction Records</h4>
                    <span className="text-[10px] text-slate-500 font-bold">{filteredTransactions.length} items matched</span>
                  </div>

                  <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {filteredTransactions.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-10 font-bold">No transactions match current filters.</p>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <div 
                          key={tx.transactionReference} 
                          className="flex items-start justify-between p-3.5 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-slate-950/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${tx.direction === 'CREDIT' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <h5 className="text-xs font-bold text-slate-200 truncate">{tx.description}</h5>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-500 font-bold font-mono">
                              <span>Ref: {tx.transactionReference}</span>
                              <span>•</span>
                              <span>{new Date(tx.timestamp).toLocaleString()}</span>
                            </div>
                            <span className="inline-block mt-2 text-[8px] bg-slate-950/50 border border-white/5 px-2 py-0.5 rounded-md font-bold uppercase text-slate-400 tracking-wider">
                              {tx.category}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-extrabold ${tx.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {tx.direction === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </span>
                            <span className="block text-[8px] text-emerald-400 font-bold uppercase mt-1">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
