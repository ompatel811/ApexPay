import React from 'react';
import { QrCode, ArrowRight } from 'lucide-react';

interface SharedQRCardProps {
  qrCodeContent: string;
  senderName: string;
  isMe: boolean;
}

export const SharedQRCard: React.FC<SharedQRCardProps> = ({ qrCodeContent, senderName, isMe }) => {
  return (
    <div className={`my-2 p-4 rounded-3xl w-64 shadow-xl border backdrop-blur-md ${
      isMe ? 'bg-slate-900 border-slate-700 text-white ml-auto' : 'bg-slate-900 border-slate-700 text-white mr-auto'
    }`}>
      <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-800 text-xs text-slate-300">
        <QrCode className="w-4 h-4 text-blue-400" />
        <span className="font-semibold">{isMe ? 'You shared a QR code' : `${senderName} shared a QR code`}</span>
      </div>

      <div className="bg-white p-3 rounded-2xl flex items-center justify-center shadow-inner my-2">
        <div className="text-center font-mono text-[10px] text-slate-800 break-all p-2 bg-slate-100 rounded-xl">
          {qrCodeContent}
        </div>
      </div>

      {!isMe && (
        <button
          type="button"
          onClick={() => alert(`Initiating payment for QR: ${qrCodeContent}`)}
          className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-2xl transition flex items-center justify-center space-x-1"
        >
          <span>Pay using QR</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
