'use client';

import React from 'react';
import { PaymentReceiptResponse } from '@/services/paymentService';
import { CheckCircle2, ShieldCheck, Printer, Calendar, FileText, ArrowRight, DollarSign, Wallet } from 'lucide-react';

interface PaymentReceiptCardProps {
  receipt: PaymentReceiptResponse;
}

export function PaymentReceiptCard({ receipt }: PaymentReceiptCardProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: receipt.currency || 'USD' }).format(val);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Printable Area Wrapper */}
      <div id="payment-receipt-print" className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6.5 max-w-xl mx-auto shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 print:hidden" />
        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />
        
        {/* Success header */}
        <div className="flex flex-col items-center text-center py-6 border-b border-white/5 print:border-slate-200">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3.5 print:bg-emerald-100 print:text-emerald-700">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white print:text-slate-900 uppercase tracking-wide">Transaction Settled</h3>
          <p className="text-xs text-slate-400 mt-1 print:text-slate-500">ApexPay Internal Ledger Entry</p>
          <div className="text-3xl font-black text-white mt-4 print:text-slate-900">{formatAmount(receipt.amount)}</div>
        </div>

        {/* Transfer Grid (Sender to Receiver) */}
        <div className="py-6 border-b border-white/5 print:border-slate-200 grid grid-cols-5 items-center gap-2">
          {/* Sender */}
          <div className="col-span-2 text-center">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold block mb-1">Debited From</span>
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/5 mx-auto flex items-center justify-center text-indigo-400 font-bold mb-2 print:bg-slate-100 print:text-indigo-900">
              S
            </div>
            <div className="text-xs font-bold text-white print:text-slate-800 truncate">{receipt.senderName}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 print:text-slate-600">{receipt.senderWalletNumber}</div>
          </div>

          {/* Arrow */}
          <div className="col-span-1 flex justify-center text-indigo-400 print:text-indigo-800">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Receiver */}
          <div className="col-span-2 text-center">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold block mb-1">Credited To</span>
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/5 mx-auto flex items-center justify-center text-purple-400 font-bold mb-2 print:bg-slate-100 print:text-purple-900">
              R
            </div>
            <div className="text-xs font-bold text-white print:text-slate-800 truncate">{receipt.receiverName}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 print:text-slate-600">{receipt.receiverWalletNumber}</div>
          </div>
        </div>

        {/* Receipt metadata */}
        <div className="py-6 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Transaction ID</span>
            <span className="text-slate-300 font-mono print:text-slate-900">{receipt.transactionId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold flex items-center gap-1.5"><FileText className="w-4 h-4" /> Reference Code</span>
            <span className="text-slate-300 font-mono font-bold print:text-slate-900">{receipt.referenceNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Timestamp</span>
            <span className="text-slate-300 print:text-slate-900">{formatDateTime(receipt.timestamp)}</span>
          </div>

          {receipt.remarks && (
            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4.5 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold block mb-1">Remarks</span>
              <span className="text-slate-350 print:text-slate-800">{receipt.remarks}</span>
            </div>
          )}
        </div>

        {/* Audit Disclaimer Footer */}
        <div className="pt-6 border-t border-white/5 print:border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400/80" /> Cryptographically audited digital ledger copy.
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 border border-white/5 hover:border-white/10 hover:bg-slate-950 text-slate-200 text-xs font-bold px-5 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-md"
        >
          <Printer className="w-4 h-4 text-indigo-400" /> Print Receipt
        </button>
      </div>

      {/* Print Specific Styles injected dynamically */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #payment-receipt-print, #payment-receipt-print * {
            visibility: visible;
          }
          #payment-receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
