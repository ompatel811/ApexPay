import React from 'react';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { PaymentMessageResponse } from '@/services/paymentChatService';

interface PaymentCardProps {
  payment: PaymentMessageResponse;
  isMe: boolean;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment, isMe }) => {
  return (
    <div
      className={`my-2 p-4 rounded-3xl w-72 sm:w-80 shadow-xl border backdrop-blur-md transition-all ${
        isMe
          ? 'bg-gradient-to-br from-blue-900/90 to-indigo-950/90 border-blue-500/40 text-white ml-auto'
          : 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/60 text-slate-100 mr-auto'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-xl ${isMe ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {isMe ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-300 block">
              {isMe ? `Payment to ${payment.receiverName}` : `Payment from ${payment.senderName}`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{payment.referenceNumber || 'Ref: Direct'}</span>
          </div>
        </div>

        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </span>
      </div>

      {/* Amount Display */}
      <div className="py-2 text-center">
        <div className="text-3xl font-extrabold tracking-tight text-white">
          ${Number(payment.amount).toFixed(2)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>ApexPay Instant Transfer</span>
        </div>
      </div>

      {/* Receipt Link */}
      {payment.receiptUrl && (
        <a
          href={payment.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center space-x-1.5 w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-blue-400 rounded-2xl border border-slate-700/60 transition"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Receipt</span>
        </a>
      )}
    </div>
  );
};
