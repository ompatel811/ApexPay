'use client';

import React, { useState } from 'react';
import { useTransactionHistoryQuery } from '@/hooks/usePayment';
import { useWalletQuery } from '@/hooks/useWallet';
import { PaymentReceiptCard } from '@/components/PaymentReceiptCard';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const { data: wallet } = useWalletQuery();
  const { data: history, isLoading, isError } = useTransactionHistoryQuery(page, 10);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet?.currency || 'USD' }).format(val);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNextPage = () => {
    if (history && page < history.totalPages - 1) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1);
    }
  };

  // Find currently selected transaction object
  const selectedTx = history?.transactions.find(tx => tx.id === selectedTxId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white">Payment Ledger</h2>
        <p className="text-xs text-slate-400 mt-1">Immutable settlement timelines and audited transactional records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* History List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <span>Loading settlement ledger...</span>
              </div>
            ) : isError ? (
              <div className="p-12 text-center text-rose-400 flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8" />
                <span>Failed to retrieve transactions. Check api status.</span>
              </div>
            ) : !history || history.transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No transactions recorded in this wallet ledger yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.transactions.map((tx) => {
                  const isDebit = tx.senderWalletNumber === wallet?.walletNumber;
                  const isPending = tx.status === 'PENDING' || tx.status === 'PROCESSING';
                  const isFailed = tx.status === 'FAILED' || tx.status === 'CANCELLED';

                  return (
                    <div 
                      key={tx.id} 
                      onClick={() => setSelectedTxId(tx.id)}
                      className={`p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.015] transition-colors ${
                        selectedTxId === tx.id ? 'bg-white/[0.015]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Status Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                          isDebit 
                            ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' 
                            : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                        }`}>
                          {isDebit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {isDebit 
                              ? `Paid to ${tx.receiverName}` 
                              : `Received from ${tx.senderName}`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{tx.referenceNumber}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold ${isDebit ? 'text-slate-200' : 'text-emerald-400 font-extrabold'}`}>
                          {isDebit ? '-' : '+'}{formatCurrency(tx.amount)}
                        </div>
                        
                        {/* Status Pill */}
                        <span className={`inline-block text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border mt-1.5 ${
                          isPending 
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                            : isFailed 
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination controls */}
          {history && history.totalPages > 1 && (
            <div className="flex justify-between items-center px-2 text-xs">
              <span className="text-slate-500">
                Page {page + 1} of {history.totalPages} ({history.totalItems} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 disabled:opacity-30 flex items-center justify-center cursor-pointer text-slate-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={page >= history.totalPages - 1}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 disabled:opacity-30 flex items-center justify-center cursor-pointer text-slate-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Receipt Sidebar Panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedTx ? (
              <motion.div
                key={selectedTx.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Selected Transaction</span>
                  <button 
                    onClick={() => setSelectedTxId(null)}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    Clear <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <PaymentReceiptCard 
                  receipt={{
                    referenceNumber: selectedTx.referenceNumber,
                    transactionId: selectedTx.id,
                    senderName: selectedTx.senderName,
                    senderWalletNumber: selectedTx.senderWalletNumber,
                    receiverName: selectedTx.receiverName,
                    receiverWalletNumber: selectedTx.receiverWalletNumber,
                    amount: selectedTx.amount,
                    currency: selectedTx.currency,
                    status: selectedTx.status,
                    timestamp: selectedTx.createdAt,
                    remarks: selectedTx.remarks
                  }} 
                />
              </motion.div>
            ) : (
              <div className="bg-slate-900/10 border border-dashed border-white/5 rounded-3xl p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-80">
                <FileText className="w-8 h-8 text-slate-650 mb-3" />
                <span>Select a ledger entry to inspect the double-entry audit logs and compile receipts.</span>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
