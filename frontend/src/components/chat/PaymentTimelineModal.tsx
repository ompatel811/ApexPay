import React, { useEffect, useState } from 'react';
import { X, History, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { PaymentTimelineResponse, paymentChatService } from '@/services/paymentChatService';

interface PaymentTimelineModalProps {
  conversationId: string;
  onClose: () => void;
}

export const PaymentTimelineModal: React.FC<PaymentTimelineModalProps> = ({ conversationId, onClose }) => {
  const [timeline, setTimeline] = useState<PaymentTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentChatService.getTimeline(conversationId)
      .then((res) => setTimeline(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [conversationId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-blue-400 mb-4">
          <History className="w-6 h-6" />
          <h3 className="text-lg font-bold text-slate-100">Payment Timeline & History</h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading payment history...</div>
        ) : !timeline || (timeline.paymentMessages.length === 0 && timeline.paymentRequests.length === 0) ? (
          <div className="py-12 text-center text-xs text-slate-500">No payment transactions recorded in this chat yet.</div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {timeline.paymentMessages.map((pm) => (
              <div key={pm.id} className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100">${Number(pm.amount).toFixed(2)}</h4>
                    <p className="text-[10px] text-slate-400">{pm.senderName} ➔ {pm.receiverName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    {pm.status}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {new Date(pm.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {timeline.paymentRequests.map((pr) => (
              <div key={pr.id} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-300">Request: ${Number(pr.amount).toFixed(2)}</h4>
                    <p className="text-[10px] text-slate-400">{pr.reason || 'Money request'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    {pr.status}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {new Date(pr.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
