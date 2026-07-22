import React from 'react';
import { FileText, Download } from 'lucide-react';

interface SharedReceiptCardProps {
  transactionReference: string;
  amount: number;
  receiptUrl: string;
  senderName: string;
  isMe: boolean;
}

export const SharedReceiptCard: React.FC<SharedReceiptCardProps> = ({
  transactionReference,
  amount,
  receiptUrl,
  senderName,
  isMe
}) => {
  return (
    <div className={`my-2 p-4 rounded-3xl w-72 shadow-xl border backdrop-blur-md ${
      isMe ? 'bg-slate-900 border-slate-700 text-white ml-auto' : 'bg-slate-900 border-slate-700 text-white mr-auto'
    }`}>
      <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800 text-xs text-slate-300">
        <FileText className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold">{isMe ? 'You shared a receipt' : `${senderName} shared a receipt`}</span>
      </div>

      <div className="p-3 bg-slate-800/80 rounded-2xl mb-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Ref No:</span>
          <span className="font-mono text-slate-200">{transactionReference}</span>
        </div>
        <div className="flex justify-between text-slate-400 font-bold text-sm pt-1">
          <span>Amount:</span>
          <span className="text-emerald-400">${Number(amount).toFixed(2)}</span>
        </div>
      </div>

      <a
        href={receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-2xl transition flex items-center justify-center space-x-1.5 shadow-md"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download Receipt</span>
      </a>
    </div>
  );
};
