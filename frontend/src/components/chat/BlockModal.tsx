import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface BlockModalProps {
  userName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({ userName, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
          <h3 className="text-lg font-bold text-slate-100">Block {userName}?</h3>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          Blocked users will no longer be able to send you messages or view your online status on ApexPay.
        </p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Reason (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Spam, harassment, inappropriate behavior..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg transition"
          >
            Block User
          </button>
        </div>
      </div>
    </div>
  );
};
