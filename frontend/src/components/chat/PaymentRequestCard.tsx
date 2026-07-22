import React from 'react';
import { DollarSign, Clock, Check, X, Ban } from 'lucide-react';
import { PaymentRequestResponse, paymentChatService } from '@/services/paymentChatService';

interface PaymentRequestCardProps {
  request: PaymentRequestResponse;
  currentUserId: string;
  onStatusUpdate: () => void;
}

export const PaymentRequestCard: React.FC<PaymentRequestCardProps> = ({ request, currentUserId, onStatusUpdate }) => {
  const isRequester = request.requesterId === currentUserId;
  const isPending = request.status === 'PENDING';

  const handleAccept = async () => {
    try {
      await paymentChatService.acceptRequest(request.id);
      onStatusUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await paymentChatService.rejectRequest(request.id);
      onStatusUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    try {
      await paymentChatService.cancelRequest(request.id);
      onStatusUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`my-2 p-4 rounded-3xl w-72 sm:w-80 shadow-xl border backdrop-blur-md transition-all ${
      isRequester
        ? 'bg-slate-900/90 border-slate-700/60 text-slate-100 ml-auto'
        : 'bg-gradient-to-br from-amber-950/40 to-slate-900/90 border-amber-500/30 text-slate-100 mr-auto'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              {isRequester ? `Requested from ${request.receiverName}` : `${request.requesterName} requested money`}
            </span>
            {request.reason && <span className="text-[10px] text-amber-300 block truncate">{request.reason}</span>}
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          request.status === 'PENDING'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : request.status === 'ACCEPTED'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          {request.status}
        </span>
      </div>

      {/* Amount Display */}
      <div className="py-2 text-center">
        <div className="text-3xl font-extrabold tracking-tight text-amber-300">
          ${Number(request.amount).toFixed(2)}
        </div>
      </div>

      {/* Action Buttons for Pending Request */}
      {isPending && (
        <div className="mt-3 flex items-center space-x-2">
          {!isRequester ? (
            <>
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold rounded-2xl border border-slate-700 transition flex items-center justify-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Pay ${Number(request.amount).toFixed(2)}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-2xl border border-slate-700 transition flex items-center justify-center space-x-1"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Request</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
